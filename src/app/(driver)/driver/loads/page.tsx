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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

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
  const [proofTarget, setProofTarget] = React.useState<Shipment | null>(null);

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
    } catch {
      toast.error("Failed to fetch loads");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const handleAccept = async (shipmentId: string) => {
    setAcceptingId(shipmentId);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/accept-load",
        { shipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Load accepted");
      await fetchLoads();
    } catch {
      toast.error("Failed to accept load");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDrop = async (shipmentId: string) => {
    setDroppingId(shipmentId);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/drop-load",
        { shipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Load dropped");
      await fetchLoads();
    } catch {
      toast.error("Failed to drop load");
    } finally {
      setDroppingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.myRequestStatus === "pending");
  const rejectedRequests = requests.filter((r) => r.myRequestStatus === "rejected");

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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "active", label: "Active" },
    { key: "requests", label: "Requests", count: pendingRequests.length || undefined },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Loads</h1>
        <p className="text-muted-foreground text-sm">
          Manage your assigned shipments and load requests.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors relative ${tab === t.key
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
              {t.count && t.count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center size-4.5 text-[9px] font-bold rounded-full bg-amber-500 text-white">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="size-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No loads found</p>
            <p className="text-xs">
              {tab === "active"
                ? "You have no active loads right now."
                : tab === "requests"
                  ? "No pending load requests."
                  : "No loads match your search."}
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
              onAccept={handleAccept}
              onDrop={handleDrop}
              onSubmitProof={() => setProofTarget(load)}
            />
          ))}
        </div>
      )}

      <SubmitProofModal
        shipment={proofTarget}
        getToken={getToken}
        onClose={() => setProofTarget(null)}
        onSuccess={() => {
          setProofTarget(null);
          fetchLoads();
        }}
      />
    </div>
  );
}

