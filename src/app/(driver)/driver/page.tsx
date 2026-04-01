"use client";

import * as React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { useDriverLocationSharing } from "@/hooks/useDriverLocationSharing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Navigation2,
  Loader2,
  Wifi,
  WifiOff,
  Radio,
  Coffee,
  Hourglass,
  Plus,
  Minus,
  LocateFixed,
  ArrowRight,
  Satellite,
  XCircle,
  AlertTriangle,
  Timer,
  CircleDot,
  Wrench,
  PauseCircle,
} from "lucide-react";

type DriverStatus = "on-route" | "idle" | "on-break" | "waiting" | "offline";

const STATUS_CONFIG: Array<{
  key: DriverStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
  needsLoad?: boolean;
}> = [
    {
      key: "on-route",
      label: "On Route",
      icon: <Navigation2 className="size-3.5" />,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20",
      needsLoad: true,
    },
    {
      key: "idle",
      label: "Idle",
      icon: <Clock className="size-3.5" />,
      color: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20",
    },
    {
      key: "waiting",
      label: "Waiting",
      icon: <Hourglass className="size-3.5" />,
      color: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20",
    },
    {
      key: "on-break",
      label: "On Break",
      icon: <Coffee className="size-3.5" />,
      color: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20",
    },
  ];

const statusBadgeColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

const MAP_CENTER: [number, number] = [-98.5795, 39.8283];

