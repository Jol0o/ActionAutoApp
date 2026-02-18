"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Shipment } from "@/types/transportation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  ArrowRight,
} from "lucide-react";

const statusColors: Record<string, string> = {
  "Available for Pickup": "bg-blue-500/10 text-blue-600 border-blue-200",
  Dispatched: "bg-amber-500/10 text-amber-600 border-amber-200",
  "In-Route": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Delivered: "bg-green-500/10 text-green-700 border-green-200",
  Cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

type Tab = "active" | "completed" | "all";

export default function DriverLoadsPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("active");
  const [search, setSearch] = React.useState("");
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);

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

  const handleAccept = async (shipmentId: string) => {
    setAcceptingId(shipmentId);
    try {
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/accept-load",
        { shipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchLoads();
    } catch {
      // silent
    } finally {
      setAcceptingId(null);
    }
  };

  const filtered = React.useMemo(() => {
    let result = loads;
    if (tab === "active") {
      result = result.filter(
        (l) => l.status !== "Delivered" && l.status !== "Cancelled"
      );
    } else if (tab === "completed") {
      result = result.filter((l) => l.status === "Delivered");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.trackingNumber?.toLowerCase().includes(q) ||
          l.origin?.toLowerCase().includes(q) ||
          l.destination?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [loads, tab, search]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Loads</h1>
        <p className="text-muted-foreground text-sm">
          Manage your assigned shipments.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === t.key
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="size-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No loads found</p>
            <p className="text-xs">
              {tab === "active"
                ? "You have no active loads right now."
                : "No loads match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((load) => (
            <Card key={load._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-bold">
                        {load.trackingNumber || "No tracking #"}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[load.status] || ""}
                      >
                        {load.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{load.origin}</span>
                      <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{load.destination}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {load.scheduledPickup && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Pickup:{" "}
                          {new Date(
                            load.scheduledPickup
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {load.scheduledDelivery && (
                        <span className="flex items-center gap-1">
                          <Truck className="size-3" />
                          Delivery:{" "}
                          {new Date(
                            load.scheduledDelivery
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {load.assignedAt && (
                        <span>
                          Assigned:{" "}
                          {new Date(load.assignedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {!load.driverAcceptedAt &&
                    load.status !== "Delivered" &&
                    load.status !== "Cancelled" && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(load._id)}
                        disabled={acceptingId === load._id}
                      >
                        {acceptingId === load._id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="size-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    )}
                  {load.driverAcceptedAt && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="size-3.5" />
                      Accepted
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