function LoadCard({
  load,
  isRequest,
  acceptingId,
  droppingId,
  onAccept,
  onDrop,
  onSubmitProof,
}: {
  load: Shipment;
  isRequest: boolean;
  acceptingId: string | null;
  droppingId: string | null;
  onAccept: (id: string) => void;
  onDrop: (id: string) => void;
  onSubmitProof: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isDispatched = load.status === "Dispatched" || load.status === "In-Route";
  const isPending = load.myRequestStatus === "pending";
  const isRejected = load.myRequestStatus === "rejected";

  return (
    <Card className={`overflow-hidden ${isPending ? "border-amber-300/50" : isRejected ? "border-red-300/40 opacity-80" : ""}`}>
      <CardContent className="p-4">
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
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{load.origin}</span>
              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate">{load.destination}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {load.scheduledPickup && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Pickup: {new Date(load.scheduledPickup).toLocaleDateString()}
                </span>
              )}
              {load.scheduledDelivery && (
                <span className="flex items-center gap-1">
                  <Truck className="size-3" />
                  Delivery: {new Date(load.scheduledDelivery).toLocaleDateString()}
                </span>
              )}
              {load.assignedAt && !isRequest && (
                <span>Assigned: {new Date(load.assignedAt).toLocaleDateString()}</span>
              )}
              {isRequest && load.myRequestedAt && (
                <span>Requested: {new Date(load.myRequestedAt).toLocaleDateString()}</span>
              )}
            </div>

            {isRejected && load.rejectionReason && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 mt-1">
                <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-600 dark:text-red-400">{load.rejectionReason}</p>
              </div>
            )}

            {isDispatched && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline mt-1"
              >
                <FileText className="size-3" />
                {expanded ? "Hide" : "View"} Dispatch Details
                {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            )}

            {expanded && isDispatched && (
              <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3 space-y-3">
                {load.preDispatchNotes && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dispatch Notes</p>
                    <p className="text-xs">{load.preDispatchNotes}</p>
                  </div>
                )}
                {load.specialInstructions && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Special Instructions</p>
                    <p className="text-xs">{load.specialInstructions}</p>
                  </div>
                )}
                {load.loadSpecificTerms && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Load Terms</p>
                    <p className="text-xs">{load.loadSpecificTerms}</p>
                  </div>
                )}
                {(load.originContact?.contactName || load.originContact?.phone) && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pick-Up Contact</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {load.originContact.contactName && (
                        <span className="flex items-center gap-1"><User2 className="size-3" />{load.originContact.contactName}</span>
                      )}
                      {load.originContact.phone && (
                        <span className="flex items-center gap-1"><Phone className="size-3" />{load.originContact.phone}</span>
                      )}
                      {load.originContact.email && (
                        <span className="flex items-center gap-1"><Mail className="size-3" />{load.originContact.email}</span>
                      )}
                    </div>
                  </div>
                )}
                {(load.destinationContact?.contactName || load.destinationContact?.phone) && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Delivery Contact</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {load.destinationContact.contactName && (
                        <span className="flex items-center gap-1"><User2 className="size-3" />{load.destinationContact.contactName}</span>
                      )}
                      {load.destinationContact.phone && (
                        <span className="flex items-center gap-1"><Phone className="size-3" />{load.destinationContact.phone}</span>
                      )}
                      {load.destinationContact.email && (
                        <span className="flex items-center gap-1"><Mail className="size-3" />{load.destinationContact.email}</span>
                      )}
                    </div>
                  </div>
                )}
                {load.carrierPayAmount != null && load.carrierPayAmount > 0 && (
                  <div className="flex items-center gap-4 pt-1 border-t border-border/30">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Carrier Pay</p>
                      <p className="text-sm font-bold text-emerald-600">${load.carrierPayAmount.toLocaleString()}</p>
                    </div>
                    {load.copCodAmount != null && load.copCodAmount > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">COD</p>
                        <p className="text-sm font-bold">${load.copCodAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {load.balanceAmount != null && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</p>
                        <p className="text-sm font-bold">${load.balanceAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isRequest && (
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!load.driverAcceptedAt && load.status !== "Delivered" && load.status !== "Cancelled" && (
                <Button size="sm" onClick={() => onAccept(load._id)} disabled={acceptingId === load._id}>
                  {acceptingId === load._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="size-4 mr-1" />Accept</>
                  )}
                </Button>
              )}

              {load.driverAcceptedAt && load.status !== "Delivered" && load.status !== "Cancelled" && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />Accepted
                </span>
              )}

              {(load.status === "In-Route" || load.status === "Dispatched") && !load.proofOfDelivery?.imageUrl && (
                <Button size="sm" variant="outline" onClick={onSubmitProof}>
                  <Camera className="size-4 mr-1" />Submit Proof
                </Button>
              )}

              {load.proofOfDelivery?.imageUrl && (
                <span className={`text-xs font-medium flex items-center gap-1 ${load.proofOfDelivery.confirmedAt ? "text-green-600" : "text-blue-600"}`}>
                  <ImageIcon className="size-3.5" />
                  {load.proofOfDelivery.confirmedAt ? "Delivery Confirmed" : "Proof Submitted"}
                </span>
              )}

              {load.status !== "Delivered" && load.status !== "Cancelled" && load.driverAcceptedAt && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] text-muted-foreground hover:text-red-500 h-6 px-2"
                  onClick={() => onDrop(load._id)}
                  disabled={droppingId === load._id}
                >
                  {droppingId === load._id ? <Loader2 className="size-3 animate-spin" /> : <><Ban className="size-3 mr-1" />Drop Load</>}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   SUBMIT PROOF MODAL
   ================================================================ */
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
      // Reset input value so the same file can be re-selected
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

      await apiClient.post(
        `/api/shipments/${shipment._id}/submit-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to submit proof. Please try again."
      );
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
          {/* Hidden camera input — opens rear camera directly on mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Hidden gallery input — opens file/photo picker */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Camera area */}
          {!preview ? (
            <div className="space-y-3">
              {/* Primary: Take Photo button */}
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

              {/* Secondary: Choose from gallery */}
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
              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-border">
                <img
                  src={preview}
                  alt="Proof preview"
                  className="w-full max-h-60 object-contain bg-muted"
                />
              </div>
              {/* Retake / Change buttons */}
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
