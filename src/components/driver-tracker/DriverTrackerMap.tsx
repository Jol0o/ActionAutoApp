"use client";

import * as React from "react";
import { Plus, Minus, LocateFixed, Satellite, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MapFilter = "all" | "sharing" | "on-route" | "with-loads";

const MAP_FILTERS: { key: MapFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sharing", label: "Sharing" },
  { key: "on-route", label: "On Route" },
  { key: "with-loads", label: "With Loads" },
];

interface DriverTrackerMapProps {
  mapboxToken?: string;
  mapRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  mapNotice?: string | null;
  activeCount?: number;
  mapFilter?: MapFilter;
  onMapFilterChange?: (filter: MapFilter) => void;
}

export function DriverTrackerMap({
  mapboxToken,
  mapRef,
  onZoomIn,
  onZoomOut,
  onCenter,
  mapNotice,
  activeCount = 0,
  mapFilter = "all",
  onMapFilterChange,
}: DriverTrackerMapProps) {
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden bg-card p-0 gap-0">
      <CardContent className="p-0">
        <div className="relative h-150 overflow-hidden" style={{ background: "#e5e7eb" }}>
          {mapboxToken ? (
            <div ref={mapRef} className="h-full w-full" style={{ width: "100%", height: "100%" }} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                <Satellite className="size-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map
              </p>
            </div>
          )}

          {mapNotice && mapboxToken && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 px-6 py-3 shadow-lg">
                <p className="text-xs text-muted-foreground font-medium">{mapNotice}</p>
              </div>
            </div>
          )}

          {onMapFilterChange && (
            <div className="absolute top-4 left-4 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg p-1.5 flex items-center gap-1">
              <Filter className="size-3.5 text-muted-foreground ml-2 mr-1" />
              {MAP_FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={mapFilter === f.key ? "default" : "ghost"}
                  className={`h-7 px-2.5 text-[10px] font-bold rounded-lg ${mapFilter === f.key ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => onMapFilterChange(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          )}

          <TooltipProvider>
            <div className="absolute top-4 right-4 flex flex-col gap-1.5">
              {[
                { action: onZoomIn, icon: <Plus className="size-4" />, label: "Zoom in" },
                { action: onZoomOut, icon: <Minus className="size-4" />, label: "Zoom out" },
                { action: onCenter, icon: <LocateFixed className="size-4" />, label: "Center on me" },
              ].map((btn) => (
                <Tooltip key={btn.label}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-9 shadow-md bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background hover:shadow-lg transition-all duration-200"
                      onClick={btn.action}
                    >
                      {btn.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">{btn.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="absolute bottom-4 left-4 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg p-4 w-44">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Status Legend
            </p>
            <div className="space-y-2 text-xs">
              {[
                { color: "bg-emerald-500", pulse: true, label: "On Route" },
                { color: "bg-amber-500", pulse: false, label: "Idle" },
                { color: "bg-blue-500", pulse: false, label: "Waiting" },
                { color: "bg-slate-500", pulse: false, label: "On Break" },
                { color: "bg-slate-400", pulse: false, label: "Offline" },
                { color: "bg-orange-500", pulse: false, label: "Load Location", shape: "square" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5">
                    {item.pulse && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.color} opacity-40`} />
                    )}
                    <span className={`relative inline-flex size-2.5 ${"shape" in item ? "rounded-sm" : "rounded-full"} ${item.color}`} />
                  </span>
                  <span className="text-foreground/80 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            {activeCount > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold text-foreground">{activeCount}</span> active now
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
