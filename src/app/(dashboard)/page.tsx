"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Loader2,
  AlertCircle
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DashboardData, DashboardResponse, RecentActivity } from "@/types/dashboard"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/utils/format"

import { useAuth } from "@clerk/nextjs"

export default function Dashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { getToken } = useAuth()

  React.useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await apiClient.get<DashboardResponse>('/api/dashboard/metrics', { headers })
      setData(response.data.data)
    } catch (err: any) {
      console.error('[Dashboard] Error fetching metrics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="size-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-destructive">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time business performance and inventory analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-card shadow-sm py-1.5 px-3 border-border">
            <Clock className="size-3.5 mr-2 text-primary" />
            Last updated: {data ? new Date().toLocaleTimeString() : '...'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={isLoading ? '...' : data?.inventory.totalActive.toString() || '0'}
          label="Active Inventory"
          description="Units ready for sale / in recon"
          icon={<Car className="size-5 text-blue-600 dark:text-blue-400" />}
          loading={isLoading}
        />
        <MetricCard
          title={isLoading ? '...' : data?.quotes.total.toString() || '0'}
          label="Total Quotes"
          description="Quotes generated this period"
          icon={<TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />}
          loading={isLoading}
        />
        <MetricCard
          title={isLoading ? '...' : formatCurrency(data?.quotes.potentialRevenue || 0)}
          label="Potential Revenue"
          description="Estimated value of pending quotes"
          icon={<DollarSign className="size-5 text-indigo-600 dark:text-indigo-400" />}
          loading={isLoading}
        />
        <MetricCard
          title={isLoading ? '...' : `${data?.inventory.aging.averageDaysOnLot || 0} Days`}
          label="Avg. Days on Lot"
          description="Time from acquisition to ready"
          icon={<Calendar className="size-5 text-amber-600 dark:text-amber-400" />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Funnel */}
        <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Quote Performance</CardTitle>
                <CardDescription>Conversion and funnel tracking</CardDescription>
              </div>
              <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                {data?.quotes.conversionRate}% Conversion
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatItem label="Pending" value={data?.quotes.pending || 0} color="text-amber-600 dark:text-amber-400" />
                  <StatItem label="Accepted" value={data?.quotes.accepted || 0} color="text-emerald-600 dark:text-emerald-400" />
                  <StatItem label="Booked" value={data?.quotes.booked || 0} color="text-blue-600 dark:text-blue-400" />
                  <StatItem label="Rejected" value={data?.quotes.rejected || 0} color="text-rose-600 dark:text-rose-400" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-foreground">
                    <span>Booking Progress</span>
                    <span>{((data?.quotes.booked || 0) / (data?.quotes.total || 1) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(data?.quotes.booked || 0) / (data?.quotes.total || 1) * 100} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recon Pipeline */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border pb-4">
            <CardTitle className="text-lg">Recon Pipeline</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(data?.inventory.reconPipeline || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                      <span className="text-sm font-medium text-foreground">{status}</span>
                    </div>
                    <Badge variant="secondary" className="group-hover:bg-muted transition-colors">
                      {count} Units
                    </Badge>
                  </div>
                ))}
                {(!data || Object.keys(data.inventory.reconPipeline).length === 0) && (
                  <p className="text-sm text-center text-muted-foreground py-8">No units in recon</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Inventory Updates</CardTitle>
            <button className="text-xs font-semibold text-primary hover:underline flex items-center">
              View All Inventory <ChevronRight className="size-3 ml-1" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-semibold text-foreground">Vehicle</TableHead>
                <TableHead className="font-semibold text-foreground">Price</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : data?.recentActivity.length ? (
                data.recentActivity.map((activity, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors cursor-default group border-border">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground">{activity.year} {activity.make} {activity.modelName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-foreground">{formatCurrency(activity.price)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(activity.status)}
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(activity.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No recent activity found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  label,
  description,
  icon,
  loading
}: {
  title: string,
  label: string,
  description: string,
  icon: React.ReactNode,
  loading: boolean
}) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors border border-transparent group-hover:border-border">
            {icon}
          </div>
          {loading && <Loader2 className="size-4 text-muted-foreground animate-spin" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground group-hover:text-muted-foreground/80 transition-colors uppercase font-semibold tracking-wider">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-muted/50 p-3 rounded-lg border border-border">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function getStatusColor(status: string) {
  const s = status.toLowerCase()
  if (s.includes('ready')) return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  if (s.includes('recon') || s.includes('in-route')) return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  if (s.includes('dispatched')) return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  return 'bg-muted text-foreground border-border'
}