export default function DriverDashboardPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [dashStats, setDashStats] = React.useState<{
    pendingRequests: number;
    totalEarnings: number;
    profileCompletionScore: number;
    isComplianceExpired: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [dropping, setDropping] = React.useState<string | null>(null);
  const [startingRoute, setStartingRoute] = React.useState<string | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [opStatus, setOpStatus] = React.useState<string>("active");
  const [savingOpStatus, setSavingOpStatus] = React.useState(false);
  const {
    isSharing,
    status,
    lastShareAt,
    error: locationError,
    startSharing,
    stopSharing,
    updateStatus,
    lastCoords,
  } = useDriverLocationSharing();

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  const fetchLoads = React.useCallback(async () => {
    try {
      const token = await getToken();
      const [loadsRes, statsRes] = await Promise.all([
        apiClient.get("/api/driver-tracking/my-loads", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get("/api/driver-tracking/dashboard-stats", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);
      setLoads(loadsRes.data?.data || []);
      if (statsRes?.data?.data) setDashStats(statsRes.data.data);
      try {
        const profileRes = await apiClient.get("/api/driver-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.data?.data?.operationalStatus) {
          setOpStatus(profileRes.data.data.operationalStatus);
        }
      } catch { }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to fetch loads");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const activeLoads = loads.filter(
    (l) => l.status !== "Delivered" && l.status !== "Cancelled",
  );
  const completedCount = loads.filter((l) => l.status === "Delivered").length;
  const currentLoad = activeLoads[0];
  const hasActiveLoad = activeLoads.length > 0;

  React.useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled || !mapContainerRef.current) return;
        if (!mapboxgl.supported()) {
          setMapError("WebGL required — enable hardware acceleration");
          return;
        }

        mapboxgl.accessToken = mapboxToken;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: MAP_CENTER,
          zoom: 4,
          attributionControl: false,
        });

        mapRef.current = map;

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "top-right",
        );

        map.on("load", () => {
          if (!cancelled) {
            map.resize();
            setMapReady(true);
          }
        });

        map.on("error", (e: any) => {
          setMapError(e.error?.message || "Map failed to load");
        });

        const resizeTimer = setTimeout(() => map.resize(), 300);
        map.once("remove", () => clearTimeout(resizeTimer));
      } catch {
        setMapError("Failed to initialize map");
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapboxToken]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !lastCoords) return;

    const updateMarker = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (!markerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);position:relative"><div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #10b981;opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div></div>`;
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([lastCoords.lng, lastCoords.lat])
          .addTo(map);
        map.flyTo({
          center: [lastCoords.lng, lastCoords.lat],
          zoom: 14,
          essential: true,
        });
      } else {
        markerRef.current.setLngLat([lastCoords.lng, lastCoords.lat]);
      }
    };

    updateMarker();
  }, [lastCoords, mapReady]);

  const zoomMap = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setZoom(Math.max(2, Math.min(18, map.getZoom() + delta)));
  };

  const centerOnMe = () => {
    const map = mapRef.current;
    if (!map) return;
    if (lastCoords) {
      map.flyTo({ center: [lastCoords.lng, lastCoords.lat], zoom: 14, essential: true });
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 14,
            essential: true,
          });
        },
        () => { },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  };

  const acceptLoad = React.useCallback(
    async (shipmentId: string) => {
      setAccepting(shipmentId);
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/accept-load",
          { shipmentId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Load accepted");
        fetchLoads();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Failed to accept load",
        );
      } finally {
        setAccepting(null);
      }
    },
    [getToken, fetchLoads],
  );

  const dropLoad = React.useCallback(
    async (shipmentId: string) => {
      setDropping(shipmentId);
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/drop-load",
          { shipmentId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Load dropped successfully");
        fetchLoads();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Failed to drop load",
        );
      } finally {
        setDropping(null);
      }
    },
    [getToken, fetchLoads],
  );

  const startRoute = React.useCallback(
    async (shipmentId: string) => {
      setStartingRoute(shipmentId);
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/start-route",
          { shipmentId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Route started — status updated to In-Route");
        fetchLoads();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Failed to start route",
        );
      } finally {
        setStartingRoute(null);
      }
    },
    [getToken, fetchLoads],
  );

  const updateOpStatus = React.useCallback(
    async (newStatus: string) => {
      setSavingOpStatus(true);
      try {
        const token = await getToken();
        await apiClient.patch(
          "/api/driver-profile/logistics",
          { operationalStatus: newStatus },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setOpStatus(newStatus);
        toast.success(`Status set to ${newStatus.replace("_", " ")}`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to update status");
      } finally {
        setSavingOpStatus(false);
      }
    },
    [getToken],
  );

  const [currentTime, setCurrentTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const kpis = [
    { label: "Active", value: activeLoads.length, icon: <Truck className="size-7 text-amber-500/30" />, color: "text-amber-500" },
    { label: "Completed", value: completedCount, icon: <CheckCircle2 className="size-7 text-emerald-500/30" />, color: "text-emerald-500" },
    {
      label: "Earnings",
      value: dashStats ? `$${dashStats.totalEarnings.toLocaleString()}` : "$0",
      icon: <Package className="size-7 text-blue-500/30" />,
      color: "text-emerald-600",
    },
    { label: "GPS", value: isSharing ? "LIVE" : "OFF", icon: <Radio className="size-7 text-primary/30" />, color: isSharing ? "text-emerald-500" : "text-muted-foreground" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 container mx-auto min-h-screen">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-200/50 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5">
            Driver
          </Badge>
          <div className="size-1 rounded-full bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="size-3" />
            {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            <span className="text-primary/60 font-black">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-0 border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">{kpi.icon}</div>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
              {isLoading ? <Skeleton className="h-7 w-14" /> : (
                <h3 className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</h3>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dashStats?.isComplianceExpired && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
          <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Compliance Documents Expired</p>
            <p className="text-xs text-red-600 dark:text-red-500">Update your compliance documents in your Equipment profile to continue requesting loads.</p>
          </div>
        </div>
      )}

      {dashStats && dashStats.pendingRequests > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
          <Timer className="size-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            You have <span className="font-bold">{dashStats.pendingRequests}</span> pending load request{dashStats.pendingRequests > 1 ? "s" : ""} awaiting dispatcher approval.
          </p>
          <a href="/driver/loads" className="ml-auto text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0">View →</a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <Card className="border-border/50 shadow-sm overflow-hidden p-0 gap-0">
          <div className="relative h-96 lg:h-120">
            {mapboxToken ? (
              <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ background: "#e5e7eb" }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
                <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Satellite className="size-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Map unavailable</p>
              </div>
            )}

            <TooltipProvider>
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                {[
                  { action: () => zoomMap(1), icon: <Plus className="size-4" />, label: "Zoom in" },
                  { action: () => zoomMap(-1), icon: <Minus className="size-4" />, label: "Zoom out" },
                  { action: centerOnMe, icon: <LocateFixed className="size-4" />, label: "My location" },
                ].map((btn) => (
                  <Tooltip key={btn.label}>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="secondary" className="size-8 shadow-md bg-background/90 backdrop-blur-sm border border-border/50" onClick={btn.action}>
                        {btn.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{btn.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {isSharing && lastCoords && (
              <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 shadow-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Broadcasting</span>
                </div>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
                <div className="rounded-xl bg-background border border-border/50 px-5 py-3 shadow-lg text-center">
                  <Satellite className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">{mapError}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Radio className="size-20" />
            </div>
            <CardHeader className="py-3.5 px-5 border-b border-border/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${isSharing ? "bg-emerald-500/10" : "bg-muted/60"}`}>
                    {isSharing ? <Wifi className="size-4 text-emerald-500" /> : <WifiOff className="size-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Location Sharing</CardTitle>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">GPS broadcast to dispatch</p>
                  </div>
                </div>
                {isSharing && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 text-[10px] font-bold gap-1.5 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_CONFIG.map((item) => {
                    const locked = item.needsLoad && !hasActiveLoad;
                    const btn = (
                      <Button
                        key={item.key}
                        size="sm"
                        variant="outline"
                        disabled={locked}
                        className={`h-8 text-[11px] font-semibold gap-1.5 transition-all duration-200 ${status === item.key ? item.color + " border" : "border-border/50 text-muted-foreground"
                          } ${locked ? "opacity-40" : ""}`}
                        onClick={() => {
                          if (!locked) {
                            updateStatus(item.key as any);
                            toast.success(`Status changed to ${item.label}`);
                          }
                        }}
                      >
                        {item.icon} {item.label}
                      </Button>
                    );
                    return locked ? (
                      <Tooltip key={item.key}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">Need an active load</TooltipContent>
                      </Tooltip>
                    ) : <React.Fragment key={item.key}>{btn}</React.Fragment>;
                  })}
                </div>
              </TooltipProvider>
              <Button
                size="sm"
                className={`w-full h-9 text-xs font-bold transition-all duration-300 ${isSharing
                  ? "bg-rose-500/10 text-rose-600 border border-rose-200/50 hover:bg-rose-500/20 shadow-none"
                  : "bg-primary text-primary-foreground shadow-sm hover:shadow-md"}`}
                variant={isSharing ? "outline" : "default"}
                onClick={() => {
                  if (isSharing) {
                    stopSharing();
                    toast.success("Location sharing stopped");
                  } else {
                    startSharing();
                    toast.success("Location sharing started");
                  }
                }}
              >
                <Navigation2 className={`size-3.5 mr-2 ${isSharing ? "animate-pulse" : ""}`} />
                {isSharing ? "Stop Sharing" : "Start Sharing"}
              </Button>
              {lastShareAt && (
                <p className="text-[10px] text-muted-foreground/60 text-center font-medium">Last broadcast: {lastShareAt}</p>
              )}
              {locationError && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
                  <p className="text-[11px] text-destructive font-medium">{locationError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Truck className="size-20" />
            </div>
            <CardHeader className="py-3.5 px-5 border-b border-border/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Current Load
                </CardTitle>
                {currentLoad && (
                  <Badge variant="outline" className={statusBadgeColors[currentLoad.status] || ""}>
                    {currentLoad.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : currentLoad ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono font-bold">{currentLoad.trackingNumber || "No tracking #"}</p>
                    {currentLoad.carrierPayAmount != null && currentLoad.carrierPayAmount > 0 && (
                      <span className="text-sm font-black text-emerald-600">${currentLoad.carrierPayAmount.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{currentLoad.origin}</span>
                    <ArrowRight className="size-3 shrink-0 text-primary" />
                    <span className="truncate">{currentLoad.destination}</span>
                  </div>
                  {currentLoad.scheduledPickup && (
                    <p className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
                      <Clock className="size-3" />
                      Pickup: {new Date(currentLoad.scheduledPickup).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" })}
                    </p>
                  )}
                  {(currentLoad.status === "Available for Pickup" || currentLoad.status === "Dispatched") && !currentLoad.driverAcceptedAt && (
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs font-bold shadow-sm"
                      disabled={accepting === currentLoad._id}
                      onClick={() => acceptLoad(currentLoad._id)}
                    >
                      {accepting === currentLoad._id ? (
                        <><Loader2 className="size-3.5 mr-2 animate-spin" />Accepting...</>
                      ) : (
                        <><CheckCircle2 className="size-3.5 mr-2" />Accept Load</>
                      )}
                    </Button>
                  )}
                  {currentLoad.driverAcceptedAt && currentLoad.status === "Dispatched" && (
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                      disabled={startingRoute === currentLoad._id}
                      onClick={() => startRoute(currentLoad._id)}
                    >
                      {startingRoute === currentLoad._id ? (
                        <><Loader2 className="size-3.5 mr-2 animate-spin" />Starting...</>
                      ) : (
                        <><Navigation2 className="size-3.5 mr-2" />Start Route</>
                      )}
                    </Button>
                  )}
                  {currentLoad.status === "In-Route" && (
                    <div className="flex items-center gap-2 py-1">
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600">Currently In Route</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10"
                    disabled={dropping === currentLoad._id}
                    onClick={() => dropLoad(currentLoad._id)}
                  >
                    {dropping === currentLoad._id ? (
                      <><Loader2 className="size-3.5 mr-2 animate-spin" />Dropping...</>
                    ) : (
                      <><XCircle className="size-3.5 mr-2" />Drop Load</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center">
                    <Package className="size-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">No active loads</p>
                  <a href="/driver/available-loads" className="text-[11px] font-semibold text-primary hover:underline">
                    Browse Available Loads →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-0 gap-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <CircleDot className="size-20" />
            </div>
            <CardHeader className="py-3.5 px-5 border-b border-border/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CircleDot className="size-4 text-primary" />
                  Operational Status
                </CardTitle>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-bold",
                  opStatus === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                    opStatus === "on_leave" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                      opStatus === "maintenance" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                        "bg-red-500/10 text-red-600 border-red-200"
                )}>
                  {opStatus.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: "active", label: "Active", icon: <CheckCircle2 className="size-3.5" />, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20" },
                  { key: "on_leave", label: "On Leave", icon: <PauseCircle className="size-3.5" />, color: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20" },
                  { key: "maintenance", label: "Maintenance", icon: <Wrench className="size-3.5" />, color: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20" },
                ].map((item) => (
                  <Button
                    key={item.key}
                    size="sm"
                    variant="outline"
                    disabled={savingOpStatus}
                    className={`h-8 text-[11px] font-semibold gap-1.5 transition-all duration-200 ${opStatus === item.key ? item.color + " border" : "border-border/50 text-muted-foreground"
                      }`}
                    onClick={() => updateOpStatus(item.key)}
                  >
                    {item.icon} {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeLoads.length > 1 && (
            <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-border/10">
                <CardTitle className="text-sm font-bold">Other Active Loads</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {activeLoads.slice(1).map((load) => (
                  <div key={load._id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:border-primary/20 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-bold">{load.trackingNumber || "No tracking #"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{load.origin} → {load.destination}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(load.status === "Available for Pickup" || load.status === "Dispatched") && !load.driverAcceptedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] font-semibold"
                          disabled={accepting === load._id}
                          onClick={() => acceptLoad(load._id)}
                        >
                          {accepting === load._id ? <Loader2 className="size-3 animate-spin" /> : "Accept"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px] font-semibold text-destructive border-destructive/20 hover:bg-destructive/10"
                        disabled={dropping === load._id}
                        onClick={() => dropLoad(load._id)}
                      >
                        {dropping === load._id ? <Loader2 className="size-3 animate-spin" /> : "Drop"}
                      </Button>
                      <Badge variant="outline" className={`text-[10px] ${statusBadgeColors[load.status] || ""}`}>
                        {load.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
