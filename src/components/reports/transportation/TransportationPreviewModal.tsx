"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileText, TrendingUp, Clock, CheckCircle2, Package, MapPin, Truck, DollarSign } from "lucide-react"
import { Shipment, Quote } from "@/types/transportation"
import {
  buildShipmentSummary,
  buildQuoteSummary,
  fmtCurrency,
  fmtNumber,
  shipmentCustomer,
  shipmentVehicle,
  shipmentVin,
  shipmentRate,
  shipmentTransportType,
  driverName,
  quoteCustomer,
  quoteVehicle,
  quoteFromAddr,
  quoteToAddr,
  quoteEta,
  quoteTransportType,
} from "./helpers"

interface TransportationPreviewModalProps {
  open: boolean
  onClose: () => void
  reportType: "shipment" | "quote"
  shipments: Shipment[]
  quotes: Quote[]
  monthLabel: string
  isDownloading: boolean
  onDownload: () => void
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === "delivered") return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  if (s === "in-route" || s === "dispatched") return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
  if (s === "available for pickup") return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
  if (s === "cancelled") return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
  return "bg-muted text-muted-foreground border-border"
}

function quoteStatusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === "booked") return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  if (s === "accepted") return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
  if (s === "pending") return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
  if (s === "rejected") return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
  return "bg-muted text-muted-foreground border-border"
}

