"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ChevronRight, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { DashboardMetrics } from "@/hooks/useDashboardStats"

interface RevenueIntelligenceProps {
  trajectory: DashboardMetrics['revenueTrajectory']
  livePayments: DashboardMetrics['livePayments']
  period: string
  onPeriodChange: (period: string) => void
  isLoading: boolean
}

export function RevenueIntelligence({
  trajectory,
  livePayments,
  period,
  onPeriodChange,
  isLoading
}: RevenueIntelligenceProps) {
  const totalPeriodRevenue = React.useMemo(() => {
    return trajectory.reduce((acc, curr) => acc + curr.revenue, 0)
  }, [trajectory])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Revenue Trajectory Chart */}
      <Card className="lg:col-span-7 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col p-0">
        <CardHeader className="py-5 px-6 border-b border-border/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
                Revenue Trajectory
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Monthly Performance Momentum
              </CardDescription>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
                {["7D", "1M", "1Y"].map((p) => (
                  <button
                    key={p}
                    onClick={() => onPeriodChange(p)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${period === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-primary tracking-tight leading-none tabular-nums">
                  {isLoading ? "..." : formatCurrency(totalPeriodRevenue)}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Total Period</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-[350px]">
          {isLoading ? (
            <div className="h-full w-full p-8 space-y-4">
              <Skeleton className="h-full w-full rounded-2xl" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectory} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  hide
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/90 backdrop-blur-xl p-3 shadow-2xl border border-border/40 rounded-2xl">
                          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest leading-none">
                            {payload[0].payload.name}
                          </p>
                          <span className="text-lg font-black text-primary tracking-tight italic">
                            {formatCurrency(payload[0].value as number)}
                          </span>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Live Payments Feed */}
      <Card className="lg:col-span-5 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
        <CardHeader className="py-5 px-6 border-b border-border/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <DollarSign className="h-4 w-4" />
              </div>
              Live Payments
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Transaction Stream
            </CardDescription>
          </div>
          <Link href="/payments" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 group">
            All <ChevronRight className="h-3 w-3 group-hover:translate-x-1" />
          </Link>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto max-h-[480px]">
          <Table>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : livePayments.map((payment, i) => (
                <TableRow key={i} className="hover:bg-muted/30 border-border/30 transition-colors h-16 group">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground leading-none">{payment.customerName}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-medium mt-1 truncate max-w-[200px] uppercase tracking-tighter">
                        {payment.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-sm tabular-nums text-right">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Badge variant="secondary" className={`text-[8px] font-black uppercase px-2 py-0.5 border-none ${payment.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-500' :
                        payment.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                      }`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
