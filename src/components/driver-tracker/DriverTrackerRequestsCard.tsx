"use client";

import * as React from "react";
import { Bell, CheckCircle2, XCircle, Truck, MapPin, ArrowRight, Loader2, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trailerTypeOptions } from "@/components/driver-profile/driver-profile-constants";

interface LoadRequest {
  shipmentId: string;
  trackingNumber?: string;
  origin: string;
  destination: string;
  trailerTypeRequired?: string;
  vehicleCount?: number;
  carrierPayAmount?: number;
  requestedPickupDate?: string;
  driverId: string;
  driverName: string;
  requestedAt: string;
  equipment?: {
    trailerType?: string;
    maxVehicleCapacity?: number;
    operationalStatus?: string;
    isComplianceExpired?: boolean;
    truckMake?: string;
    truckModel?: string;
    profileCompletionScore?: number;
  } | null;
}

interface DriverTrackerRequestsCardProps {
  requests: LoadRequest[];
  isLoading: boolean;
  onApprove: (shipmentId: string, driverId: string) => void;
  onReject: (shipmentId: string, driverId: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
}

const trailerLabel = (val?: string) =>
  trailerTypeOptions.find((t) => t.value === val)?.label ?? val ?? "Unknown";

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export function DriverTrackerRequestsCard({
  requests,
  isLoading,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}: DriverTrackerRequestsCardProps) {
  if (!isLoading && requests.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Bell className="size-20" />
      </div>
      <CardHeader className="py-4 px-5 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="size-4 text-amber-500" />
              Load Requests
            </CardTitle>
            <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">
              {requests.length} pending request{requests.length !== 1 ? "s" : ""}
            </p>
          </div>
          {requests.length > 0 && (
            <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-200">
              {requests.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 max-h-100 overflow-y-auto space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-xl space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-7 w-full" />
              </div>
            ))}
          </div>
        )}

        {requests.map((req) => {
          const key = `${req.shipmentId}-${req.driverId}`;
          const isApproving = approvingId === key;
          const isRejecting = rejectingId === key;
          const trailerMatch = req.equipment?.trailerType && req.trailerTypeRequired
            ? req.equipment.trailerType === req.trailerTypeRequired
            : null;
          const capacityMatch = req.equipment?.maxVehicleCapacity && req.vehicleCount
            ? req.equipment.maxVehicleCapacity >= req.vehicleCount
            : null;

          return (
            <div key={key} className="rounded-xl border border-border/40 p-3 space-y-2.5 transition-all hover:border-amber-300/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{req.driverName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {req.equipment?.truckMake && (
                      <span className="text-[9px] text-muted-foreground">
                        {req.equipment.truckMake} {req.equipment.truckModel || ""}
                      </span>
                    )}
                    {req.equipment?.trailerType && (
                      <Badge className="text-[8px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-purple-200 h-4">
                        {trailerLabel(req.equipment.trailerType)}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="size-2.5" />{timeAgo(req.requestedAt)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <Badge variant="outline" className="text-[9px] font-semibold shrink-0">
                  {req.trackingNumber || req.shipmentId.slice(-8)}
                </Badge>
                <span className="truncate text-muted-foreground">
                  {req.origin}
                </span>
                <ArrowRight className="size-2.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  {req.destination}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {trailerMatch !== null && (
                  <Badge className={`text-[8px] px-1.5 py-0 h-4 gap-0.5 ${trailerMatch ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
                    {trailerMatch ? <CheckCircle2 className="size-2" /> : <XCircle className="size-2" />}
                    Trailer
                  </Badge>
                )}
                {capacityMatch !== null && (
                  <Badge className={`text-[8px] px-1.5 py-0 h-4 gap-0.5 ${capacityMatch ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
                    {capacityMatch ? <CheckCircle2 className="size-2" /> : <XCircle className="size-2" />}
                    Capacity
                  </Badge>
                )}
                {req.equipment?.isComplianceExpired && (
                  <Badge className="text-[8px] px-1.5 py-0 h-4 gap-0.5 bg-red-500/10 text-red-600 border-red-200">
                    <AlertTriangle className="size-2" />Compliance
                  </Badge>
                )}
                {req.carrierPayAmount != null && req.carrierPayAmount > 0 && (
                  <Badge className="text-[8px] px-1.5 py-0 h-4 gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    <DollarSign className="size-2" />{req.carrierPayAmount.toLocaleString()}
                  </Badge>
                )}
              </div>

              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-[10px] font-semibold gap-1"
                  onClick={() => onApprove(req.shipmentId, req.driverId)}
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[10px] font-semibold gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  onClick={() => onReject(req.shipmentId, req.driverId)}
                  disabled={isApproving || isRejecting}
                >
                  {isRejecting ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3" />}
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
