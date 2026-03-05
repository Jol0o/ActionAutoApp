"use client"

import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Payment } from "@/types/billing"

interface Shipment {
  _id: string
  status: string
  assignedDriverId?: unknown
}

interface Props {
  shipments: Shipment[]       // month-filtered, for the donut
  rawPayments: Payment[]      // all payments (unfiltered), for the revenue trend
  monthLabel: string
}

// ── Data builders ─────────────────────────────────────────────────────────────

function buildDeliveryData(shipments: Shipment[]) {
  const counts: Record<string, number> = {}
  shipments.forEach(s => {
    counts[s.status] = (counts[s.status] || 0) + 1
  })
  return Object.entries(counts).map(([status, value]) => ({ name: status, value }))
}

const STATUS_FILL: Record<string, string> = {
  "Delivered":              "var(--chart-1)",
  "In-Route":               "var(--chart-2)",
  "Dispatched":             "var(--chart-3)",
  "Cancelled":              "var(--chart-5)",
  "Available for Pickup":   "var(--chart-4)",
}

function buildRevenueData(rawPayments: Payment[]) {
  const now = new Date()
  const months: { key: string; label: string }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    months.push({ key, label })
  }

  return months.map(({ key, label }) => {
    const revenue = rawPayments
      .filter(p => p.status === "succeeded" && p.createdAt?.startsWith(key))
      .reduce((sum, p) => sum + p.amount, 0)
    return { month: label, revenue }
  })
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

function DeliveryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} shipment{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportsAnalytics({ shipments, rawPayments, monthLabel }: Props) {
  const deliveryData = React.useMemo(() => buildDeliveryData(shipments), [shipments])
  const revenueData = React.useMemo(() => buildRevenueData(rawPayments), [rawPayments])

  const totalShipments = shipments.length
  const delivered = shipments.filter(s => s.status === "Delivered").length
  const successRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">

      {/* Delivery Success Rate — Donut */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold">Delivery Success Rate</CardTitle>
          <CardDescription className="text-xs">{monthLabel} — shipments by status</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6 pt-2">
          {totalShipments === 0 ? (
            <p className="text-sm text-muted-foreground py-8 w-full text-center">No shipment data for this period.</p>
          ) : (
            <>
              {/* Donut */}
              <div className="relative shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Tooltip content={<DeliveryTooltip />} />
                    <Pie
                      data={deliveryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {deliveryData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_FILL[entry.name] ?? "var(--chart-3)"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-foreground leading-none">{successRate}%</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">delivered</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {deliveryData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_FILL[entry.name] ?? "var(--chart-3)" }}
                      />
                      <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground shrink-0">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Revenue — Bar */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
          <CardDescription className="text-xs">Last 6 months — succeeded payments</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={42}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
              <Bar
                dataKey="revenue"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}
