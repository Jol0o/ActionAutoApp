"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { useDriverLocationSharing } from "@/hooks/useDriverLocationSharing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

export default function DriverDashboardPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const {
    isSharing,
    status,
    lastShareAt,
    error: locationError,
    startSharing,
    stopSharing,
    updateStatus,
  } = useDriverLocationSharing();

  const fetchLoads = React.useCallback(async () => {
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
  }, [getToken]);

  React.useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const activeLoads = loads.filter(
    (l) => l.status !== "Delivered" && l.status !== "Cancelled"
  );
  const completedLoads = loads.filter((l) => l.status === "Delivered");
  const currentLoad = activeLoads[0];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loads.length}</p>
                <p className="text-xs text-muted-foreground">Total Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Truck className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeLoads.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedLoads.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Navigation className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isSharing ? (
                    <span className="text-emerald-600">ON</span>
                  ) : (
                    <span className="text-muted-foreground">OFF</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">GPS Sharing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Location Sharing Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4" />
              Location Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Status:{" "}
                  <span
                    className={
                      isSharing ? "text-emerald-600" : "text-muted-foreground"
                    }
                  >
                    {isSharing ? "Sharing" : "Not sharing"}
                  </span>
                </p>
                {lastShareAt && (
                  <p className="text-xs text-muted-foreground">
                    Last update: {lastShareAt}
                  </p>
                )}
              </div>
              <Button
                onClick={isSharing ? stopSharing : startSharing}
                variant={isSharing ? "destructive" : "default"}
                size="sm"
              >
                {isSharing ? "Stop Sharing" : "Start Sharing"}
              </Button>
            </div>

            {isSharing && (
              <div className="flex gap-2">
                {(["on-route", "idle"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateStatus(s)}
                    className="text-xs"
                  >
                    {s === "on-route" ? "On Route" : "Idle"}
                  </Button>
                ))}
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4" />
                {locationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Load Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="size-4" />
              Current Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : currentLoad ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-medium">
                    {currentLoad.trackingNumber || "No tracking #"}
                  </span>
                  <Badge
                    variant="outline"
                    className={statusColors[currentLoad.status] || ""}
                  >
                    {currentLoad.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Origin</p>
                    <p className="font-medium truncate">
                      {currentLoad.origin}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium truncate">
                      {currentLoad.destination}
                    </p>
                  </div>
                </div>
                {currentLoad.scheduledPickup && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    Pickup:{" "}
                    {new Date(currentLoad.scheduledPickup).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="size-8 mb-2 opacity-50" />
                <p className="text-sm">No active loads</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Loads */}
      {activeLoads.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Other Active Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeLoads.slice(1).map((load) => (
                <div
                  key={load._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Package className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium">
                        {load.trackingNumber || "No tracking #"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {load.origin} → {load.destination}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusColors[load.status] || ""}
                  >
                    {load.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
