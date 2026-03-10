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

// ── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_KPI_DATA = [
  {
    label: "Active Inventory",
    value: "142",
    description: "Units ready / in recon",
    icon: <Car className="size-40" />,
    trend: "+5%",
    trendUp: true,
  },
  {
    label: "Total Quotes",
    value: "847",
    description: "Monthly quote volume",
    icon: <TrendingUp className="size-40" />,
    trend: "+12%",
    trendUp: true,
  },
  {
    label: "Potential Revenue",
    value: "$2.4M",
    description: "Pending funnel value",
    icon: <DollarSign className="size-40" />,
    trend: "+18%",
    trendUp: true,
  },
  {
    label: "Avg. Days on Lot",
    value: "14",
    description: "Turnover efficiency",
    icon: <Calendar className="size-40" />,
    trend: "-2 days",
    trendUp: true,
  },
]

const LOCATION_DATA = [
  { name: "LEHI", sales: 420 },
  { name: "OREM", sales: 380 },
]

const REVENUE_VIEWS = {
  "7D": [
    { name: "Mon", revenue: 15000 },
    { name: "Tue", revenue: 22000 },
    { name: "Wed", revenue: 18000 },
    { name: "Thu", revenue: 25000 },
    { name: "Fri", revenue: 32000 },
    { name: "Sat", revenue: 45000 },
    { name: "Sun", revenue: 38000 },
  ],
  "1M": [
    { name: "Week 1", revenue: 125000 },
    { name: "Week 2", revenue: 142000 },
    { name: "Week 3", revenue: 118000 },
    { name: "Week 4", revenue: 165000 },
  ],
  "1Y": [
    { name: "Jan", revenue: 450000 },
    { name: "Feb", revenue: 520000 },
    { name: "Mar", revenue: 480000 },
    { name: "Apr", revenue: 610000 },
    { name: "May", revenue: 590000 },
    { name: "Jun", revenue: 720000 },
    { name: "Jul", revenue: 680000 },
    { name: "Aug", revenue: 750000 },
    { name: "Sep", revenue: 710000 },
    { name: "Oct", revenue: 820000 },
    { name: "Nov", revenue: 890000 },
    { name: "Dec", revenue: 950000 },
  ]
}

const CONVERSION_DATA = [
  { name: "Booked", value: 65, fill: "var(--primary)" },
  { name: "Pending", value: 25, fill: "var(--muted)" },
  { name: "Missed", value: 10, fill: "var(--destructive)" },
]

interface TeamMember {
  name: string
  role: string
  calls: number
  convs: number
  appts: number
  shipments: number
  avatar: string
}

const LEADERBOARD_MONTHS: Record<string, TeamMember[]> = {
  "Mar": [
    { name: "Jaeden Wright", role: "Sales Executive", calls: 142, convs: 320, appts: 42, shipments: 12, avatar: "J" },
    { name: "Keaton Pierce", role: "Online Specialist", calls: 139, convs: 280, appts: 38, shipments: 8, avatar: "K" },
    { name: "Sarah Connor", role: "Floor Manager", calls: 125, convs: 240, appts: 35, shipments: 15, avatar: "S" },
    { name: "Marcus Wright", role: "Junior Rep", calls: 105, convs: 195, appts: 32, shipments: 7, avatar: "M" },
  ],
  "Feb": [
    { name: "Sarah Connor", role: "Floor Manager", calls: 135, convs: 260, appts: 40, shipments: 18, avatar: "S" },
    { name: "Jaeden Wright", role: "Sales Executive", calls: 130, convs: 300, appts: 38, shipments: 10, avatar: "J" },
    { name: "Keaton Pierce", role: "Online Specialist", calls: 125, convs: 250, appts: 34, shipments: 6, avatar: "K" },
    { name: "Marcus Wright", role: "Junior Rep", calls: 95, convs: 170, appts: 25, shipments: 4, avatar: "M" },
  ],
  "Jan": [
    { name: "Keaton Pierce", role: "Online Specialist", calls: 150, convs: 290, appts: 45, shipments: 12, avatar: "K" },
    { name: "Sarah Connor", role: "Floor Manager", calls: 120, convs: 230, appts: 30, shipments: 14, avatar: "S" },
    { name: "Jaeden Wright", role: "Sales Executive", calls: 115, convs: 280, appts: 35, shipments: 8, avatar: "J" },
    { name: "Marcus Wright", role: "Junior Rep", calls: 100, convs: 180, appts: 28, shipments: 5, avatar: "M" },
  ]
}

const MOCK_PAYMENT_DATA = [
  {
    customerName: "Robert Fox",
    amount: 1250.00,
    status: "succeeded",
    description: "Quote #AQ-8842",
    paidAt: "12 mins ago"
  },
  {
    customerName: "Jane Cooper",
    amount: 3400.50,
    status: "processing",
    description: "Shipment #SH-1029",
    paidAt: "45 mins ago"
  },
  {
    customerName: "Wade Warren",
    amount: 850.00,
    status: "succeeded",
    description: "Consultation Fee",
    paidAt: "1 hour ago"
  },
  {
    customerName: "Esther Howard",
    amount: 12000.00,
    status: "failed",
    description: "Down Payment - F-150",
    paidAt: "2 hours ago"
  },
]

