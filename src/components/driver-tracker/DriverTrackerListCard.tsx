"use client";

import * as React from "react";
import { User2, Package, Clock, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Users className="size-20" />
      </div>
      <CardHeader className="py-4 px-5 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User2 className="size-4 text-primary" />
              Active Drivers
            </CardTitle>
            <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">
              {drivers.length} driver{drivers.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          {drivers.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-bold bg-primary/5 text-primary">
              {drivers.filter((d) => d.status !== "offline").length} online
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 max-h-115 overflow-y-auto space-y-2">
        {error && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
            <p className="text-[11px] text-destructive font-medium">{error}</p>
          </div>
        )}

        {isLoading && !error && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && drivers.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="size-12 rounded-xl bg-muted/40 flex items-center justify-center">
              <Users className="size-6 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">No drivers found</p>
          </div>
        )}

        {drivers.map((driver) => {
          const shipments = driver.shipments ?? [];
          return (
            <div
              key={driver.id}
              className={`rounded-xl border border-border/40 p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 ${onDriverClick && driver.coords ? "cursor-pointer" : ""
                }`}
              onClick={() => onDriverClick && driver.coords && onDriverClick(driver)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-9 border-2 border-background shadow-sm">
                  {driver.driver?.avatar && <AvatarImage src={driver.driver.avatar} />}
                  <AvatarFallback className="text-xs font-bold bg-primary/5 text-primary">
                    {driver.driver?.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {driver.driver?.name || "Unknown Driver"}
                    </p>
                    {shipments.length > 0 && (
                      <Badge variant="outline" className="text-[10px] font-semibold shrink-0 border-border/50">
                        {shipments.length} load{shipments.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="relative flex size-2">
                      {driver.status === "on-route" && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusStyles[driver.status]} opacity-40`} />
                      )}
                      <span className={`relative inline-flex size-2 rounded-full ${statusStyles[driver.status]}`} />
                    </span>
                    <span className={`font-semibold ${statusText[driver.status]}`}>
                      {statusLabel[driver.status]}
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                      <Clock className="size-3" />
                      {new Date(driver.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {onAssignLoad && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[10px] font-semibold gap-1 mt-2 border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignLoad(driver);
                      }}
                    >
                      <UserPlus className="size-3" />
                      Assign Load
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
