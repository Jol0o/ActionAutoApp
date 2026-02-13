"use client";

import * as React from "react";
import { User2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Drivers Assigned Loads</CardTitle>
        <p className="text-xs text-muted-foreground">
          Loads currently assigned to drivers.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
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
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User2 className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {item.driver?.name || "Unknown Driver"}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Package className="size-3" />
                  {item.shipment?.trackingNumber || item.shipment?.id || "—"}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {item.shipment?.status || "—"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
