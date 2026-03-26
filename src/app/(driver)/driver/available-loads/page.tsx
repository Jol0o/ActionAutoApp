"use client";

import * as React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  Search,
  MapPin,
  Loader2,
  Calendar,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Filter,
  ChevronDown,
  DollarSign,
  Clock,
  Map as MapIcon,
  List,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { trailerTypeOptions } from "@/components/driver-profile/driver-profile-constants";

interface AvailableLoad {
  _id: string;
  origin: string;
  destination: string;
  trackingNumber?: string;
  status: string;
  requestedPickupDate?: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  desiredDeliveryDate?: string;
  trailerTypeRequired?: string;
  vehicleCount?: number;
  carrierPayAmount?: number;
  myRequestStatus?: "pending" | "approved" | "rejected" | null;
  myRequestedAt?: string | null;
  preservedQuoteData?: {
    vehicleName?: string;
    vehicleImage?: string;
    rate?: number;
    miles?: number;
    firstName?: string;
    lastName?: string;
    enclosedTrailer?: boolean;
    units?: number;
  };
  createdAt: string;
}

const trailerLabel = (val?: string) =>
  trailerTypeOptions.find((t) => t.value === val)?.label || val || "Any";

const formatDate = (d?: string) => {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

type ViewMode = "list" | "map";

export default function AvailableLoadsPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<AvailableLoad[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [trailerFilter, setTrailerFilter] = React.useState<string>("all");
  const [requestTarget, setRequestTarget] = React.useState<AvailableLoad | null>(null);
  const [requesting, setRequesting] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [view, setView] = React.useState<ViewMode>("list");
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const fetchLoads = React.useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get("/api/driver-tracking/available-loads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoads(res.data?.data || []);
    } catch {
      toast.error("Failed to load available loads");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 30000);
    return () => clearInterval(interval);
  }, [fetchLoads]);

  React.useEffect(() => {
    if (view !== "map" || !mapboxToken || !mapContainerRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      // @ts-ignore - CSS import for mapbox styling
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || mapInstanceRef.current) return;

      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-98.58, 39.83],
        zoom: 3.5,
        accessToken: mapboxToken,
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            mapInstanceRef.current?.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 8,
              duration: 1500,
            });
            new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([pos.coords.longitude, pos.coords.latitude])
              .setPopup(new mapboxgl.Popup().setHTML("<strong>Your Location</strong>"))
              .addTo(mapInstanceRef.current!);
          },
          () => { },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }
    };

    initMap();
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [view, mapboxToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoads();
  };

  const handleRequest = async () => {
    if (!requestTarget) return;
    setRequesting(true);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/request-load",
        { shipmentId: requestTarget._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Load request submitted — pending dispatcher approval");
      setRequestTarget(null);
      fetchLoads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request load");
    } finally {
      setRequesting(false);
    }
  };

  const uniqueTrailers = React.useMemo(() => {
    const set = new Set(loads.map((l) => l.trailerTypeRequired).filter(Boolean));
    return Array.from(set) as string[];
  }, [loads]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return loads.filter((l) => {
      if (trailerFilter !== "all" && l.trailerTypeRequired !== trailerFilter) return false;
      if (!q) return true;
      return (
        l.origin?.toLowerCase().includes(q) ||
        l.destination?.toLowerCase().includes(q) ||
        l.trackingNumber?.toLowerCase().includes(q) ||
        l.preservedQuoteData?.vehicleName?.toLowerCase().includes(q)
      );
    });
  }, [loads, search, trailerFilter]);

  const pendingCount = loads.filter((l) => l.myRequestStatus === "pending").length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          Finding available loads
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Available Loads
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loads.length} load{loads.length !== 1 ? "s" : ""} on the board
            {pendingCount > 0 && (
              <span className="ml-1.5 text-amber-600 font-semibold">
                · {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="flex rounded-lg border border-border/50 p-0.5">
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="size-3.5 inline mr-1" />List
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${view === "map" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MapIcon className="size-3.5 inline mr-1" />Map
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by city, tracking #, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {uniqueTrailers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 shrink-0">
                <Filter className="size-3.5" />
                {trailerFilter === "all" ? "All Trailers" : trailerLabel(trailerFilter)}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTrailerFilter("all")}>All Trailers</DropdownMenuItem>
              {uniqueTrailers.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setTrailerFilter(t)}>
                  {trailerLabel(t)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {view === "map" && (
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            {mapboxToken ? (
              <div ref={mapContainerRef} className="h-[340px] w-full" />
            ) : (
              <div className="h-[340px] flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-2">
                  <MapIcon className="size-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center">
            <Package className="size-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            {search || trailerFilter !== "all" ? "No loads match your filters" : "No loads posted to the board right now"}
          </p>
          <p className="text-xs text-muted-foreground/60">Check back later or adjust your filters</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((load) => (
            <LoadCard key={load._id} load={load} onRequest={() => setRequestTarget(load)} />
          ))}
        </div>
      )}

      <Dialog open={!!requestTarget} onOpenChange={() => setRequestTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              Request Load Assignment
            </DialogTitle>
            <DialogDescription>
              You&apos;re requesting to be assigned to this load. The dispatcher will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          {requestTarget && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {requestTarget.trackingNumber || requestTarget._id.slice(-8)}
                  </Badge>
                  {requestTarget.trailerTypeRequired && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {trailerLabel(requestTarget.trailerTypeRequired)}
                    </Badge>
                  )}
                </div>
                {requestTarget.carrierPayAmount != null && requestTarget.carrierPayAmount > 0 && (
                  <span className="text-sm font-black text-emerald-600">
                    ${requestTarget.carrierPayAmount.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold">
                {requestTarget.origin} → {requestTarget.destination}
              </p>
              {requestTarget.vehicleCount && (
                <p className="text-xs text-muted-foreground">
                  {requestTarget.vehicleCount} vehicle{requestTarget.vehicleCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Requesting a load does not guarantee assignment. Your compliance and equipment profile will be verified by dispatch.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestTarget(null)} disabled={requesting}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting}>
              {requesting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Truck className="size-4 mr-1.5" />}
              {requesting ? "Requesting..." : "Request Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadCard({ load, onRequest }: { load: AvailableLoad; onRequest: () => void }) {
  const quote = load.preservedQuoteData;
  const isRequested = load.myRequestStatus === "pending";
  const isRejected = load.myRequestStatus === "rejected";

  return (
    <Card className={`border-border/50 hover:shadow-md transition-all duration-200 overflow-hidden ${isRequested ? "border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10" : isRejected ? "border-red-300/40 opacity-75" : "hover:border-primary/30"}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {quote?.vehicleImage && (
            <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0">
              <img src={quote.vehicleImage} alt={quote.vehicleName || "Vehicle"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 sm:bg-gradient-to-t sm:from-black/20 sm:to-transparent" />
              {isRequested && (
                <div className="absolute top-2 left-2">
                  <Badge className="text-[9px] bg-amber-500 text-white border-0 gap-1">
                    <Timer className="size-2.5" />Pending
                  </Badge>
                </div>
              )}
              {isRejected && (
                <div className="absolute top-2 left-2">
                  <Badge className="text-[9px] bg-red-500 text-white border-0 gap-1">
                    <XCircle className="size-2.5" />Declined
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 p-3 sm:p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {load.trackingNumber || load._id.slice(-8)}
                  </Badge>
                  {load.trailerTypeRequired && (
                    <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">
                      <Truck className="size-2.5 mr-1" />{trailerLabel(load.trailerTypeRequired)}
                    </Badge>
                  )}
                  {load.vehicleCount && load.vehicleCount > 1 && (
                    <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-200">
                      {load.vehicleCount} vehicles
                    </Badge>
                  )}
                  {isRequested && !quote?.vehicleImage && (
                    <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
                      <Timer className="size-2.5" />Pending Approval
                    </Badge>
                  )}
                  {isRejected && !quote?.vehicleImage && (
                    <Badge className="text-[9px] bg-red-500/10 text-red-600 border-red-200 gap-1">
                      <XCircle className="size-2.5" />Declined
                    </Badge>
                  )}
                </div>
                {quote?.vehicleName && (
                  <p className="text-sm font-bold truncate">{quote.vehicleName}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {load.carrierPayAmount != null && load.carrierPayAmount > 0 ? (
                  <div>
                    <p className="text-lg font-black text-emerald-600 flex items-center gap-0.5 justify-end">
                      <DollarSign className="size-4" />
                      {load.carrierPayAmount.toLocaleString()}
                    </p>
                    {quote?.miles && (
                      <p className="text-[10px] text-muted-foreground">
                        ${(load.carrierPayAmount / quote.miles).toFixed(2)}/mi · {quote.miles.toLocaleString()} mi
                      </p>
                    )}
                  </div>
                ) : quote?.rate ? (
                  <div>
                    <p className="text-lg font-black text-emerald-600">${quote.rate.toLocaleString()}</p>
                    {quote.miles && <p className="text-[10px] text-muted-foreground">{quote.miles.toLocaleString()} mi</p>}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium truncate max-w-[140px]">{load.origin}</span>
              </div>
              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 text-red-600">
                <MapPin className="size-3" />
                <span className="font-medium truncate max-w-[140px]">{load.destination}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Pickup: {formatDate(load.scheduledPickup || load.requestedPickupDate)}
                </span>
                {(load.desiredDeliveryDate || load.scheduledDelivery) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    Del: {formatDate(load.desiredDeliveryDate || load.scheduledDelivery)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {timeAgo(load.createdAt)}
                </span>
              </div>
              {isRequested ? (
                <Badge variant="outline" className="text-[10px] font-semibold border-amber-300 text-amber-600 gap-1">
                  <Timer className="size-3" />Awaiting Approval
                </Badge>
              ) : isRejected ? (
                <Badge variant="outline" className="text-[10px] font-semibold border-red-300 text-red-500 gap-1">
                  <XCircle className="size-3" />Request Declined
                </Badge>
              ) : (
                <Button size="sm" onClick={onRequest} className="h-7 px-3 text-[10px] font-bold gap-1 shadow-sm">
                  <Truck className="size-3" />Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
