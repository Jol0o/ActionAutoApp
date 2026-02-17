"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
          <DialogTitle className="text-base">
            Assign Load — {driver?.driver?.name || "Driver"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Select an available load to assign to this driver.
          </p>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {isLoading && (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Loading available loads...
            </p>
          )}
          {!isLoading && availableShipments.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No loads available for pickup.
            </p>
          )}
          {availableShipments.map((shipment) => (
            <div
              key={shipment._id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <Truck className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {shipment.trackingNumber || shipment._id}
                  </p>
                  {(shipment.origin || shipment.destination) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {shipment.origin} → {shipment.destination}
                    </p>
                  )}
                  {shipment.requestedPickupDate && (
                    <p className="text-[11px] text-muted-foreground">
                      Pickup:{" "}
                      {new Date(
                        shipment.requestedPickupDate,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 px-3 text-xs shrink-0"
                onClick={() => handleAssign(shipment._id)}
                disabled={assigning !== null}
              >
                {assigning === shipment._id ? "Assigning..." : "Assign"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
