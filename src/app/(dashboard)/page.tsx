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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Car,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Package,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Briefcase,
  Target,
  Trophy,
  Download,
  Plus,
  BarChart3,
  FileText,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import Link from "next/link"
import { useDashboardStats, DashboardMetrics } from "@/hooks/useDashboardStats"
import { Skeleton } from "@/components/ui/skeleton"

// ── Components ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [currentTime, setCurrentTime] = React.useState(new Date())
  const [revenuePeriod, setRevenuePeriod] = React.useState<string>("1Y")
  const [leaderboardMonth, setLeaderboardMonth] = React.useState<string>("Mar")

  const { data: metrics, isLoading, error } = useDashboardStats(revenuePeriod, leaderboardMonth)

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive font-bold">Failed to load dashboard metrics</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Map backend stats to KPI layout
  const kpiData = [
    {
      label: "Active Inventory",
      value: isLoading ? "..." : metrics?.stats?.activeInventory?.toString() || "0",
      description: "Units ready / in recon",
      icon: <Car className="size-40" />,
      trend: "+5%", // Placeholder for now
      trendUp: true,
    },
    {
      label: "Total Quotes",
      value: isLoading ? "..." : metrics?.stats?.monthlyQuotes?.toString() || "0",
      description: "Monthly quote volume",
      icon: <TrendingUp className="size-40" />,
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Potential Revenue",
      value: isLoading ? "..." : formatCurrency(metrics?.stats?.potentialRevenue || 0),
      description: "Pending funnel value",
      icon: <DollarSign className="size-40" />,
      trend: "+18%",
      trendUp: true,
    },
    {
      label: "Avg. Days on Lot",
      value: isLoading ? "..." : metrics?.stats?.avgDaysOnLot?.toString() || "14",
      description: "Turnover efficiency",
      icon: <Calendar className="size-40" />,
      trend: "-2 days",
      trendUp: true,
    },
  ]

  const leaderboardData = metrics?.leaderboard || []
  const trajectoryData = metrics?.revenueTrajectory || []
  const logisticsData = metrics?.logistics || { drivers: { active: 0, ready: 0 }, shipments: {} }
  const livePayments = metrics?.livePayments || []

  const shipmentStatusMap = [
    { status: "Available", key: "Available", color: "bg-emerald-500" },
    { status: "In Route", key: "In Route", color: "bg-primary" },
    { status: "Dispatched", key: "Dispatched", color: "bg-indigo-500" },
    { status: "Delivered", key: "Delivered", color: "bg-emerald-600" },
    { status: "Cancelled", key: "Cancelled", color: "bg-destructive" },
  ]

  return (
    <div className="p-4 sm:p-8 space-y-8 container mx-auto min-h-screen">
      {/* Header - Cleaned up */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5">
              Management Portal
            </Badge>
            <div className="size-1 rounded-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              <span className="text-primary/60 font-black">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground">Operational Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            {leaderboardData.slice(0, 4).map((rep: any) => (
              <Avatar key={rep.name} className="border-2 border-background lg:size-10 md:size-8 size-6 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                <AvatarFallback className="text-xs bg-muted font-bold">{rep.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: KPI Hub - Premium Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} className="p-0 border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden bg-card/80 backdrop-blur-sm border">
            <div className="absolute top-0 left-40 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <div >{kpi.icon}</div>
            </div>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24 mb-2" />
                ) : (
                  <h3 className="text-3xl font-black tracking-tighter text-foreground">{kpi.value}</h3>
                )}
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{kpi.description}</p>
              </div>
              <div className="flex items-start justify-between mb-4">
                <Badge variant="secondary" className={`text-[10px] font-black ${kpi.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {kpi.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Comprehensive Leaderboard & Logistics tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Expanded Performance Leaderboard */}
        <Card className="lg:col-span-8 p-0 border-border/50 bg-card overflow-hidden shadow-sm gap-0">
          <CardHeader className="py-5 px-8 border-b border-border/10 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                Performance Leaderboard
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-tight text-muted-foreground/60">Comprehensive dealership member metrics</CardDescription>
            </div>
            <div className="flex gap-1.5 p-1 bg-muted/30 rounded-lg">
              {["Jan", "Feb", "Mar"].map((month) => (
                <button
                  key={month}
                  onClick={() => setLeaderboardMonth(month)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${leaderboardMonth === month
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="py-3 text-[10px] font-black uppercase tracking-widest">Team Member</TableHead>
                    <TableHead className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Calls</TableHead>
                    <TableHead className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Convs</TableHead>
                    <TableHead className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Appts</TableHead>
                    <TableHead className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Shipments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((rep: any, idx: number) => (
                    <TableRow key={rep.name} className="hover:bg-muted/20 border-border/50 transition-colors h-16">
                      <TableCell className="px-8">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="size-9 border border-border">
                              <AvatarImage src={rep.avatar} />
                              <AvatarFallback className="font-bold text-xs bg-muted uppercase">{rep.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute -top-1 -right-1 size-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`}>
                              {idx + 1}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-none mb-1">{rep.name}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{rep.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-sm">{rep.calls}</TableCell>
                      <TableCell className="text-center font-black text-sm">{rep.convs}</TableCell>
                      <TableCell className="text-center font-black text-sm text-primary">{rep.appts}</TableCell>
                      <TableCell className=" text-center font-black text-sm text-emerald-500">{rep.shipments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Logistics & Driver Health */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/50 p-0 bg-card shadow-sm gap-0">
            <CardHeader className="py-5 px-6 border-b border-border/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Driver Status
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">Network Availabilty</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center">
                <p className="text-3xl font-black text-emerald-500 leading-none mb-2">
                  {isLoading ? "..." : logisticsData.drivers.active}
                </p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-80">Active</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                <p className="text-3xl font-black text-primary leading-none mb-2">
                  {isLoading ? "..." : logisticsData.drivers.ready}
                </p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">Ready</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 p-0 bg-card shadow-sm flex-1 gap-0">
            <CardHeader className="py-5 px-6 border-b border-border/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Shipment Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {shipmentStatusMap.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-2 rounded-full ${item.color}`} />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{item.status}</span>
                  </div>
                  <span className="text-xs font-black text-foreground">
                    {isLoading ? "..." : logisticsData.shipments[item.key] || 0}
                  </span>
                </div>
              ))}
              <div className="pt-4 border-t border-border/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer group">
                View Full Pipeline
                <ChevronRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Row 3: Revenue & Payments Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Trajectory */}
        <Card className="lg:col-span-7 border-border/50 bg-card overflow-hidden shadow-sm gap-0 p-0">
          <CardHeader className="py-5 px-8 flex flex-row items-center justify-between border-b border-border/10 text-nowrap">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                Revenue Trajectory
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">Monthly performance momentum</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
                {["7D", "1M", "1Y"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${revenuePeriod === period
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary tracking-tighter leading-none">
                  {isLoading ? "..." : formatCurrency(trajectoryData.reduce((acc: number, curr: any) => acc + curr.revenue, 0))}
                </p>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Total Period Revenue</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorRevRestored" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 800 }}
                    interval="preserveStartEnd"
                    dy={10}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover/90 backdrop-blur-md p-4 shadow-2xl border border-border rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wide">{payload[0].payload.name}</p>
                            <span className="text-xl font-black text-primary tracking-tighter">{formatCurrency(payload[0].value as number)}</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorRevRestored)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Live Payment Stream */}
        <Card className="lg:col-span-5 border-border/50 bg-card overflow-hidden shadow-sm gap-0 p-0">
          <CardHeader className="py-5 px-8 border-b border-border/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              Live Payment Stream
            </CardTitle>
            <Link href="/payments" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 group">
              View All <ChevronRight className="size-3 group-hover:translate-x-1" />
            </Link>
          </CardHeader>
          <div className="h-[480px] overflow-auto">
            <Table>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map((i: number) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-12 w-full" /></TableCell></TableRow>)
                ) : livePayments.map((payment: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/20 border-border/50 transition-colors h-16">
                    <TableCell className="px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{payment.customerName}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mt-1">{payment.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-sm text-center">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-right px-8">
                      <Badge variant="secondary" className={`text-[9px] font-black uppercase px-2 py-0.5 border-none ${payment.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-500' :
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
          </div>
        </Card>
      </div>

      {/* Row 4: Inventory Analysis (Modified for Live Stream) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">

        {/* Inventory Analytics (Replacing Mock List with Location-like Summary for now) */}
        <Card className="lg:col-span-12 border-border/50 bg-card shadow-sm flex flex-col gap-0 p-0">
          <CardHeader className="py-5 px-6 border-b border-border/10">
            <CardTitle className="text-sm font-bold">Dealership Pipeline Momentum</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">Operational Health</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h4 className="text-lg font-black tracking-tighter">Inventory Turnover</h4>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Target: 14 Days | Current: {metrics?.stats?.avgDaysOnLot || 14} Days</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-black tracking-tighter">Quote Conversion</h4>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Inbound volume up 12% this month</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-black tracking-tighter">Network Health</h4>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${Math.round((logisticsData.drivers.active / (logisticsData.drivers.active + logisticsData.drivers.ready || 1)) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  {Math.round((logisticsData.drivers.active / (logisticsData.drivers.active + logisticsData.drivers.ready || 1)) * 100)}% of drivers currently active/ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Select({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
  return <div className="flex items-center">{children}</div>
}
