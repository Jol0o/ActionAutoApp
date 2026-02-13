"use client";

import * as React from "react";
import { Plus, Minus, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DriverTrackerMapProps {
  mapboxToken?: string;
  mapRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  mapNotice?: string | null;
}

export function DriverTrackerMap({
  mapboxToken,
  mapRef,
  onZoomIn,
  onZoomOut,
  onCenter,
  mapNotice,
}: DriverTrackerMapProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-0">
        <div className="relative h-[540px] rounded-lg overflow-hidden bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
          {mapboxToken ? (
            <div ref={mapRef} className="h-full w-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map.
            </div>
          )}

          {mapNotice && mapboxToken && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              {mapNotice}
            </div>
          )}


          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow-sm"
              onClick={onZoomIn}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow-sm"
              onClick={onZoomOut}
            >
              <Minus className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow-sm"
              onClick={onCenter}
            >
              <LocateFixed className="size-4" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 w-40 rounded-lg border border-border/60 bg-white shadow-sm">
            <div className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Status Legend
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-700">On Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-gray-700">Offline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