const DRIVER_DATA = {
  active: 24,
  ready: 18,
  onBreak: 6
}

const SHIPMENT_STATUS_DATA = [
  { status: "Available", count: 12, color: "bg-emerald-500" },
  { status: "In Route", count: 45, color: "bg-primary" },
  { status: "Dispatched", count: 8, color: "bg-indigo-500" },
  { status: "Delivered", count: 124, color: "bg-emerald-600" },
  { status: "Cancelled", count: 3, color: "bg-destructive" },
]

const RECENT_UPDATES = [
  { vehicle: "2022 Ford F-150 Lariat", price: 54900, status: "Ready", time: "2h ago" },
  { vehicle: "2021 Toyota RAV4 Hybrid", price: 32500, status: "Inspection", time: "4h ago" },
  { vehicle: "2023 Tesla Model 3", price: 41000, status: "Photo", time: "5h ago" },
  { vehicle: "2020 Jeep Wrangler", price: 38900, status: "Wash", time: "1d ago" },
]

// ── Components ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [currentTime, setCurrentTime] = React.useState(new Date())
  const [revenuePeriod, setRevenuePeriod] = React.useState<keyof typeof REVENUE_VIEWS>("1Y")
  const [leaderboardMonth, setLeaderboardMonth] = React.useState<keyof typeof LEADERBOARD_MONTHS>("Mar")

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentLeaderboard = LEADERBOARD_MONTHS[leaderboardMonth]
  const currentRevenue = REVENUE_VIEWS[revenuePeriod]

  return (
    <div className="p-4 sm:p-8 space-y-8 container mx-auto min-h-screen ">
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
            {currentLeaderboard.map((rep) => (
              <Avatar key={rep.name} className="border-2 border-background lg:size-10 md:size-8 size-6 shadow-sm transition-transform hover:scale-110 cursor-pointer">
                <AvatarFallback className="text-xs bg-muted font-bold">{rep.avatar}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: KPI Hub - Premium Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_KPI_DATA.map((kpi) => (
          <Card key={kpi.label} className="p-0 border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden bg-card/80 backdrop-blur-sm border">
            <div className="absolute top-0 left-40 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <div >{kpi.icon}</div>
            </div>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{kpi.value}</h3>
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
              {(Object.keys(LEADERBOARD_MONTHS) as Array<keyof typeof LEADERBOARD_MONTHS>).reverse().map((month) => (
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
                {currentLeaderboard.map((rep, idx) => (
                  <TableRow key={rep.name} className="hover:bg-muted/20 border-border/50 transition-colors h-16">
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="size-9 border border-border">
                            <AvatarFallback className="font-bold text-xs bg-muted uppercase">{rep.avatar}</AvatarFallback>
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
                <p className="text-3xl font-black text-emerald-500 leading-none mb-2">{DRIVER_DATA.active}</p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-80">Active</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                <p className="text-3xl font-black text-primary leading-none mb-2">{DRIVER_DATA.ready}</p>
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
              {SHIPMENT_STATUS_DATA.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-2 rounded-full ${item.color}`} />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{item.status}</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{item.count}</span>
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
                {(Object.keys(REVENUE_VIEWS) as Array<keyof typeof REVENUE_VIEWS>).map((period) => (
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
                <p className="text-2xl font-black text-primary tracking-tighter leading-none">$3.52M</p>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">YTD Revenue</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRevenue} margin={{ top: 20, right: 0, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRevRestored" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
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
          <Table>
            <TableBody>
              {MOCK_PAYMENT_DATA.map((payment, i) => (
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
        </Card>
      </div>

      {/* Row 4: Inventory & Location Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">

        {/* Inventory Stream */}
        <Card className="lg:col-span-7 border-border/50 bg-card overflow-hidden shadow-sm gap-0 p-0">
          <CardHeader className="py-5 px-8 border-b border-border/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Live Inventory Stream
            </CardTitle>
            <Link href="/inventory" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 group">
              View All <ChevronRight className="size-3 group-hover:translate-x-1" />
            </Link>
          </CardHeader>
          <Table>
            <TableBody>
              {RECENT_UPDATES.map((update, i) => (
                <TableRow key={i} className="hover:bg-muted/20 border-border/50 transition-colors h-16">
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{update.vehicle}</span>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mt-1">{update.time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-sm">{formatCurrency(update.price)}</TableCell>
                  <TableCell className="text-right px-8">
                    <Badge variant="secondary" className={`text-[9px] font-black uppercase px-2 py-0.5 border-none ${update.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                      {update.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Location Summary Card */}
        <Card className="lg:col-span-5 border-border/50 bg-card shadow-sm flex flex-col gap-0 p-0">
          <CardHeader className="py-5 px-6 border-b border-border/10">
            <CardTitle className="text-sm font-bold">Location Summary</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">Inventory & Sales</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center gap-8">
            {LOCATION_DATA.map((loc, idx) => (
              <div key={loc.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-xl font-black tracking-tighter">{loc.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Retail Hub</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary tracking-tighter">{loc.sales}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units Sold</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: idx === 0 ? '82%' : '74%' }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Select({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
  return <div className="flex items-center">{children}</div>
}