function StatCard({ label, value, accent, icon }: { label: string; value: string | number; accent: string; icon: React.ReactNode }) {
  return (
    <div className={`flex-1 min-w-[110px] rounded-lg border bg-card px-4 py-3 ${accent}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-xl font-bold text-foreground leading-none">{value}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function ShipmentPreview({ shipments }: { shipments: Shipment[] }) {
  const summary = buildShipmentSummary(shipments)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2.5">
        <StatCard label="Total Shipments" value={summary.total} accent="border-border" icon={<Package className="size-3.5" />} />
        <StatCard label="Delivered" value={summary.delivered} accent="border-l-2 border-l-emerald-500 border-t-border border-r-border border-b-border" icon={<CheckCircle2 className="size-3.5 text-emerald-500" />} />
        <StatCard label="In Transit" value={summary.inRoute + summary.dispatched} accent="border-l-2 border-l-blue-500 border-t-border border-r-border border-b-border" icon={<Truck className="size-3.5 text-blue-500" />} />
        <StatCard label="Available" value={summary.available} accent="border-l-2 border-l-amber-500 border-t-border border-r-border border-b-border" icon={<Clock className="size-3.5 text-amber-500" />} />
        <StatCard label="Revenue" value={fmtCurrency(summary.totalRate)} accent="border-l-2 border-l-violet-500 border-t-border border-r-border border-b-border" icon={<DollarSign className="size-3.5 text-violet-500" />} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Cancelled</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{summary.cancelled}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Avg Rate</p>
          <p className="text-sm font-bold text-foreground">{fmtCurrency(summary.avgRate)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Total Miles</p>
          <p className="text-sm font-bold text-foreground">{fmtNumber(summary.totalMiles)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Avg Delivery</p>
          <p className="text-sm font-bold text-foreground">{summary.avgDeliveryDays > 0 ? `${summary.avgDeliveryDays.toFixed(1)}d` : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Success Rate</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{summary.onTimeRate}%</p>
        </div>
      </div>

      <div>
        <SectionLabel>Shipment Details</SectionLabel>
        {shipments.length === 0 ? (
          <div className="rounded-lg border border-border py-10 text-center text-sm text-muted-foreground">No shipments this period.</div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="text-xs font-semibold w-[100px]">Tracking #</TableHead>
                      <TableHead className="text-xs font-semibold w-[90px]">Status</TableHead>
                      <TableHead className="text-xs font-semibold w-[110px]">Customer</TableHead>
                      <TableHead className="text-xs font-semibold w-[120px]">Vehicle</TableHead>
                      <TableHead className="text-xs font-semibold w-[120px]">VIN</TableHead>
                      <TableHead className="text-xs font-semibold w-[90px]">Origin</TableHead>
                      <TableHead className="text-xs font-semibold w-[90px]">Destination</TableHead>
                      <TableHead className="text-xs font-semibold w-[70px]">Type</TableHead>
                      <TableHead className="text-xs font-semibold w-[80px]">Rate</TableHead>
                      <TableHead className="text-xs font-semibold w-[100px]">Driver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map(s => (
                      <TableRow key={s._id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-mono text-[11px] text-foreground">{s.trackingNumber || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] font-medium ${statusBadgeClass(s.status)}`}>{s.status}</Badge></TableCell>
                        <TableCell className="font-medium text-foreground">{shipmentCustomer(s)}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{shipmentVehicle(s)}</TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{shipmentVin(s)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.origin || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{s.destination || "—"}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{shipmentTransportType(s)}</Badge></TableCell>
                        <TableCell className="font-semibold text-foreground">{fmtCurrency(shipmentRate(s))}</TableCell>
                        <TableCell className="text-muted-foreground">{driverName(s)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuotePreview({ quotes }: { quotes: Quote[] }) {
  const summary = buildQuoteSummary(quotes)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2.5">
        <StatCard label="Total Quotes" value={summary.total} accent="border-border" icon={<FileText className="size-3.5" />} />
        <StatCard label="Booked" value={summary.booked} accent="border-l-2 border-l-emerald-500 border-t-border border-r-border border-b-border" icon={<CheckCircle2 className="size-3.5 text-emerald-500" />} />
        <StatCard label="Pending" value={summary.pending} accent="border-l-2 border-l-amber-500 border-t-border border-r-border border-b-border" icon={<Clock className="size-3.5 text-amber-500" />} />
        <StatCard label="Conversion" value={`${summary.conversionRate}%`} accent="border-l-2 border-l-blue-500 border-t-border border-r-border border-b-border" icon={<TrendingUp className="size-3.5 text-blue-500" />} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Avg Rate</p>
          <p className="text-sm font-bold text-foreground">{fmtCurrency(summary.avgRate)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Total Value</p>
          <p className="text-sm font-bold text-foreground">{fmtCurrency(summary.totalRate)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Total Miles</p>
          <p className="text-sm font-bold text-foreground">{fmtNumber(summary.totalMiles)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Enclosed</p>
          <p className="text-sm font-bold text-foreground">{summary.enclosedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Inoperable</p>
          <p className="text-sm font-bold text-foreground">{summary.inoperableCount}</p>
        </div>
      </div>

      <div>
        <SectionLabel>Quote Details</SectionLabel>
        {quotes.length === 0 ? (
          <div className="rounded-lg border border-border py-10 text-center text-sm text-muted-foreground">No quotes this period.</div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="text-xs font-semibold w-[110px]">Customer</TableHead>
                      <TableHead className="text-xs font-semibold w-[120px]">Vehicle</TableHead>
                      <TableHead className="text-xs font-semibold w-[100px]">From</TableHead>
                      <TableHead className="text-xs font-semibold w-[100px]">To</TableHead>
                      <TableHead className="text-xs font-semibold w-[70px]">Miles</TableHead>
                      <TableHead className="text-xs font-semibold w-[80px]">Rate</TableHead>
                      <TableHead className="text-xs font-semibold w-[60px]">ETA</TableHead>
                      <TableHead className="text-xs font-semibold w-[70px]">Type</TableHead>
                      <TableHead className="text-xs font-semibold w-[50px]">Units</TableHead>
                      <TableHead className="text-xs font-semibold w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map(q => (
                      <TableRow key={q._id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{quoteCustomer(q)}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{quoteVehicle(q)}</TableCell>
                        <TableCell className="text-muted-foreground">{quoteFromAddr(q)}</TableCell>
                        <TableCell className="text-muted-foreground">{quoteToAddr(q)}</TableCell>
                        <TableCell className="text-muted-foreground">{fmtNumber(q.miles || 0)}</TableCell>
                        <TableCell className="font-semibold text-foreground">{fmtCurrency(q.rate || 0)}</TableCell>
                        <TableCell className="text-muted-foreground">{quoteEta(q)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{quoteTransportType(q)}</Badge></TableCell>
                        <TableCell className="text-center text-muted-foreground">{q.units || 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-medium capitalize ${quoteStatusBadgeClass(q.status)}`}>{q.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TransportationPreviewModal({
  open,
  onClose,
  reportType,
  shipments,
  quotes,
  monthLabel,
  isDownloading,
  onDownload,
}: TransportationPreviewModalProps) {
  const isShipment = reportType === "shipment"
  const title = isShipment ? "Shipment Report" : "Quotes & Drafts Report"
  const accentColor = isShipment ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="max-w-7xl w-full p-0 gap-0 overflow-hidden max-h-[95vh] flex flex-col">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className={`size-10 rounded-lg flex items-center justify-center border ${isShipment
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800"
              }`}>
              {isShipment
                ? <Truck className={`size-4.5 ${accentColor}`} />
                : <MapPin className={`size-4.5 ${accentColor}`} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {monthLabel}
                <span className="mx-1.5 opacity-40">·</span>
                Preview before download
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 text-xs font-medium shrink-0 mt-0.5" onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download PDF
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          {isShipment
            ? <ShipmentPreview shipments={shipments} />
            : <QuotePreview quotes={quotes} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
