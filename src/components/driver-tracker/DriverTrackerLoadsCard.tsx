"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Package, Eye, ExternalLink, Truck, Trash2, RefreshCw,
  Loader2, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DriverTrackingItem } from "@/types/driver-tracking";

interface DriverTrackerLoadsCardProps {
  drivers: DriverTrackingItem[];
  isLoading: boolean;
  error: string | null;
  activeDrivers?: DriverTrackingItem[];
  onRemoveLoad?: (shipmentId: string) => Promise<void>;
  onReassignLoad?: (shipmentId: string, newDriverId: string) => Promise<void>;
}

export function DriverTrackerLoadsCard({
  drivers,
  isLoading,
  error,
  activeDrivers = [],
  onRemoveLoad,
  onReassignLoad,
}: DriverTrackerLoadsCardProps) {
  const router = useRouter();
  const [viewDriver, setViewDriver] = React.useState<DriverTrackingItem | null>(null);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [reassigning, setReassigning] = React.useState<string | null>(null);
  const totalLoads = drivers.reduce((sum, d) => sum + (d.shipments?.length || 0), 0);

  const handleRemove = async (shipmentId: string) => {
    if (!onRemoveLoad) return;
    setRemoving(shipmentId);
    try { await onRemoveLoad(shipmentId); } finally { setRemoving(null); }
  };

  const handleReassign = async (shipmentId: string, newDriverId: string) => {
    if (!onReassignLoad) return;
    setReassigning(shipmentId);
    try { await onReassignLoad(shipmentId, newDriverId); } finally { setReassigning(null); }
  };

  return (
    <>
      <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Truck className="size-20" />
        </div>
        <CardHeader className="py-4 px-5 border-b border-border/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Assigned Loads
              </CardTitle>
              <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">
                {totalLoads} load{totalLoads !== 1 ? "s" : ""} active
              </p>
            </div>
            {drivers.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                {drivers.length} driver{drivers.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 max-h-85 overflow-y-auto space-y-2">
          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
              <p className="text-[11px] text-destructive font-medium">{error}</p>
            </div>
          )}

          {isLoading && !error && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && drivers.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center">
                <Package className="size-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">No assigned loads</p>
            </div>
          )}

          {drivers.map((item) => {
            const shipments = item.shipments ?? [];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/40 p-3 hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-8 border border-border/50">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                      {item.driver?.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {item.driver?.name || "Unknown Driver"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
                      <Package className="size-3" />
                      {shipments.length} load{shipments.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[10px] font-semibold gap-1 shrink-0 border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
                  onClick={() => setViewDriver(item)}
                >
                  <Eye className="size-3" />
                  View
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={viewDriver !== null} onOpenChange={(open) => { if (!open) setViewDriver(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {viewDriver?.driver?.name || "Driver"} — Loads
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground/60 font-medium">
              {viewDriver?.shipments?.length || 0} load{(viewDriver?.shipments?.length || 0) !== 1 ? "s" : ""} assigned
            </p>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(viewDriver?.shipments?.length || 0) === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Package className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No loads assigned</p>
              </div>
            )}
            {viewDriver?.shipments?.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-xl border border-border/40 p-3 hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200"
              >
                <div
                  className="flex items-center justify-between gap-3 cursor-pointer"
                  onClick={() => {
                    const query = shipment.trackingNumber || shipment.id;
                    router.push(`/transportation?search=${encodeURIComponent(query)}`);
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                      <Package className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-foreground">
                        {shipment.trackingNumber || shipment.id}
                      </p>
                      {(shipment.origin || shipment.destination) && (
                        <p className="text-[10px] text-muted-foreground/60 truncate font-medium">
                          {shipment.origin} → {shipment.destination}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-semibold border-border/50">
                      {shipment.status || "—"}
                    </Badge>
                    <ExternalLink className="size-3.5 text-muted-foreground/40" />
                  </div>
                </div>

                {(onRemoveLoad || onReassignLoad) && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                    {onRemoveLoad && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] font-semibold gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                        disabled={removing === shipment.id}
                        onClick={(e) => { e.stopPropagation(); handleRemove(shipment.id); }}
                      >
                        {removing === shipment.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                        Remove
                      </Button>
                    )}
                    {onReassignLoad && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] font-semibold gap-1 border-border/50 hover:bg-primary/5"
                            disabled={reassigning === shipment.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reassigning === shipment.id ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                            Reassign
                            <ChevronDown className="size-2.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                          {activeDrivers.filter((d) => d.driver?.id !== viewDriver?.driver?.id).map((d) => (
                            <DropdownMenuItem
                              key={d.id}
                              className="cursor-pointer gap-2"
                              onClick={() => d.driver?.id && handleReassign(shipment.id, d.driver.id)}
                            >
                              <Avatar className="size-5 border border-border/50">
                                {d.driver?.avatar && <AvatarImage src={d.driver.avatar} />}
                                <AvatarFallback className="text-[8px] font-bold bg-primary/5 text-primary">
                                  {d.driver?.name?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium truncate">{d.driver?.name || "Unknown"}</span>
                            </DropdownMenuItem>
                          ))}
                          {activeDrivers.filter((d) => d.driver?.id !== viewDriver?.driver?.id).length === 0 && (
                            <div className="px-3 py-2 text-[10px] text-muted-foreground">No other drivers available</div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
