"use client";

import * as React from "react";
import { Truck, Package, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shipment } from "@/types/transportation";
import { DriverTrackingItem } from "@/types/driver-tracking";

interface DriverAssignLoadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverTrackingItem | null;
  availableShipments: Shipment[];
  isLoading: boolean;
  onAssign: (shipmentId: string) => Promise<void>;
}

export function DriverAssignLoadModal({
  open,
  onOpenChange,
  driver,
  availableShipments,
  isLoading,
  onAssign,
}: DriverAssignLoadModalProps) {
  const [assigning, setAssigning] = React.useState<string | null>(null);

  const handleAssign = async (shipmentId: string) => {
    setAssigning(shipmentId);
    try {
      await onAssign(shipmentId);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            Assign Load — {driver?.driver?.name || "Driver"}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground/60 font-medium">
            Select an available load to assign to this driver.
          </p>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Loading available loads...</p>
            </div>
          )}
          {!isLoading && availableShipments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="size-12 rounded-xl bg-muted/40 flex items-center justify-center">
                <Package className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">No loads available for pickup</p>
            </div>
          )}
          {availableShipments.map((shipment) => (
            <div
              key={shipment._id}
              className="flex items-center justify-between rounded-xl border border-border/40 p-3 gap-3 hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Truck className="size-4 text-primary" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    {shipment.trackingNumber || shipment._id}
                  </p>
                  {(shipment.origin || shipment.destination) && (
                    <p className="text-[10px] text-muted-foreground/60 truncate font-medium">
                      {shipment.origin} → {shipment.destination}
                    </p>
                  )}
                  {shipment.requestedPickupDate && (
                    <p className="text-[10px] text-muted-foreground/60 font-medium">
                      Pickup: {new Date(shipment.requestedPickupDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 px-3 text-[11px] font-bold shrink-0 shadow-sm"
                onClick={() => handleAssign(shipment._id)}
                disabled={assigning !== null}
              >
                {assigning === shipment._id ? (
                  <>
                    <Loader2 className="size-3 mr-1.5 animate-spin" />
                    Assigning
                  </>
                ) : (
                  "Assign"
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
