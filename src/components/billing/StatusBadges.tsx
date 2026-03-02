import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Ban } from "lucide-react";
import { Payment } from "@/types/billing";
import { DriverPayout } from "@/types/driver-payout";

export function StatusBadge({ status }: { status: Payment["status"] }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    pending:    { color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",   icon: <Clock className="size-3" /> },
    processing: { color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",       icon: <Loader2 className="size-3 animate-spin" /> },
    succeeded:  { color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 className="size-3" /> },
    failed:     { color: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",             icon: <XCircle className="size-3" /> },
    refunded:   { color: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: <RefreshCw className="size-3" /> },
    cancelled:  { color: "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",       icon: <Ban className="size-3" /> },
  };
  const c = config[status] ?? config.pending;
  return (
    <Badge variant="outline" className={`gap-1 capitalize ${c.color}`}>
      {c.icon}
      {status}
    </Badge>
  );
}

export function PayoutStatusBadge({ status }: { status: DriverPayout["status"] }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    paid:       { color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 className="size-3" /> },
    processing: { color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",       icon: <Loader2 className="size-3 animate-spin" /> },
    pending:    { color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",   icon: <Clock className="size-3" /> },
    failed:     { color: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",             icon: <XCircle className="size-3" /> },
  };
  const c = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={`gap-1 capitalize ${c.color}`}>
      {c.icon}
      {status}
    </Badge>
  );
}

export function StatCard({ label, value, icon, loading }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          {loading && <Loader2 className="size-3 text-muted-foreground animate-spin" />}
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
