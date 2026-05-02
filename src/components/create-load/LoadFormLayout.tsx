"use client"

import * as React from "react"
import { MapPin, Car, Calendar, DollarSign, Truck, AlertCircle, FileText, ScrollText, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SectionCard } from "./SectionCard"
import { LocationFields } from "./LocationFields"
import { VehicleSection } from "./VehicleSection"
import { DatesSection } from "./DatesSection"
import { PricingSection } from "./PricingSection"
import { AdditionalInfoSection } from "./AdditionalInfoSection"
import { ContractSection } from "./ContractSection"
import { DriverPickerSection } from "./DriverPickerSection"
import { LocationBlock, LoadVehicle, LoadDates, LoadAdditionalInfo, LoadContract, MAX_VEHICLES } from "./types"
import { createLoadFormSchema } from "./validation"
import { TRAILER_OPTIONS } from "./trailer-capacity"
import { createLoad, assignDriverToLoad } from "@/lib/api/loads"
import { z } from "zod"

export interface LoadFormProps {
  postType: "load-board" | "assign-carrier"
  pickup: LocationBlock
  setPickup: (v: LocationBlock) => void
  delivery: LocationBlock
  setDelivery: (v: LocationBlock) => void
  vehicles: LoadVehicle[]
  setVehicles: (v: LoadVehicle[]) => void
  dates: LoadDates
  setDates: (v: LoadDates) => void
  additionalInfo: LoadAdditionalInfo
  setAdditionalInfo: (v: LoadAdditionalInfo) => void

  contract: LoadContract
  setContract: (v: LoadContract) => void
  trailerType: string
  setTrailerType: (v: string) => void
  onCancel: () => void
  onSuccess: (loadId: string, loadNumber: string) => void
  submitLabel: string
}

export function LoadFormLayout({
  postType,
  pickup,
  setPickup,
  delivery,
  setDelivery,
  vehicles,
  setVehicles,
  dates,
  setDates,
  additionalInfo,
  setAdditionalInfo,
  contract,
  setContract,
  trailerType,
  setTrailerType,
  onCancel,
  onSuccess,
  submitLabel,
}: LoadFormProps) {
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [zodIssues, setZodIssues] = React.useState<z.ZodIssue[]>([])
  const [selectedDriverId, setSelectedDriverId] = React.useState<string | null>(null)

  const isAssignCarrier = postType === "assign-carrier"

  const handleSubmit = async () => {
    const result = createLoadFormSchema.safeParse({ pickup, delivery, vehicles, dates, additionalInfo, contract, trailerType })
    
    if (!result.success) {
      setZodIssues(result.error.issues)
      const flatErrors = result.error.issues.map(i => {
        const prefix = i.path[0] === "pickup" ? "Pickup: " : i.path[0] === "delivery" ? "Delivery: " : ""
        return `${prefix}${i.message}`
      })
      setErrors(flatErrors)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (isAssignCarrier && !selectedDriverId) {
      setErrors(["Please select a driver to assign"])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setErrors([])
    setZodIssues([])
    setSubmitting(true)
    try {
      const { load, warning } = await createLoad({ postType, pickup, delivery, vehicles, dates, additionalInfo, contract, trailerType })
      if (warning) {
        toast.warning(warning)
      }
      if (isAssignCarrier && selectedDriverId) {
        await assignDriverToLoad(load._id, selectedDriverId)
      }
      onSuccess(load._id, load.loadNumber)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create load. Please try again."
      setErrors([msg])
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Validation errors ────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3.5 space-y-1.5">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertCircle className="size-3.5 shrink-0" />
            Please fix the following before submitting:
          </p>
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive pl-5">• {e}</p>
          ))}
        </div>
      )}

      {/* ── Global Equipment ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <Truck className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Equipment Type</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Select the trailer for this load</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <select
              value={trailerType}
              onChange={(e) => setTrailerType(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer font-medium"
            >
              {TRAILER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Route (Pickup → Delivery) side by side on lg ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionCard
          step={1}
          icon={MapPin}
          title="Pick-Up Location"
          description="Origin address, contact, and access details"
          comingSoon={false}
        >
          <LocationFields value={pickup} onChange={setPickup} />
        </SectionCard>

        <SectionCard
          step={2}
          icon={MapPin}
          title="Delivery Location"
          description="Destination address, contact, and access details"
          comingSoon={false}
        >
          <LocationFields value={delivery} onChange={setDelivery} />
        </SectionCard>
      </div>

      {/* ── Vehicles ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <SectionCard
          step={3}
          icon={Car}
          title="Vehicle Information"
          description={`Up to ${MAX_VEHICLES} vehicles — trailer type, make, model, year, VIN, condition`}
          comingSoon={false}
        >
          <VehicleSection 
            vehicles={vehicles} 
            onChange={setVehicles} 
            trailerType={trailerType}
            errors={zodIssues}
          />
        </SectionCard>
      </div>

      {/* ── Dates + Pricing side by side on lg ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionCard
          step={4}
          icon={Calendar}
          title="Dates & Deadlines"
          description="First available, pickup deadline, delivery deadline"
          comingSoon={false}
        >
          <DatesSection 
            value={dates} 
            onChange={setDates} 
            errors={zodIssues.filter(i => i.path[0] === "dates").reduce((acc, curr) => ({ ...acc, [curr.path[1]]: curr.message }), {})}
          />
        </SectionCard>

        <SectionCard
          step={5}
          icon={DollarSign}
          title="Pricing"
          description="Auto-calculated rate based on distance and vehicle details"
          comingSoon={false}
          badge={pickup.zip.length >= 5 && delivery.zip.length >= 5 ? "Live" : undefined}
          badgeVariant="success"
        >
          <PricingSection
            pickupZip={pickup.zip}
            deliveryZip={delivery.zip}
            vehicles={vehicles}
            trailerType={trailerType}
          />
        </SectionCard>
      </div>

      {/* ── Additional Info ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <SectionCard
          step={6}
          icon={FileText}
          title="Additional Info"
          description="Load notes, carrier instructions, and load board visibility"
          comingSoon={false}
        >
          <AdditionalInfoSection value={additionalInfo} onChange={setAdditionalInfo} />
        </SectionCard>
      </div>

      {/* ── Driver Picker (assign-carrier only) ──────────────────────────── */}
      {isAssignCarrier && (
        <div className="mb-4">
          <SectionCard
            step={7}
            icon={UserCheck}
            title="Assign Driver"
            description="Select an online driver to assign this load to immediately"
            comingSoon={false}
          >
            <DriverPickerSection
              selectedDriverId={selectedDriverId}
              onSelect={setSelectedDriverId}
            />
          </SectionCard>
        </div>
      )}

      {/* ── Contract ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <SectionCard
          step={isAssignCarrier ? 8 : 7}
          icon={ScrollText}
          title="Terms & Contract"
          description="Review terms, agree, and sign digitally before posting"
          comingSoon={false}
        >
          <ContractSection value={contract} onChange={setContract} />
        </SectionCard>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pb-8">
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-xs h-9 px-5 border-border"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto gap-2 bg-green-500 hover:bg-green-600 text-white text-xs h-9 px-6 disabled:opacity-75"
        >
          {submitting ? (
            <>
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Truck className="size-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
