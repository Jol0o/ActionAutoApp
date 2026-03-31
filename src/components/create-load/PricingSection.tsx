"use client"

import * as React from "react"
import { DollarSign, Route, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Field } from "./FormField"
import { LoadVehicle } from "./types"
import { calculateLoadRate } from "@/lib/api/loads"

interface PricingSectionProps {
  pickupZip: string
  deliveryZip: string
  vehicles: LoadVehicle[]
}

export function PricingSection({ pickupZip, deliveryZip, vehicles }: PricingSectionProps) {
  const [result, setResult] = React.useState<{
    miles: number
    estimatedRate: number
    eta: { min: number; max: number }
  } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const vehicleKey = vehicles.map((v) => `${v.trailerType}:${v.condition}`).join(",")

  React.useEffect(() => {
    if (pickupZip.length < 5 || deliveryZip.length < 5) {
      setResult(null)
      setError(null)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      setLoading(true)
      setError(null)
      calculateLoadRate(
        pickupZip,
        deliveryZip,
        vehicles.map((v) => ({ trailerType: v.trailerType, condition: v.condition }))
      )
        .then((data) => { if (!cancelled) { setResult(data); setLoading(false) } })
        .catch(() => { if (!cancelled) { setError("Could not calculate rate for these ZIPs"); setLoading(false) } })
    }, 600)

    return () => { cancelled = true; clearTimeout(timeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupZip, deliveryZip, vehicleKey])

  if (pickupZip.length < 5 || deliveryZip.length < 5) {
    return (
      <div className="flex items-center gap-2 py-2 text-[11px] text-muted-foreground">
        <Route className="size-3.5 shrink-0" />
        Enter pickup and delivery ZIP to see estimated price
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-[11px] text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin shrink-0" />
        Calculating rate…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-2 text-[11px] text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        {error}
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Distance" icon={Route}>
          <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/50 text-sm font-mono">
            {result.miles.toLocaleString()} mi
          </div>
        </Field>
        <Field label="Estimated Rate" icon={DollarSign}>
          <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/50 text-sm font-mono font-semibold text-green-600 dark:text-green-400">
            ${result.estimatedRate.toLocaleString()}
          </div>
        </Field>
      </div>

      <Field label="ETA">
        <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/50 text-sm">
          {result.eta.min}–{result.eta.max} business days
        </div>
      </Field>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <CheckCircle2 className="size-3 text-green-500 shrink-0" />
        Rate calculated via SupraPay — $1.50/mi base, min $300
      </div>
    </div>
  )
}
