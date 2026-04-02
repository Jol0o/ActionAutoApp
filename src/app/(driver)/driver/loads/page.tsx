"use client";

import * as React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  ArrowRight,
  Camera,
  AlertCircle,
  ImageIcon,
  DollarSign,
  Timer,
  XCircle,
  Phone,
  Mail,
  FileText,
  User2,
  ChevronDown,
  ChevronUp,
  Ban,
  RefreshCw,
  CircleDot,
  Navigation2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  Assigned: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "In-Transit": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

const PROGRESS_STEPS = [
  { key: "assigned", label: "Assigned" },
  { key: "accepted", label: "Accepted" },
  { key: "in-route", label: "In Route" },
  { key: "delivered", label: "Delivered" },
] as const;

function getStepIndex(load: Shipment): number {
  const s = load.status as string;
  if (s === "Delivered") return 3;
  if (s === "In-Route" || s === "In-Transit") return 2;
  if (load.driverAcceptedAt || s === "Dispatched") return 1;
  return 0;
}

const extractError = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

type Tab = "active" | "requests" | "completed" | "all";

export default function DriverLoadsPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [requests, setRequests] = React.useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("active");
  const [search, setSearch] = React.useState("");
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  const [droppingId, setDroppingId] = React.useState<string | null>(null);
  const [startingRouteId, setStartingRouteId] = React.useState<string | null>(null);
  const [proofTarget, setProofTarget] = React.useState<Shipment | null>(null);
  const [dropTarget, setDropTarget] = React.useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchLoads = React.useCallback(async () => {
    try {
      const token = await getToken();
      const [loadsRes, reqRes] = await Promise.all([
        apiClient.get("/api/driver-tracking/my-loads", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get("/api/driver-tracking/my-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setLoads(loadsRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
    } catch (err: any) {
      toast.error(extractError(err, "Failed to fetch loads"));
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoads();
  };

  const buildPayload = (load: Shipment) =>
    (load as any).__docType === "load" ? { loadId: load._id } : { shipmentId: load._id };

  const handleAccept = async (id: string) => {
    const load = loads.find((l) => l._id === id);
    if (!load) return;
    setAcceptingId(id);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/accept-load",
        buildPayload(load),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Load accepted — you are now dispatched");
      await fetchLoads();
    } catch (err: any) {
      toast.error(extractError(err, "Failed to accept load"));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDrop = async (id: string) => {
    const load = loads.find((l) => l._id === id) || dropTarget;
    if (!load) return;
    setDroppingId(id);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/drop-load",
        buildPayload(load),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Load dropped successfully");
      setDropTarget(null);
      await fetchLoads();
    } catch (err: any) {
      toast.error(extractError(err, "Failed to drop load"));
    } finally {
      setDroppingId(null);
    }
  };

  const handleStartRoute = async (id: string) => {
    const load = loads.find((l) => l._id === id);
    if (!load) return;
    setStartingRouteId(id);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/start-route",
        buildPayload(load),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Route started");
      await fetchLoads();
    } catch (err: any) {
      toast.error(extractError(err, "Failed to start route"));
    } finally {
      setStartingRouteId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.myRequestStatus === "pending");
  const rejectedRequests = requests.filter((r) => r.myRequestStatus === "rejected");
  const activeCount = loads.filter((l) => l.status !== "Delivered" && l.status !== "Cancelled").length;
  const completedCount = loads.filter((l) => l.status === "Delivered").length;

  const filtered = React.useMemo(() => {
    let result: Shipment[] = [];
    if (tab === "active") {
      result = loads.filter((l) => l.status !== "Delivered" && l.status !== "Cancelled");
    } else if (tab === "requests") {
      result = [...pendingRequests, ...rejectedRequests];
    } else if (tab === "completed") {
      result = loads.filter((l) => l.status === "Delivered");
    } else {
      result = loads;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.trackingNumber?.toLowerCase().includes(q) ||
          l.origin?.toLowerCase().includes(q) ||
          l.destination?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [loads, requests, tab, search, pendingRequests, rejectedRequests]);

  const tabs: { key: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { key: "active", label: "Active", count: activeCount || undefined, icon: <Navigation2 className="size-3" /> },
    { key: "requests", label: "Requests", count: pendingRequests.length || undefined, icon: <Timer className="size-3" /> },
    { key: "completed", label: "Completed", count: completedCount || undefined, icon: <CheckCircle2 className="size-3" /> },
    { key: "all", label: "All", count: loads.length || undefined, icon: <Package className="size-3" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">My Loads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loads.length} total load{loads.length !== 1 ? "s" : ""}
            {activeCount > 0 && <span className="text-emerald-600 font-semibold"> · {activeCount} active</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 border border-border/30">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 relative flex items-center gap-1.5 ${tab === t.key
                ? "bg-background shadow-sm font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.icon}
              {t.label}
              {t.count && t.count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] text-[9px] font-bold rounded-full px-1 ${t.key === "requests" ? "bg-amber-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <Package className="size-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold">
              {tab === "active" ? "No active loads" : tab === "requests" ? "No load requests" : tab === "completed" ? "No completed loads yet" : "No loads found"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {tab === "active"
                ? "Check available loads to request new assignments."
                : tab === "requests"
                  ? "Request loads from the Available Loads board."
                  : search ? "Try adjusting your search." : "Loads will appear here as they're assigned."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((load) => (
            <LoadCard
              key={load._id}
              load={load}
              isRequest={tab === "requests"}
              acceptingId={acceptingId}
              droppingId={droppingId}
              startingRouteId={startingRouteId}
              onAccept={handleAccept}
              onDrop={(l) => setDropTarget(l)}
              onStartRoute={handleStartRoute}
              onSubmitProof={() => setProofTarget(load)}
            />
          ))}
        </div>
      )}

      <DropConfirmDialog
        shipment={dropTarget}
        dropping={droppingId === dropTarget?._id}
        onConfirm={() => dropTarget && handleDrop(dropTarget._id)}
        onCancel={() => setDropTarget(null)}
      />

      <SubmitProofModal
        shipment={proofTarget}
        getToken={getToken}
        onClose={() => setProofTarget(null)}
        onSuccess={() => {
          setProofTarget(null);
          toast.success("Proof of delivery submitted");
          fetchLoads();
        }}
      />
    </div>
  );
}

function StatusTimeline({ load }: { load: Shipment }) {
  const currentStep = getStepIndex(load);

  return (
    <div className="flex items-center gap-0 w-full mt-1">
      {PROGRESS_STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-0.5">
            <div className={`size-5 rounded-full flex items-center justify-center border-2 transition-colors ${i <= currentStep
                ? i === currentStep
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                : "bg-muted/50 border-border text-muted-foreground/40"
              }`}>
              {i < currentStep ? (
                <CheckCircle2 className="size-3" />
              ) : i === currentStep ? (
                <CircleDot className="size-3" />
              ) : (
                <div className="size-1.5 rounded-full bg-current" />
              )}
            </div>
            <span className={`text-[9px] font-semibold whitespace-nowrap ${i <= currentStep ? "text-emerald-600" : "text-muted-foreground/40"
              }`}>
              {step.label}
            </span>
          </div>
          {i < PROGRESS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mt-[-10px] mx-0.5 rounded-full transition-colors ${i < currentStep ? "bg-emerald-500" : "bg-border"
              }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function LoadCard({
  load,
  isRequest,
  acceptingId,
  droppingId,
  startingRouteId,
  onAccept,
  onDrop,
  onStartRoute,
  onSubmitProof,
}: {
  load: Shipment;
  isRequest: boolean;
  acceptingId: string | null;
  droppingId: string | null;
  startingRouteId: string | null;
  onAccept: (id: string) => void;
  onDrop: (load: Shipment) => void;
  onStartRoute: (id: string) => void;
  onSubmitProof: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const status = load.status as string;
  const isLoadType = (load as any).__docType === "load";
  const isDispatched = status === "Dispatched" || status === "In-Route" || status === "Assigned" || status === "In-Transit";
  const isActive = load.status !== "Delivered" && load.status !== "Cancelled";
  const isPending = load.myRequestStatus === "pending";
  const isRejected = load.myRequestStatus === "rejected";

  // Per-type button visibility helpers
  const needsAccept = isLoadType ? status === "Assigned" : (!load.driverAcceptedAt && status !== "Delivered" && status !== "Cancelled");
  const canStartRoute = isLoadType ? false : (!!load.driverAcceptedAt && status === "Dispatched");
  const isOnRoute = status === "In-Route" || status === "In-Transit";
  const canSubmitProof = (status === "In-Route" || status === "In-Transit" || status === "Dispatched") && !load.proofOfDelivery?.imageUrl;
  const canDrop = isLoadType
    ? (status === "Assigned" || status === "In-Transit")
    : (!!load.driverAcceptedAt && status !== "Delivered" && status !== "Cancelled");

  return (
    <Card className={`overflow-hidden border-border/50 hover:shadow-md transition-all duration-200 ${isPending ? "border-amber-300/60 bg-amber-50/20 dark:bg-amber-950/10" :
        isRejected ? "border-red-300/40 opacity-75" :
          isOnRoute ? "border-emerald-300/50 bg-emerald-50/10 dark:bg-emerald-950/5" : ""
      }`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-bold">
                {load.trackingNumber || "No tracking #"}
              </span>
              {isRequest ? (
                isPending ? (
                  <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
                    <Timer className="size-2.5" />Pending Approval
                  </Badge>
                ) : isRejected ? (
                  <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-200 gap-1">
                    <XCircle className="size-2.5" />Declined
                  </Badge>
                ) : null
              ) : (
                <Badge variant="outline" className={statusColors[load.status] || ""}>
                  {load.status}
                </Badge>
              )}
              {load.carrierPayAmount != null && load.carrierPayAmount > 0 && (
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-0.5">
                  <DollarSign className="size-2.5" />{load.carrierPayAmount.toLocaleString()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <span className="truncate font-medium">{load.origin}</span>
              </div>
              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 text-rose-600">
                <div className="size-1.5 rounded-full bg-rose-500" />
                <span className="truncate font-medium">{load.destination}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {load.scheduledPickup && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Pickup: {new Date(load.scheduledPickup).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" })}
                </span>
              )}
              {load.scheduledDelivery && (
                <span className="flex items-center gap-1">
                  <Truck className="size-3" />
                  Delivery: {new Date(load.scheduledDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" })}
                </span>
              )}
              {load.assignedAt && !isRequest && (
                <span>Assigned: {new Date(load.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" })}</span>
              )}
              {isRequest && load.myRequestedAt && (
                <span>Requested: {new Date(load.myRequestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" })}</span>
              )}
            </div>
          </div>

          {!isRequest && (
            <div className="flex flex-col items-end gap-2 shrink-0">
              {needsAccept && (
                <Button size="sm" onClick={() => onAccept(load._id)} disabled={acceptingId === load._id}>
                  {acceptingId === load._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="size-4 mr-1" />Accept</>
                  )}
                </Button>
              )}

              {canStartRoute && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onStartRoute(load._id)} disabled={startingRouteId === load._id}>
                  {startingRouteId === load._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <><Navigation2 className="size-4 mr-1" />Start Route</>
                  )}
                </Button>
              )}

              {isOnRoute && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 animate-pulse">
                  <Navigation2 className="size-3" />In Route
                </Badge>
              )}

              {canSubmitProof && (
                <Button size="sm" variant="outline" onClick={onSubmitProof}>
                  <Camera className="size-4 mr-1" />Submit Proof
                </Button>
              )}

              {load.proofOfDelivery?.imageUrl && (
                <Badge className={`gap-1 text-[10px] ${load.proofOfDelivery.confirmedAt ? "bg-green-500/10 text-green-600 border-green-200" : "bg-blue-500/10 text-blue-600 border-blue-200"}`}>
                  <ImageIcon className="size-2.5" />
                  {load.proofOfDelivery.confirmedAt ? "Confirmed" : "Proof Sent"}
                </Badge>
              )}

              {canDrop && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] text-muted-foreground hover:text-red-500 h-6 px-2"
                  onClick={() => onDrop(load)}
                  disabled={droppingId === load._id}
                >
                  {droppingId === load._id ? <Loader2 className="size-3 animate-spin" /> : <><Ban className="size-3 mr-1" />Drop</>}
                </Button>
              )}
            </div>
          )}
        </div>

        {!isRequest && isActive && (
          <StatusTimeline load={load} />
        )}

        {isRejected && load.rejectionReason && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2">
            <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 dark:text-red-400">{load.rejectionReason}</p>
          </div>
        )}

        {isDispatched && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
          >
            <FileText className="size-3" />
            {expanded ? "Hide" : "View"} Dispatch Details
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}

        {expanded && isDispatched && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-3">

            {/* ── Full addresses (revealed post-dispatch) ── */}
            {((load as any).pickupLocation?.street || (load as any).pickupLocation?.companyName) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="size-3 text-emerald-500" />Pick-Up Address</p>
                  <p className="text-xs font-medium">{(load as any).pickupLocation?.companyName || ""}</p>
                  <p className="text-xs text-muted-foreground">{(load as any).pickupLocation?.street}</p>
                  <p className="text-xs text-muted-foreground">{(load as any).pickupLocation?.city}, {(load as any).pickupLocation?.state} {(load as any).pickupLocation?.zip}</p>
                  {(load as any).pickupLocation?.contactName && (
                    <p className="text-xs flex items-center gap-1 mt-1"><User2 className="size-3" />{(load as any).pickupLocation.contactName}</p>
                  )}
                  {(load as any).pickupLocation?.phone && (
                    <a href={`tel:${(load as any).pickupLocation.phone}`} className="text-xs flex items-center gap-1 text-primary hover:underline"><Phone className="size-3" />{(load as any).pickupLocation.phone}</a>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="size-3 text-rose-500" />Delivery Address</p>
                  <p className="text-xs font-medium">{(load as any).deliveryLocation?.companyName || ""}</p>
                  <p className="text-xs text-muted-foreground">{(load as any).deliveryLocation?.street}</p>
                  <p className="text-xs text-muted-foreground">{(load as any).deliveryLocation?.city}, {(load as any).deliveryLocation?.state} {(load as any).deliveryLocation?.zip}</p>
                  {(load as any).deliveryLocation?.contactName && (
                    <p className="text-xs flex items-center gap-1 mt-1"><User2 className="size-3" />{(load as any).deliveryLocation.contactName}</p>
                  )}
                  {(load as any).deliveryLocation?.phone && (
                    <a href={`tel:${(load as any).deliveryLocation.phone}`} className="text-xs flex items-center gap-1 text-primary hover:underline"><Phone className="size-3" />{(load as any).deliveryLocation.phone}</a>
                  )}
                </div>
              </div>
            )}

            {/* ── Vehicles list (Load model) ── */}
            {(load as any).vehicles?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Vehicles ({(load as any).vehicles.length})</p>
                <div className="space-y-1.5">
                  {(load as any).vehicles.map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-background/60 border border-border/40 px-2.5 py-1.5 text-xs">
                      <Truck className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-semibold">{v.year} {v.make} {v.model}</span>
                      {v.color && <span className="text-muted-foreground">· {v.color}</span>}
                      {v.vin && <span className="font-mono text-muted-foreground text-[10px]">VIN: {v.vin}</span>}
                      {v.condition === "Inoperable" && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-200 ml-auto">Inoperable</Badge>
                      )}
                      {v.carrierNotes && (
                        <span className="text-muted-foreground italic text-[10px]">· {v.carrierNotes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Shipment-style contacts ── */}
            {(load.originContact?.contactName || load.originContact?.phone) && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pick-Up Contact</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {load.originContact.contactName && <span className="flex items-center gap-1"><User2 className="size-3" />{load.originContact.contactName}</span>}
                  {load.originContact.phone && <a href={`tel:${load.originContact.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="size-3" />{load.originContact.phone}</a>}
                  {load.originContact.email && <a href={`mailto:${load.originContact.email}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="size-3" />{load.originContact.email}</a>}
                </div>
              </div>
            )}
            {(load.destinationContact?.contactName || load.destinationContact?.phone) && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Delivery Contact</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {load.destinationContact.contactName && <span className="flex items-center gap-1"><User2 className="size-3" />{load.destinationContact.contactName}</span>}
                  {load.destinationContact.phone && <a href={`tel:${load.destinationContact.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="size-3" />{load.destinationContact.phone}</a>}
                  {load.destinationContact.email && <a href={`mailto:${load.destinationContact.email}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="size-3" />{load.destinationContact.email}</a>}
                </div>
              </div>
            )}

            {/* ── Notes / Instructions ── */}
            {(load.preDispatchNotes || (load as any).additionalInfo?.preDispatchNotes) && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dispatch Notes</p>
                <p className="text-xs">{load.preDispatchNotes || (load as any).additionalInfo?.preDispatchNotes}</p>
              </div>
            )}
            {(load.specialInstructions || (load as any).additionalInfo?.specialInstructions) && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Special Instructions</p>
                <p className="text-xs">{load.specialInstructions || (load as any).additionalInfo?.specialInstructions}</p>
              </div>
            )}

            {/* ── Pricing ── */}
            {(load.carrierPayAmount ?? (load as any).pricing?.carrierPayAmount) > 0 && (
              <div className="flex items-center gap-4 pt-1 border-t border-border/30">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Carrier Pay</p>
                  <p className="text-sm font-bold text-emerald-600">${(load.carrierPayAmount ?? (load as any).pricing?.carrierPayAmount ?? 0).toLocaleString()}</p>
                </div>
                {((load as any).pricing?.copCodAmount ?? load.copCodAmount) > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">COD</p>
                    <p className="text-sm font-bold">${((load as any).pricing?.copCodAmount ?? load.copCodAmount ?? 0).toLocaleString()}</p>
                  </div>
                )}
                {((load as any).pricing?.balanceAmount ?? load.balanceAmount) != null && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</p>
                    <p className="text-sm font-bold">${((load as any).pricing?.balanceAmount ?? load.balanceAmount ?? 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DropConfirmDialog({
  shipment,
  dropping,
  onConfirm,
  onCancel,
}: {
  shipment: Shipment | null;
  dropping: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!shipment) return null;
  return (
    <Dialog open={!!shipment} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Drop Load?
          </DialogTitle>
          <DialogDescription>
            This will remove you from load{" "}
            <span className="font-mono font-medium">{shipment.trackingNumber || shipment._id.slice(-8)}</span>.
            The load will go back to the available pool and may be reassigned.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
          <p className="text-sm font-semibold">{shipment.origin} → {shipment.destination}</p>
          {shipment.carrierPayAmount != null && shipment.carrierPayAmount > 0 && (
            <p className="text-xs text-muted-foreground">Carrier Pay: <span className="text-emerald-600 font-bold">${shipment.carrierPayAmount.toLocaleString()}</span></p>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Frequently dropping loads may affect your driver rating and future load assignments.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={dropping}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={dropping}>
            {dropping ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Dropping...</> : <><Ban className="size-4 mr-1.5" />Drop Load</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitProofModal({
  shipment,
  getToken,
  onClose,
  onSuccess,
}: {
  shipment: Shipment | null;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!shipment) {
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setNote("");
      setError(null);
    }
  }, [shipment]);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (preview) URL.revokeObjectURL(preview);
      setFile(f);
      setPreview(URL.createObjectURL(f));
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!shipment || !file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("proof", file);
      if (note.trim()) formData.append("note", note.trim());

      const isLoadType = (shipment as any).__docType === "load";
      const endpoint = isLoadType
        ? `/api/loads/${shipment._id}/submit-proof`
        : `/api/shipments/${shipment._id}/submit-proof`;

      await apiClient.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      onSuccess();
    } catch (err: any) {
      setError(extractError(err, "Failed to submit proof. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shipment) return null;

  return (
    <Dialog open={!!shipment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            Submit Proof of Delivery
          </DialogTitle>
          <DialogDescription>
            Take a photo as proof that{" "}
            <span className="font-mono font-medium">
              {shipment.trackingNumber || "this shipment"}
            </span>{" "}
            was delivered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {!preview ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-colors cursor-pointer"
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <Camera className="size-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Take a Photo</p>
                  <p className="text-xs text-muted-foreground">
                    Opens your camera directly
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                <ImageIcon className="size-4" />
                Choose from gallery
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-border">
                <img
                  src={preview}
                  alt="Proof preview"
                  className="w-full max-h-60 object-contain bg-muted"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors hover:bg-muted"
                >
                  <Camera className="size-3.5" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors hover:bg-muted"
                >
                  <ImageIcon className="size-3.5" />
                  Change Photo
                </button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="proof-note">Note (optional)</Label>
            <Textarea
              id="proof-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Delivered to front door, customer signed"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Camera className="size-4 mr-2" />
                Submit Proof
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
