"use client";

import * as React from "react";
import { Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverStatus } from "@/types/driver-tracking";

interface DriverTrackerShareCardProps {
  shareStatus: DriverStatus;
  onStatusChange: (status: DriverStatus) => void;
  isSharing: boolean;
  onToggleSharing: () => void;
  lastShareAt: string | null;
  shareError: string | null;
}

const statusOptions: Array<{ key: DriverStatus; label: string }> = [
  { key: "on-route", label: "On Route" },
  { key: "idle", label: "Idle" },
  { key: "offline", label: "Offline" },
];

export function DriverTrackerShareCard({
  shareStatus,
  onStatusChange,
  isSharing,
  onToggleSharing,
  lastShareAt,
  shareError,
}: DriverTrackerShareCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Driver GPS</CardTitle>
        <p className="text-xs text-muted-foreground">
          Share your live location from this device.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {statusOptions.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={shareStatus === item.key ? "default" : "outline"}
              className="h-8 px-3 text-xs"
              onClick={() => onStatusChange(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 px-4 text-xs"
            variant={isSharing ? "secondary" : "default"}
            onClick={onToggleSharing}
          >
            <Navigation2 className="size-3.5 mr-2" />
            {isSharing ? "Stop Sharing" : "Start Sharing"}
          </Button>
          {lastShareAt && (
            <span className="text-[11px] text-muted-foreground">
              Last update: {lastShareAt}
            </span>
          )}
        </div>
        {shareError && (
          <p className="text-[11px] text-destructive">{shareError}</p>
        )}
      </CardContent>
    </Card>
  );
}
