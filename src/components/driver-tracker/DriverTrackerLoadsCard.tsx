"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User2, Package, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DriverTrackingItem } from "@/types/driver-tracking";

interface DriverTrackerLoadsCardProps {
  drivers: DriverTrackingItem[];
  isLoading: boolean;
  error: string | null;
}

export function DriverTrackerLoadsCard({
  drivers,
  isLoading,
  error,
}: DriverTrackerLoadsCardProps) {
  const router = useRouter();
  const [viewDriver, setViewDriver] =
    React.useState<DriverTrackingItem | null>(null);

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Drivers Assigned Loads</CardTitle>
          <p className="text-xs text-muted-foreground">
            Loads currently assigned to drivers.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
          {error && <p className="text-xs text-destructive">{error}</p>}
          {isLoading && !error && (
            <p className="text-xs text-muted-foreground">
              Loading assigned loads...
            </p>
          )}
          {!isLoading && drivers.length === 0 && !error && (
            <p className="text-xs text-muted-foreground">No assigned loads.</p>
          )}
          {drivers.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <User2 className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.driver?.name || "Unknown Driver"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Package className="size-3" />
                    {item.shipments.length} load{item.shipments.length !== 1 ? "s" : ""} assigned
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] gap-1 shrink-0"
                onClick={() => setViewDriver(item)}
              >
                <Eye className="size-3" />
                View Loads
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* View Loads Modal */}
      <Dialog
        open={viewDriver !== null}
        onOpenChange={(open) => {
          if (!open) setViewDriver(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {viewDriver?.driver?.name || "Driver"} — Assigned Loads
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {viewDriver?.shipments.length || 0} load{(viewDriver?.shipments.length || 0) !== 1 ? "s" : ""} assigned to this driver.
            </p>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {viewDriver?.shipments.length === 0 && (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No loads assigned.
              </p>
            )}
            {viewDriver?.shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  const query = shipment.trackingNumber || shipment.id;
                  router.push(`/transportation?search=${encodeURIComponent(query)}`);
                }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {shipment.trackingNumber || shipment.id}
                    </p>
                    {(shipment.origin || shipment.destination) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {shipment.origin} → {shipment.destination}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {shipment.status || "—"}
                  </Badge>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
