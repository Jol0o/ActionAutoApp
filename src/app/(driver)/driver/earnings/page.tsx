"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default function DriverEarningsPage() {
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

  const completedLoads = loads.filter((l) => l.status === "Delivered");
  const totalLoads = loads.length;
  const activeLoads = loads.filter(
    (l) => l.status !== "Delivered" && l.status !== "Cancelled"
  ).length;

  const monthlyBreakdown = React.useMemo(() => {
    const months: Record<string, number> = {};
    completedLoads.forEach((load) => {
      const date = load.delivered
        ? new Date(load.delivered)
        : new Date(load.createdAt);
      const key = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [completedLoads]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground text-sm">
          Your activity and completed loads summary.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {completedLoads.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Completed Loads
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Package className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLoads}</p>
                    <p className="text-xs text-muted-foreground">Total Loads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingUp className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeLoads}</p>
                    <p className="text-xs text-muted-foreground">
                      In Progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {monthlyBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Monthly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthlyBreakdown.map(([month, count]) => (
                    <div
                      key={month}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <span className="text-sm font-medium">{month}</span>
                      <Badge variant="secondary">
                        {count} {count === 1 ? "load" : "loads"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                Completed Loads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedLoads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <DollarSign className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">No completed loads yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedLoads.map((load) => (
                    <div
                      key={load._id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="min-w-0 space-y-1">
                        <span className="text-sm font-mono font-medium">
                          {load.trackingNumber || "—"}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          <span className="truncate">{load.origin}</span>
                          <ArrowRight className="size-3 shrink-0" />
                          <span className="truncate">{load.destination}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-700 border-green-200"
                        >
                          Delivered
                        </Badge>
                        {load.delivered && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(load.delivered).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
