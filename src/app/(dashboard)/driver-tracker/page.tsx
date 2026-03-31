"use client";

import * as React from "react";
import { MapPin, Clock, Users, Radio, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/providers/AuthProvider";
import { DriverTrackingItem, DriverStatus } from "@/types/driver-tracking";
import { Shipment } from "@/types/transportation";
import { DriverTrackerMap } from "@/components/driver-tracker/DriverTrackerMap";
import { DriverTrackerShareCard } from "@/components/driver-tracker/DriverTrackerShareCard";
import { DriverTrackerLoadsCard } from "@/components/driver-tracker/DriverTrackerLoadsCard";
import { DriverTrackerListCard } from "@/components/driver-tracker/DriverTrackerListCard";
import { DriverAssignLoadModal } from "@/components/driver-tracker/DriverAssignLoadModal";
import { DriverTrackerAvailableLoadsCard } from "@/components/driver-tracker/DriverTrackerAvailableLoadsCard";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { initializeSocket, getSocket, disconnectSocket } from "@/lib/socket.client";

type FilterKey = "all" | "active" | "offline";

const statusLabel: Record<DriverStatus, string> = {
  "on-route": "On Route",
  idle: "Idle",
  "on-break": "On Break",
  waiting: "Waiting",
  offline: "Offline",
};

const statusStyles: Record<DriverStatus, string> = {
  "on-route": "bg-emerald-500",
  idle: "bg-amber-500",
  "on-break": "bg-slate-500",
  waiting: "bg-blue-500",
  offline: "bg-slate-400",
};

const statusText: Record<DriverStatus, string> = {
  "on-route": "text-emerald-600",
  idle: "text-amber-600",
  "on-break": "text-slate-600",
  waiting: "text-blue-600",
  offline: "text-slate-500",
};

const mapPinColor: Record<DriverStatus, string> = {
  "on-route": "#10b981",
  idle: "#f59e0b",
  "on-break": "#64748b",
  waiting: "#3b82f6",
  offline: "#94a3b8",
};

const LOCATION_INTERVAL_MS = 10000;
const MAP_CENTER = { lat: 39.8283, lng: -98.5795 };

export default function DriverTrackerPage() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const isDriver = user?.role === "driver";
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [driverQuery, setDriverQuery] = React.useState("");
  const [drivers, setDrivers] = React.useState<DriverTrackingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareStatus, setShareStatus] =
    React.useState<DriverStatus>("on-route");
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [lastShareAt, setLastShareAt] = React.useState<string | null>(null);
  const [mapNotice, setMapNotice] = React.useState<string | null>(null);
  const [availableShipments, setAvailableShipments] = React.useState<
    Shipment[]
  >([]);
  const [shipmentsLoading, setShipmentsLoading] = React.useState(false);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [assigningTo, setAssigningTo] =
    React.useState<DriverTrackingItem | null>(null);

  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<Map<string, any>>(new Map());
  const popupsRef = React.useRef<Map<string, any>>(new Map());
  const watchIdRef = React.useRef<number | null>(null);
  const lastSentRef = React.useRef<number>(0);
  const lastCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const hasFlownRef = React.useRef<boolean>(false);
  const locationNamesRef = React.useRef<Map<string, string>>(new Map());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const normalizedToken = mapboxToken?.trim();

  const filteredDrivers = React.useMemo(() => {
    const query = driverQuery.trim().toLowerCase();
    const matchesQuery = (driver: DriverTrackingItem) => {
      if (!query) return true;
      const name = driver.driver?.name?.toLowerCase() || "";
      const tracking =
        driver.shipments
          ?.map((s) => s.trackingNumber?.toLowerCase() || "")
          .join(" ") || "";
      return name.includes(query) || tracking.includes(query);
    };
    if (filter === "offline") {
      return drivers.filter(
        (driver) => driver.status === "offline" && matchesQuery(driver),
      );
    }
    if (filter === "active") {
      return drivers.filter(
        (driver) => driver.status !== "offline" && matchesQuery(driver),
      );
    }
    return drivers.filter(matchesQuery);
  }, [drivers, filter, driverQuery]);

  const activeDrivers = React.useMemo(() => {
    const query = driverQuery.trim().toLowerCase();
    const matchesQuery = (driver: DriverTrackingItem) => {
      if (!query) return true;
      const name = driver.driver?.name?.toLowerCase() || "";
      const tracking =
        driver.shipments
          ?.map((s) => s.trackingNumber?.toLowerCase() || "")
          .join(" ") || "";
      return name.includes(query) || tracking.includes(query);
    };
    return drivers.filter((d) => d.status !== "offline" && matchesQuery(d));
  }, [drivers, driverQuery]);

  const driversWithLoads = React.useMemo(
    () => drivers.filter((d) => d.shipments && d.shipments.length > 0),
    [drivers],
  );

  const initialLoadDone = React.useRef(false);

  const fetchDrivers = React.useCallback(async () => {
    if (!isSignedIn) return;
    if (!initialLoadDone.current) setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await apiClient.get("/api/driver-tracking/active", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "all" },
      });
      const data = response.data?.data || [];
      setDrivers(
        data.map((item: DriverTrackingItem) => ({
          ...item,
          shipments: Array.isArray(item.shipments) ? item.shipments : [],
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load drivers");
    } finally {
      initialLoadDone.current = true;
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  const fetchAvailableShipments = React.useCallback(async () => {
    if (!isSignedIn) return;
    setShipmentsLoading(true);
    try {
      const token = await getToken();
      const response = await apiClient.get("/api/shipments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all: Shipment[] = response.data?.data || response.data || [];
      setAvailableShipments(
        all.filter(
          (s) => s.status === "Available for Pickup" && !s.assignedDriverId,
        ),
      );
    } catch {
      // non-critical — silent fail
    } finally {
      setShipmentsLoading(false);
    }
  }, [getToken, isSignedIn]);

  const handleAssignLoad = React.useCallback(
    async (shipmentId: string) => {
      if (!assigningTo?.driver?.id || !isSignedIn) return;
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/assign-load",
          { shipmentId, driverId: assigningTo.driver.id },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(`Load assigned to ${assigningTo.driver.name || "driver"}`);
        fetchDrivers();
        fetchAvailableShipments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to assign load");
      }
    },
    [assigningTo, getToken, isSignedIn, fetchDrivers, fetchAvailableShipments],
  );

  const handleAssignFromAvailable = React.useCallback(
    async (shipmentId: string, driverId: string) => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/assign-load",
          { shipmentId, driverId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Load assigned successfully");
        fetchDrivers();
        fetchAvailableShipments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to assign load");
      }
    },
    [getToken, isSignedIn, fetchDrivers, fetchAvailableShipments],
  );

  const handleRemoveLoad = React.useCallback(
    async (shipmentId: string) => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/remove-load",
          { shipmentId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Load removed from driver");
        fetchDrivers();
        fetchAvailableShipments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to remove load");
      }
    },
    [getToken, isSignedIn, fetchDrivers, fetchAvailableShipments],
  );

  const handleReassignLoad = React.useCallback(
    async (shipmentId: string, newDriverId: string) => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/reassign-load",
          { shipmentId, newDriverId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Load reassigned successfully");
        fetchDrivers();
        fetchAvailableShipments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to reassign load");
      }
    },
    [getToken, isSignedIn, fetchDrivers, fetchAvailableShipments],
  );

  React.useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  React.useEffect(() => {
    fetchAvailableShipments();
  }, [fetchAvailableShipments]);

  const socketRef = React.useRef<ReturnType<typeof getSocket>>(null);

  React.useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    const connectSocket = async () => {
      try {
        const token = await getToken();
        if (cancelled || !token) return;
        const sock = initializeSocket(token);
        socketRef.current = sock;

        sock.on("driver:location_update", (data: {
          driverId: string;
          coords: { lat: number; lng: number };
          status: DriverStatus;
          lastSeenAt: string;
        }) => {
          setDrivers((prev) => {
            const idx = prev.findIndex((d) => d.driver?.id === data.driverId);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              coords: data.coords,
              status: data.status,
              lastSeenAt: data.lastSeenAt,
            };
            return updated;
          });
        });

        sock.on("driver:loads_updated", () => {
          fetchDrivers();
          fetchAvailableShipments();
        });
      } catch { }
    };

    connectSocket();

    return () => {
      cancelled = true;
      socketRef.current?.off("driver:location_update");
      socketRef.current?.off("driver:loads_updated");
      socketRef.current = null;
    };
  }, [isSignedIn]);

  React.useEffect(() => {
    if (!normalizedToken || !mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;

      if (!normalizedToken.startsWith("pk.")) {
        setMapNotice("Invalid Mapbox token. Use a public token starting with pk.");
        return;
      }

      if (!mapboxgl.supported()) {
        setMapNotice("Mapbox requires WebGL. Please enable hardware acceleration.");
        return;
      }

      mapboxgl.accessToken = normalizedToken;
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [MAP_CENTER.lng, MAP_CENTER.lat],
        zoom: 4,
        attributionControl: false,
      });

      mapInstanceRef.current = map;
      setMapNotice("Loading map tiles...");

      const handleIdle = () => setMapNotice(null);
      const handleError = (event: any) => {
        const status = event?.error?.status;
        const message = event?.error?.message || "Map failed to load";
        setMapNotice(status ? `${message} (HTTP ${status})` : message);
      };

      const loadTimeout = window.setTimeout(() => {
        if (!map.isStyleLoaded()) {
          setMapNotice("Map style not loaded. Check token or network.");
        }
      }, 8000);

      const resizeTimeout = window.setTimeout(() => map.resize(), 500);

      map.on("load", () => {
        window.clearTimeout(loadTimeout);
        map.resize();
      });
      map.on("idle", handleIdle);
      map.on("error", handleError);

      map.once("remove", () => {
        window.clearTimeout(loadTimeout);
        window.clearTimeout(resizeTimeout);
      });
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [normalizedToken]);

  React.useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    const popups = popupsRef.current;
    const activeIds = new Set<string>();

    const updateMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (!map.isStyleLoaded()) {
        map.once("idle", () => updateMarkers());
        return;
      }

      filteredDrivers.forEach((driver) => {
        if (!driver.coords) return;
        const position = [driver.coords.lng, driver.coords.lat] as [number, number];

        const coordKey = `${driver.coords.lat.toFixed(2)},${driver.coords.lng.toFixed(2)}`;
        const cachedLocation = locationNamesRef.current.get(coordKey);

        const buildPopupHtml = (locationName?: string) => `
          <div style="font-size:12px;line-height:1.5;padding:2px 4px;min-width:130px;color:#111827">
            <div style="font-weight:600;margin-bottom:2px;color:#111827">${driver.driver?.name || "Unknown Driver"}</div>
            <div style="color:${mapPinColor[driver.status]};margin-bottom:2px">${statusLabel[driver.status]}</div>
            ${locationName ? `<div style="color:#374151;font-size:11px;margin-bottom:1px">${locationName}</div>` : ""}
            ${driver.shipments.length > 0 ? `<div style="color:#6b7280;font-size:11px">${driver.shipments.length} load${driver.shipments.length !== 1 ? "s" : ""}</div>` : ""}
          </div>`;

        const popupHtml = buildPopupHtml(cachedLocation);

        const buildPinSvg = (color: string) =>
          `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none">
            <path d="M14 1C7.925 1 3 5.925 3 12C3 19.5 14 34 14 34C14 34 25 19.5 25 12C25 5.925 20.075 1 14 1Z"
              fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="14" cy="12" r="4.5" fill="white"/>
          </svg>`;

        let marker = markers.get(driver.id);
        if (!marker) {
          const el = document.createElement("div");
          el.style.cursor = "pointer";
          el.style.width = "28px";
          el.style.height = "36px";
          el.innerHTML = buildPinSvg(mapPinColor[driver.status]);

          const popup = new mapboxgl.Popup({
            offset: [0, -36],
            closeButton: false,
            className: "driver-popup",
          }).setHTML(popupHtml);

          marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(position)
            .setPopup(popup)
            .addTo(map);

          markers.set(driver.id, marker);
          popups.set(driver.id, popup);
        } else {
          marker.setLngLat(position);
          const path = marker.getElement().querySelector("path");
          if (path) path.setAttribute("fill", mapPinColor[driver.status]);
          popups.get(driver.id)?.setHTML(popupHtml);
        }
        activeIds.add(driver.id);

        if (!locationNamesRef.current.has(coordKey) && normalizedToken) {
          const driverId = driver.id;
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${driver.coords.lng},${driver.coords.lat}.json?types=neighborhood,locality,place&limit=1&access_token=${normalizedToken}`,
          )
            .then((r) => r.json())
            .then((data) => {
              const raw: string = data.features?.[0]?.place_name ?? "";
              const locationName = raw.split(",").slice(0, 2).join(",").trim();
              if (locationName) {
                locationNamesRef.current.set(coordKey, locationName);
                popupsRef.current.get(driverId)?.setHTML(buildPopupHtml(locationName));
              }
            })
            .catch(() => { });
        }
      });

      markers.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.remove();
          markers.delete(id);
          popups.get(id)?.remove();
          popups.delete(id);
        }
      });
    };

    updateMarkers();
  }, [filteredDrivers]);

  const sendLocationUpdate = React.useCallback(
    async (
      coords: { lat: number; lng: number },
      statusOverride?: DriverStatus,
    ) => {
      if (!isSignedIn) return;
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/location",
        {
          lat: coords.lat,
          lng: coords.lng,
          status: statusOverride ?? shareStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },
    [getToken, isSignedIn, shareStatus],
  );

  React.useEffect(() => {
    if (!isSharing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setShareError("Geolocation is not supported on this device");
      setIsSharing(false);
      return;
    }

    setShareError(null);
    hasFlownRef.current = false;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < LOCATION_INTERVAL_MS) return;

        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        lastCoordsRef.current = coords;
        lastSentRef.current = now;

        if (!hasFlownRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 15,
            essential: true,
          });
          hasFlownRef.current = true;
        }

        try {
          await sendLocationUpdate(coords);
          setLastShareAt(new Date().toLocaleTimeString());
        } catch (err: any) {
          setShareError(
            err.response?.data?.message ||
            err.message ||
            "Failed to send location",
          );
        }
      },
      (error) => {
        setShareError(error.message);
        setIsSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    watchIdRef.current = watchId;
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharing, sendLocationUpdate]);

  const handleStopSharing = async () => {
    setIsSharing(false);
    toast.success("Location sharing stopped");
    if (lastCoordsRef.current) {
      try {
        await sendLocationUpdate(
          {
            lat: lastCoordsRef.current.lat,
            lng: lastCoordsRef.current.lng,
          },
          "offline",
        );
      } catch (err: any) {
        setShareError(
          err.response?.data?.message ||
          err.message ||
          "Failed to update status",
        );
      }
    }
  };

  const zoomMap = (delta: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextZoom = map.getZoom() + delta;
    map.setZoom(Math.max(2, Math.min(18, nextZoom)));
  };

  const centerOnMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.setCenter([position.coords.longitude, position.coords.latitude]);
      map.setZoom(12);
    });
  };

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const totalDrivers = drivers.length;
  const activeCount = drivers.filter((d) => d.status !== "offline").length;
  const onRouteCount = drivers.filter((d) => d.status === "on-route").length;
  const totalLoads = drivers.reduce((sum, d) => sum + (d.shipments?.length || 0), 0);

  const kpis = [
    { label: "Total Drivers", value: totalDrivers, icon: <Users className="size-8 text-primary/30" />, description: "All tracked drivers" },
    { label: "Active Now", value: activeCount, icon: <Radio className="size-8 text-emerald-500/30" />, description: "Currently sharing GPS", color: "text-emerald-500" },
    { label: "On Route", value: onRouteCount, icon: <Truck className="size-8 text-amber-500/30" />, description: "Delivering loads", color: "text-amber-500" },
    { label: "Loads Assigned", value: totalLoads, icon: <Package className="size-8 text-blue-500/30" />, description: "Active shipments", color: "text-blue-500" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 container mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5">
              Driver Tracker
            </Badge>
            <div className="size-1 rounded-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" />
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              <span className="text-primary/60 font-black">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Driver Tracker
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1 w-fit">
            {(
              [
                { key: "all", label: "All Drivers" },
                { key: "active", label: "Active" },
                { key: "offline", label: "Offline" },
              ] as { key: FilterKey; label: string }[]
            ).map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={filter === item.key ? "default" : "ghost"}
                className={
                  filter === item.key
                    ? "h-7 rounded-full px-3 text-[10px] font-bold shadow-sm"
                    : "h-7 rounded-full px-3 text-[10px] font-bold text-muted-foreground"
                }
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Input
            value={driverQuery}
            onChange={(event) => setDriverQuery(event.target.value)}
            placeholder="Search driver or load..."
            className="h-8 w-full sm:w-48 text-[11px] rounded-full border-border/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-0 border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden bg-card/80 backdrop-blur-sm border">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {kpi.icon}
            </div>
            <CardContent className="p-4 sm:p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tighter ${kpi.color || "text-foreground"}`}>{kpi.value}</h3>
              )}
              <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <DriverTrackerMap
          mapboxToken={normalizedToken}
          mapRef={mapRef}
          onZoomIn={() => zoomMap(1)}
          onZoomOut={() => zoomMap(-1)}
          onCenter={centerOnMe}
          mapNotice={mapNotice}
          activeCount={activeCount}
        />

        <div className="space-y-4">
          {isDriver && (
            <DriverTrackerShareCard
              shareStatus={shareStatus}
              onStatusChange={setShareStatus}
              isSharing={isSharing}
              onToggleSharing={() =>
                isSharing ? handleStopSharing() : setIsSharing(true)
              }
              lastShareAt={lastShareAt}
              shareError={shareError}
              hasActiveLoad={drivers.some((d) => d.driver?.id === user?.id && (d.shipments?.length ?? 0) > 0)}
            />
          )}

          <DriverTrackerLoadsCard
            drivers={driversWithLoads}
            isLoading={isLoading}
            error={error}
            activeDrivers={activeDrivers}
            onRemoveLoad={handleRemoveLoad}
            onReassignLoad={handleReassignLoad}
          />

          <DriverTrackerAvailableLoadsCard
            shipments={availableShipments}
            isLoading={shipmentsLoading}
            activeDrivers={activeDrivers}
            onAssign={handleAssignFromAvailable}
          />

          <DriverTrackerListCard
            drivers={activeDrivers}
            isLoading={isLoading}
            error={error}
            statusLabel={statusLabel}
            statusStyles={statusStyles}
            statusText={statusText}
            onDriverClick={(driver) => {
              const map = mapInstanceRef.current;
              if (!map || !driver.coords) return;
              map.flyTo({
                center: [driver.coords.lng, driver.coords.lat],
                zoom: 15,
                essential: true,
              });
            }}
            onAssignLoad={(driver) => {
              setAssigningTo(driver);
              setAssignModalOpen(true);
            }}
          />
        </div>
      </div>

      <DriverAssignLoadModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        driver={assigningTo}
        availableShipments={availableShipments}
        isLoading={shipmentsLoading}
        onAssign={handleAssignLoad}
      />
    </div>
  );
}
