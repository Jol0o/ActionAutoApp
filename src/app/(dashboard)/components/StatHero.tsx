"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Car,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react"
import { formatCurrency } from "@/utils/format"
import { DashboardMetrics } from "@/hooks/useDashboardStats"

interface StatHeroProps {
  metrics?: DashboardMetrics
  isLoading: boolean
}

export function StatHero({ metrics, isLoading }: StatHeroProps) {
  const intelligence = metrics?.intelligence
  const stats = metrics?.stats

  const kpis = [
    {
      label: "Active Inventory",
      value: isLoading ? "..." : stats?.activeInventory?.toString() || "0",
      description: "Units ready / in recon",
      icon: <Car className="h-5 w-5 text-blue-500" />,
      color: "blue",
    },
    {
      label: "Net Logistics Margin",
      value: isLoading ? "..." : formatCurrency(intelligence?.netMargin || 0),
      description: "Profit after carrier pay",
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      color: "emerald",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Potential Revenue",
      value: isLoading ? "..." : formatCurrency(stats?.potentialRevenue || 0),
      description: "Pending funnel value",
      icon: <DollarSign className="h-5 w-5 text-amber-500" />,
      color: "amber",
    },
    {
      label: "Speed to Lead",
      value: isLoading ? "..." : `${intelligence?.speedToLead || 0}m`,
      description: "Avg response time",
      icon: <Clock className="h-5 w-5 text-indigo-500" />,
      color: "indigo",
      trend: "-2m",
      trendUp: true, // Lower is better
    },
    {
      label: "Total Quotes",
      value: isLoading ? "..." : stats?.monthlyQuotes?.toString() || "0",
      description: "Monthly volume",
      icon: <Briefcase className="h-5 w-5 text-violet-500" />,
      color: "violet",
    },
    {
      label: "Compliance Alerts",
      value: isLoading ? "..." : intelligence?.complianceAlerts?.toString() || "0",
      description: "Expired driver docs",
      icon: <ShieldCheck className={`h-5 w-5 ${(intelligence?.complianceAlerts || 0) > 0 ? "text-rose-500" : "text-emerald-500"}`} />,
      color: (intelligence?.complianceAlerts || 0) > 0 ? "rose" : "emerald",
      alert: (intelligence?.complianceAlerts || 0) > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="relative overflow-hidden border border-border/40 bg-card hover:border-border/80 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-xl bg-${kpi.color}-500/10`}>
                {kpi.icon}
              </div>
              {kpi.trend && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                  {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-1">
              <h3 className="text-2xl font-black tracking-tight tabular-nums">
                {kpi.value}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate">
                {kpi.label}
              </p>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-[9px] text-muted-foreground/40 font-medium">
                {kpi.description}
              </p>
              {kpi.alert && (
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>

            {/* Subtle background gradient based on color */}
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-${kpi.color}-500/5 blur-2xl pointer-events-none`} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
