import * as React from "react";
import { apiClient } from "@/lib/api-client";
import { AxiosError } from "axios";
import { Vehicle, ShippingQuoteFormData } from "@/types/inventory";
import { Shipment, Quote, ShipmentStats } from "@/types/transportation";
import { useAuth } from "@/providers/AuthProvider";
import { initializeSocket } from "@/lib/socket.client";

export interface TransportationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const PER_PAGE_OPTIONS = [3, 5, 7] as const;
export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number];

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractPaginatedItems<T>(raw: any, arrayKey?: string): { items: T[]; pagination: TransportationPagination | null } {
  if (raw && !Array.isArray(raw) && raw.pagination) {
    const items: T[] = (arrayKey ? raw[arrayKey] : null) || raw.data || raw.items || [];
    return { items, pagination: raw.pagination };
  }
  if (Array.isArray(raw)) {
    return { items: raw, pagination: null };
  }
  return { items: [], pagination: null };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTransportationData() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSilentRefreshing, setIsSilentRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [shipmentsPagination, setShipmentsPagination] = React.useState<TransportationPagination | null>(null);
  const [shipmentsPage, setShipmentsPage] = React.useState(1);
  const [shipmentsLimit, setShipmentsLimit] = React.useState<PerPageOption>(5);

  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [quotesPagination, setQuotesPagination] = React.useState<TransportationPagination | null>(null);
  const [quotesPage, setQuotesPage] = React.useState(1);
  const [quotesLimit, setQuotesLimit] = React.useState<PerPageOption>(5);

  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [stats, setStats] = React.useState<ShipmentStats>({
    all: 0,
    "Available for Pickup": 0,
    Cancelled: 0,
    Delivered: 0,
    Dispatched: 0,
    "In-Route": 0,
  });
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [hasNewEntries, setHasNewEntries] = React.useState(false);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  // Keep current page/limit in refs so socket handler always sees latest values
  const shipmentsPageRef = React.useRef(shipmentsPage);
  const shipmentsLimitRef = React.useRef(shipmentsLimit);
  const quotesPageRef = React.useRef(quotesPage);
  const quotesLimitRef = React.useRef(quotesLimit);

  React.useEffect(() => { shipmentsPageRef.current = shipmentsPage; }, [shipmentsPage]);
  React.useEffect(() => { shipmentsLimitRef.current = shipmentsLimit; }, [shipmentsLimit]);
  React.useEffect(() => { quotesPageRef.current = quotesPage; }, [quotesPage]);
  React.useEffect(() => { quotesLimitRef.current = quotesLimit; }, [quotesLimit]);

  const isInitializedRef = React.useRef(false);

  // ── Vehicle transform ──────────────────────────────────────────────────────

  const transformVehicles = React.useCallback((vehicleData: any[]): Vehicle[] => {
    return vehicleData.map((v: any) => {
      let vehicleId: string;
      if (typeof v._id === "object" && v._id !== null) vehicleId = v._id.toString();
      else if (v.id) vehicleId = String(v.id);
      else if (v._id) vehicleId = String(v._id);
      else vehicleId = `temp-${Math.random()}`;

      return {
        id: vehicleId,
        stockNumber: v.stockNumber || "N/A",
        year: v.year || 0,
        make: v.make || "Unknown",
        model: v.modelName || v.model || "Unknown",
        trim: v.trim || "",
        price: v.price || 0,
        mileage: v.mileage || 0,
        vin: v.vin || "N/A",
        image: v.image || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
        location: v.location || "Unknown",
        color: v.color || "N/A",
        transmission: v.transmission || "Automatic",
        fuelType: v.fuelType || "Gasoline",
      };
    });
  }, []);

  // ── Auth header helper ─────────────────────────────────────────────────────

  const getAuthConfig = React.useCallback(async () => {
    const token = await getToken();
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [getToken]);

  // ── Fetch shipments (specific page+limit, no loading state) ───────────────

  const fetchShipments = React.useCallback(async (page: number, limit: number) => {
    const config = await getAuthConfig();
    if (!config) return;
    const res = await apiClient.get("/api/shipments", { ...config, params: { page, limit } });
    const raw = res.data?.data ?? res.data;
    const { items, pagination } = extractPaginatedItems<Shipment>(raw, "shipments");
    setShipments(items);
    setShipmentsPagination(pagination);
  }, [getAuthConfig]);

  // ── Fetch quotes (specific page+limit, no loading state) ──────────────────

  const fetchQuotes = React.useCallback(async (page: number, limit: number) => {
    const config = await getAuthConfig();
    if (!config) return;
    const res = await apiClient.get("/api/quotes", { ...config, params: { page, limit } });
    const raw = res.data?.data ?? res.data;
    const { items, pagination } = extractPaginatedItems<Quote>(raw, "quotes");
    setQuotes(items);
    setQuotesPagination(pagination);
  }, [getAuthConfig]);

  // ── Core fetch (initial + full refresh) ───────────────────────────────────

  const fetchData = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!isSignedIn) return;
    const silent = options?.silent ?? false;

    if (silent) setIsSilentRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const config = await getAuthConfig();
      if (!config) return;

      const [shipmentsRes, quotesRes, vehiclesRes, statsRes] = await Promise.all([
        apiClient.get("/api/shipments", { ...config, params: { page: shipmentsPageRef.current, limit: shipmentsLimitRef.current } }),
        apiClient.get("/api/quotes",   { ...config, params: { page: quotesPageRef.current,   limit: quotesLimitRef.current   } }),
        apiClient.get("/api/vehicles", { ...config, params: { status: "all", page: 1, limit: 1000 } }),
        apiClient.get("/api/shipments/stats", config),
      ]);

      const rawShipments = shipmentsRes.data?.data ?? shipmentsRes.data;
      const rawQuotes    = quotesRes.data?.data    ?? quotesRes.data;

      const { items: shipmentsData, pagination: shipsPag } = extractPaginatedItems<Shipment>(rawShipments, "shipments");
      const { items: quotesData,    pagination: quotesPag } = extractPaginatedItems<Quote>(rawQuotes, "quotes");

      setShipments(shipmentsData);
      setShipmentsPagination(shipsPag);
      setQuotes(quotesData);
      setQuotesPagination(quotesPag);

      const vehiclesResponse = vehiclesRes.data?.data ?? vehiclesRes.data;
      const vehicleData = vehiclesResponse?.vehicles || vehiclesResponse || [];
      setVehicles(transformVehicles(vehicleData));

      const statsData = statsRes.data?.data ?? statsRes.data;
      if (statsData && typeof statsData === "object") setStats(statsData);

      setLastUpdated(new Date());
      isInitializedRef.current = true;

    } catch (err) {
      const axiosError = err as AxiosError;
      const msg = (axiosError.response?.data as any)?.message || axiosError.message || "Failed to load data";
      setError(msg);
      if (!silent) { setShipments([]); setQuotes([]); setVehicles([]); }
    } finally {
      if (silent) setIsSilentRefreshing(false);
      else setIsLoading(false);
    }
  }, [getAuthConfig, transformVehicles, isSignedIn]);

  // ── Initial fetch ──────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  // ── Socket realtime ────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    const connectSocket = async () => {
      try {
        const token = await getToken();
        if (cancelled || !token) return;
        const sock = initializeSocket(token);

        sock.on("shipment:change", () => {
          if (cancelled) return;
          setIsSilentRefreshing(true);
          Promise.all([
            fetchShipments(shipmentsPageRef.current, shipmentsLimitRef.current),
            // also refresh stats
            getAuthConfig().then((cfg) => cfg
              ? apiClient.get("/api/shipments/stats", cfg).then((r) => {
                  const d = r.data?.data ?? r.data;
                  if (d && typeof d === "object") setStats(d);
                })
              : null
            ),
          ])
            .catch(() => {})
            .finally(() => { if (!cancelled) setIsSilentRefreshing(false); setLastUpdated(new Date()); setHasNewEntries(true); });
        });

        sock.on("quote:change", () => {
          if (cancelled) return;
          setIsSilentRefreshing(true);
          fetchQuotes(quotesPageRef.current, quotesLimitRef.current)
            .catch(() => {})
            .finally(() => { if (!cancelled) setIsSilentRefreshing(false); setLastUpdated(new Date()); setHasNewEntries(true); });
        });
      } catch { }
    };

    connectSocket();

    return () => {
      cancelled = true;
      const { getSocket } = require("@/lib/socket.client");
      const sock = getSocket();
      if (sock) {
        sock.off("shipment:change");
        sock.off("quote:change");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const dismissNewEntries = React.useCallback(() => setHasNewEntries(false), []);

  // ── Pagination setters — call fetch DIRECTLY (no extra render cycle) ───────

  const changeShipmentsPage = React.useCallback(async (page: number) => {
    setShipmentsPage(page);
    try { await fetchShipments(page, shipmentsLimitRef.current); } catch { }
  }, [fetchShipments]);

  const changeShipmentsLimit = React.useCallback(async (limit: PerPageOption) => {
    setShipmentsPage(1);
    setShipmentsLimit(limit);
    shipmentsLimitRef.current = limit;
    try { await fetchShipments(1, limit); } catch { }
  }, [fetchShipments]);

  const changeQuotesPage = React.useCallback(async (page: number) => {
    setQuotesPage(page);
    try { await fetchQuotes(page, quotesLimitRef.current); } catch { }
  }, [fetchQuotes]);

  const changeQuotesLimit = React.useCallback(async (limit: PerPageOption) => {
    setQuotesPage(1);
    setQuotesLimit(limit);
    quotesLimitRef.current = limit;
    try { await fetchQuotes(1, limit); } catch { }
  }, [fetchQuotes]);

  // ── Mutation handlers ──────────────────────────────────────────────────────

  const handleCalculateQuote = React.useCallback(async (formData: ShippingQuoteFormData) => {
    try {
      const isValidMongoId = formData.vehicleId && /^[0-9a-fA-F]{24}$/.test(formData.vehicleId);
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        fromZip: formData.fromZip,
        toZip: formData.zipCode,
        fromAddress: formData.fromAddress,
        toAddress: formData.fullAddress,
        units: formData.units,
        enclosedTrailer: formData.enclosedTrailer,
        vehicleInoperable: formData.vehicleInoperable,
      };
      if (isValidMongoId) payload.vehicleId = formData.vehicleId;
      if (formData.vehicleId) {
        const vehicle = vehicles.find((v) => v.id === formData.vehicleId);
        if (vehicle) {
          payload.vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
          payload.vehicleImage = vehicle.image;
          payload.vin = vehicle.vin;
          payload.stockNumber = vehicle.stockNumber;
          payload.vehicleLocation = vehicle.location;
        }
      }
      const config = await getAuthConfig();
      const response = await apiClient.post("/api/quotes", payload, config ?? undefined);
      const data = response.data?.data || response.data;
      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to create quote: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [vehicles, getAuthConfig]);

  const handleCreateShipment = React.useCallback(async (quoteId: string) => {
    try {
      const config = await getAuthConfig();
      await apiClient.post("/api/shipments", { quoteId, requestedPickupDate: new Date(), autoDeleteQuote: true }, config ?? undefined);
      setQuotes((prev) => prev.filter((q) => q._id !== quoteId));
      return true;
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to create shipment: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [getAuthConfig]);

  const handleDeleteQuote = React.useCallback(async (quoteId: string) => {
    try {
      const config = await getAuthConfig();
      await apiClient.delete(`/api/quotes/${quoteId}`, config ?? undefined);
      setQuotes((prev) => prev.filter((q) => q._id !== quoteId));
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to delete quote: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [getAuthConfig]);

  const handleDeleteShipment = React.useCallback(async (shipmentId: string) => {
    try {
      const config = await getAuthConfig();
      await apiClient.delete(`/api/shipments/${shipmentId}`, config ?? undefined);
      setShipments((prev) => prev.filter((s) => s._id !== shipmentId));
      setStats((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to delete shipment: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [getAuthConfig]);

  const handleUpdateQuote = React.useCallback(async (quoteId: string, updatedQuote: Partial<Quote>) => {
    try {
      const config = await getAuthConfig();
      const response = await apiClient.put(`/api/quotes/${quoteId}`, updatedQuote, config ?? undefined);
      const data = response.data?.data ?? response.data;
      setQuotes((prev) => prev.map((q) => q._id === quoteId ? { ...q, ...data } : q));
      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to update quote: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [getAuthConfig]);

  const handleUpdateShipment = React.useCallback(async (shipmentId: string, updatedShipment: Partial<Shipment>) => {
    try {
      const config = await getAuthConfig();
      const response = await apiClient.put(`/api/shipments/${shipmentId}`, updatedShipment, config ?? undefined);
      const data = response.data?.data ?? response.data;
      setShipments((prev) => prev.map((s) => s._id === shipmentId ? { ...s, ...data } : s));
      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      throw new Error("Failed to update shipment: " + ((axiosError.response?.data as any)?.message || axiosError.message || "Unknown error"));
    }
  }, [getAuthConfig]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    isLoading,
    isSilentRefreshing,
    error,
    shipments,
    shipmentsPagination,
    shipmentsPage,
    shipmentsLimit,
    changeShipmentsPage,
    changeShipmentsLimit,
    quotes,
    quotesPagination,
    quotesPage,
    quotesLimit,
    changeQuotesPage,
    changeQuotesLimit,
    vehicles,
    stats,
    lastUpdated,
    hasNewEntries,
    dismissNewEntries,
    fetchData,
    handleCalculateQuote,
    handleCreateShipment,
    handleDeleteQuote,
    handleDeleteShipment,
    handleUpdateQuote,
    handleUpdateShipment,
  };
}
