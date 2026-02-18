"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  Package,
} from "lucide-react";

const statusColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

interface GroupedLoads {
  [date: string]: Shipment[];
}

export default function DriverSchedulePage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await apiClient.get("/api/driver-tracking/my-loads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoads(res.data?.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getToken]);

  const upcoming = loads.filter(
    (l) => l.status !== "Delivered" && l.status !== "Cancelled"
  );

  const grouped = React.useMemo(() => {
    const groups: GroupedLoads = {};
    upcoming.forEach((load) => {
      const dateStr = load.scheduledPickup
        ? new Date(load.scheduledPickup).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Unscheduled";
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(load);
    });
    return groups;
  }, [upcoming]);

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === "Unscheduled") return 1;
    if (b === "Unscheduled") return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground text-sm">
          Your upcoming pickups and deliveries.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedDates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Calendar className="size-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No upcoming loads</p>
            <p className="text-xs">Your schedule is clear.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{date}</h2>
                <Badge variant="secondary" className="text-xs">
                  {grouped[date].length}{" "}
                  {grouped[date].length === 1 ? "load" : "loads"}
                </Badge>
              </div>
              <div className="space-y-2 ml-6 border-l-2 border-muted pl-4">
                {grouped[date].map((load) => (
                  <Card key={load._id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium">
                              {load.trackingNumber || "—"}
                            </span>
                            <Badge
                              variant="outline"
                              className={statusColors[load.status] || ""}
                            >
                              {load.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span className="truncate">{load.origin}</span>
                            <ArrowRight className="size-3 shrink-0" />
                            <span className="truncate">
                              {load.destination}
                            </span>
                          </div>
                          {load.scheduledPickup && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {new Date(
                                load.scheduledPickup
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
