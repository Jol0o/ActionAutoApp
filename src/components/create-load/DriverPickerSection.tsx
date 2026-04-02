"use client"

import * as React from "react"
import { useAuth } from "@/providers/AuthProvider"
import { apiClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, CheckCircle2, Truck, AlertCircle, RefreshCw } from "lucide-react"

interface ActiveDriver {
  id: string
  status: "on-route" | "idle" | "on-break" | "waiting" | "offline"
  lastSeenAt: string
  driver: { id: string; name?: string; email: string; avatar?: string }
  equipment: {
    trailerType?: string
    maxVehicleCapacity?: number
    truckMake?: string
    truckModel?: string
    operationalStatus?: string
  } | null
  shipments: { id: string; status: string; owned: boolean }[]
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  "on-route":  { label: "On Route",  color: "bg-emerald-500" },
  idle:        { label: "Available", color: "bg-blue-500" },
  "on-break":  { label: "On Break",  color: "bg-amber-500" },
  waiting:     { label: "Waiting",   color: "bg-sky-500" },
  offline:     { label: "Offline",   color: "bg-gray-400" },
}

const TRAILER_LABELS: Record<string, string> = {
  open_3car_wedge: "Open 3-Car Wedge", open_2car: "Open 2-Car",
  "5car_open": "5-Car Open", "9car_stinger": "9-Car Stinger",
  "7car_stinger": "7-Car Stinger", enclosed_2car: "Enclosed 2-Car",
  enclosed_3car: "Enclosed 3-Car", flatbed: "Flatbed",
  dually_flatbed: "Dually Flatbed", hotshot: "Hotshot",
  gooseneck: "Gooseneck", lowboy: "Lowboy", step_deck: "Step Deck",
  rgn: "RGN", double_drop: "Double Drop", power_only: "Power Only",
  other: "Other",
}

function initials(name?: string, email?: string) {
  if (name) return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  return (email?.[0] ?? "?").toUpperCase()
}

interface Props {
  selectedDriverId: string | null
  onSelect: (driverId: string | null) => void
}

export function DriverPickerSection({ selectedDriverId, onSelect }: Props) {
  const { getToken } = useAuth()
  const [drivers, setDrivers] = React.useState<ActiveDriver[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const fetchDrivers = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await apiClient.get<{ data: ActiveDriver[] }>("/api/driver-tracking/active", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDrivers(res.data.data || [])
    } catch {
      setError("Could not load drivers")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  React.useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return drivers
    return drivers.filter((d) =>
      d.driver.name?.toLowerCase().includes(q) ||
      d.driver.email.toLowerCase().includes(q) ||
      d.equipment?.truckMake?.toLowerCase().includes(q) ||
      d.equipment?.truckModel?.toLowerCase().includes(q)
    )
  }, [drivers, search])

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        {error}
        <button onClick={fetchDrivers} className="ml-auto flex items-center gap-1 text-[10px] hover:underline">
          <RefreshCw className="size-3" />Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search drivers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          <Truck className="size-7 mb-2 opacity-30" />
          <p className="text-xs font-medium">
            {drivers.length === 0 ? "No drivers online" : "No drivers match your search"}
          </p>
          <p className="text-[10px] mt-0.5 opacity-70">
            {drivers.length === 0
              ? "Drivers need to share their location to appear here."
              : "Try a different name or email."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
          {filtered.map((d) => {
            const isSelected = selectedDriverId === d.driver.id
            const meta = STATUS_META[d.status] ?? STATUS_META.offline
            const activeCount = d.shipments.filter((s) => s.owned && s.status !== "Delivered").length
            const trailerLabel = d.equipment?.trailerType ? (TRAILER_LABELS[d.equipment.trailerType] ?? d.equipment.trailerType) : null

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : d.driver.id)}
                className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all hover:shadow-sm ${
                  isSelected
                    ? "border-green-500 bg-green-50/60 dark:bg-green-950/20"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                {/* Avatar */}
                <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                  {initials(d.driver.name, d.driver.email)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold truncate">{d.driver.name || d.driver.email}</span>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block size-1.5 rounded-full ${meta.color}`} />
                      <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {trailerLabel && (
                      <span className="text-[10px] text-muted-foreground">{trailerLabel}</span>
                    )}
                    {d.equipment?.truckMake && (
                      <span className="text-[10px] text-muted-foreground">
                        · {d.equipment.truckMake} {d.equipment.truckModel || ""}
                      </span>
                    )}
                    {activeCount > 0 && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-200">
                        {activeCount} active load{activeCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Check */}
                {isSelected && (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedDriverId && (
        <p className="text-[10px] text-muted-foreground text-center">
          Driver will be notified and load status set to <span className="font-semibold text-foreground">Assigned</span> immediately.
        </p>
      )}
    </div>
  )
}
