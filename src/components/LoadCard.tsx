"use client"

import * as React from "react"
import {
  MapPin, ArrowRight, Truck, DollarSign,
  Calendar, Globe, Lock, ClipboardList, Car, Trash2, Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Load } from "@/types/load"

interface LoadCardProps {
  load: Load
  onDelete?: (loadId: string) => void
  isDeleting?: boolean
}

function formatCurrency(n?: number) {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Posted":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800"
    case "Assigned":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
    case "In-Transit":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
    case "Delivered":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
    case "Cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function vehicleSummary(vehicles: Load["vehicles"] | undefined) {
  if (!vehicles?.length) return "No vehicles"
  const types = [...new Set(vehicles.map((v) => v.trailerType).filter(Boolean))]
  const makes = [...new Set(vehicles.map((v) => v.make).filter(Boolean))].slice(0, 2)
  const typeStr = types.length ? types.join(" / ") : "—"
  const makeStr = makes.join(", ") + (vehicles.length > 2 ? ` +${vehicles.length - 2}` : "")
  return makeStr || typeStr
}

export function LoadCard({ load, onDelete, isDeleting }: LoadCardProps) {
  const pickup   = load.pickupLocation
  const delivery = load.deliveryLocation
  const vehicles = load.vehicles ?? []
  const vCount   = vehicles.length
  const isPublic = load.additionalInfo?.visibility !== "private"
  const isLoadBoard = load.postType === "load-board"

  return (
    <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Top accent bar */}
        <div className={`h-1 w-full ${load.status === "Posted" ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-gray-400 to-gray-500"}`} />

        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
                {load.loadNumber}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(load.status)}`}>
                {load.status}
              </span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                isLoadBoard
                  ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                  : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
              }`}>
                <ClipboardList className="size-2.5" />
                {isLoadBoard ? "Load Board" : "Assigned"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {isPublic
                  ? <Globe className="size-3.5 text-muted-foreground" />
                  : <Lock  className="size-3.5 text-muted-foreground" />
                }
                <span className="text-[10px] text-muted-foreground">{isPublic ? "Public" : "Private"}</span>
                <span className="text-[10px] text-muted-foreground ml-1">· {formatDate(load.createdAt)}</span>
              </div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => onDelete(load._id)}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Trash2 className="size-3.5" />
                  }
                </Button>
              )}
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="bg-muted/50 rounded-lg p-3 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="size-3.5 text-green-500 shrink-0" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pickup</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {pickup.city}{pickup.city && pickup.state ? ", " : ""}{pickup.state}
              </p>
              {pickup.zip && (
                <p className="text-[10px] text-muted-foreground">{pickup.zip}</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <ArrowRight className="size-4 text-muted-foreground" />
              {load.pricing?.miles != null && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {Math.round(load.pricing.miles)} mi
                </span>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="size-3.5 text-blue-500 shrink-0" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Delivery</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {delivery.city}{delivery.city && delivery.state ? ", " : ""}{delivery.state}
              </p>
              {delivery.zip && (
                <p className="text-[10px] text-muted-foreground">{delivery.zip}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Vehicles */}
            <div className="flex flex-col gap-0.5 bg-muted/30 rounded-md p-2.5">
              <div className="flex items-center gap-1">
                <Car className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Vehicles</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{vCount} unit{vCount !== 1 ? "s" : ""}</p>
              <p className="text-[10px] text-muted-foreground truncate">{vehicleSummary(vehicles)}</p>
            </div>

            {/* Rate */}
            <div className="flex flex-col gap-0.5 bg-muted/30 rounded-md p-2.5">
              <div className="flex items-center gap-1">
                <DollarSign className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Est. Rate</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{formatCurrency(load.pricing?.estimatedRate)}</p>
              {load.pricing?.carrierPayAmount != null && (
                <p className="text-[10px] text-muted-foreground">Pay: {formatCurrency(load.pricing.carrierPayAmount)}</p>
              )}
            </div>

            {/* Available */}
            <div className="flex flex-col gap-0.5 bg-muted/30 rounded-md p-2.5">
              <div className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Available</span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {load.dates?.firstAvailable ? formatDate(load.dates.firstAvailable) : "ASAP"}
              </p>
              {load.dates?.pickupDeadline && (
                <p className="text-[10px] text-muted-foreground">Due {formatDate(load.dates.pickupDeadline)}</p>
              )}
            </div>
          </div>

          {/* Vehicle trailer types strip */}
          {vehicles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[...new Set(vehicles.map((v) => v.trailerType).filter(Boolean))].map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  <Truck className="size-2.5" />
                  {t}
                </span>
              ))}
              {vehicles.some((v) => v.condition === "Inoperable") && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  Inoperable
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
