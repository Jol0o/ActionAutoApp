"use client";

import * as React from "react";
import { User2, Package, Clock, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DriverTrackingItem, DriverStatus } from "@/types/driver-tracking";

interface DriverTrackerListCardProps {
  drivers: DriverTrackingItem[];
  isLoading: boolean;
  error: string | null;
  statusLabel: Record<DriverStatus, string>;
  statusStyles: Record<DriverStatus, string>;
  statusText: Record<DriverStatus, string>;
  onAssignLoad?: (driver: DriverTrackingItem) => void;
  onDriverClick?: (driver: DriverTrackingItem) => void;
}

export function DriverTrackerListCard({
  drivers,
  isLoading,
  error,
  statusLabel,
  statusStyles,
  statusText,
  onAssignLoad,
  onDriverClick,
}: DriverTrackerListCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Active Drivers</CardTitle>
        <p className="text-xs text-muted-foreground">
          {drivers.length} drivers tracked
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[432px] overflow-y-auto">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {isLoading && !error && (
          <p className="text-xs text-muted-foreground">Loading drivers...</p>
        )}
        {!isLoading && drivers.length === 0 && !error && (
          <p className="text-xs text-muted-foreground">No drivers found.</p>
        )}
        {drivers.map((driver) => {
          const shipments = driver.shipments ?? [];
          return (
            <Card
              key={driver.id}
              className={`border-border/60 shadow-sm ${onDriverClick && driver.coords ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
              onClick={() =>
                onDriverClick && driver.coords && onDriverClick(driver)
              }
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <User2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {driver.driver?.name || "Unknown Driver"}
                      </p>
                      {shipments.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {shipments.length} load
                          {shipments.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={
                          "h-2 w-2 rounded-full " + statusStyles[driver.status]
                        }
                      />
                      <span className={statusText[driver.status]}>
                        {statusLabel[driver.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {shipments.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Package className="size-3.5" />
                            {shipments.length} load
                            {shipments.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {new Date(driver.lastSeenAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {onAssignLoad && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => onAssignLoad(driver)}
                        >
                          <UserPlus className="size-3" />
                          Assign Load
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
