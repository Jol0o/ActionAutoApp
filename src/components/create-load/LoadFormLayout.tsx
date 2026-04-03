"use client"

import * as React from "react"
import { MapPin, Car, Calendar, DollarSign, Truck, AlertCircle, FileText, ScrollText, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionCard } from "./SectionCard"
import { LocationFields } from "./LocationFields"
import { VehicleSection } from "./VehicleSection"
import { DatesSection } from "./DatesSection"
import { PricingSection } from "./PricingSection"
import { AdditionalInfoSection } from "./AdditionalInfoSection"
import { ContractSection } from "./ContractSection"
import { DriverPickerSection } from "./DriverPickerSection"
import { LocationBlock, LoadVehicle, LoadDates, LoadAdditionalInfo, LoadContract, MAX_VEHICLES } from "./types"
import { validateLoadForm } from "./validation"
import { createLoad, assignDriverToLoad } from "@/lib/api/loads"

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
  onCancel,
  onSuccess,
  submitLabel,
}: LoadFormProps) {
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [selectedDriverId, setSelectedDriverId] = React.useState<string | null>(null)

  const isAssignCarrier = postType === "assign-carrier"

  const handleSubmit = async () => {
    const validationErrors = validateLoadForm(postType, pickup, delivery, vehicles, dates, additionalInfo, contract, selectedDriverId)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setSubmitting(true)
    try {
      const result = await createLoad({ postType, pickup, delivery, vehicles, dates, additionalInfo, contract })
      if (isAssignCarrier && selectedDriverId) {
        await assignDriverToLoad(result._id, selectedDriverId)
      }
      onSuccess(result._id, result.loadNumber)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create load. Please try again."
      setErrors([msg])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Col 1 */}
        <div className="space-y-4">
          <SectionCard
            icon={MapPin}
            title="Pick-Up Location"
            description="Origin address, city, state, ZIP, and contact info"
            comingSoon={false}
          >
            <LocationFields value={pickup} onChange={setPickup} />
          </SectionCard>

          <SectionCard
            icon={Car}
            title="Vehicle Information"
            description={`Add up to ${MAX_VEHICLES} vehicles — trailer type, make, model, year, VIN, condition`}
            comingSoon={false}
          >
            <VehicleSection vehicles={vehicles} onChange={setVehicles} />
          </SectionCard>

          <SectionCard
            icon={FileText}
            title="Additional Info"
            description="Load notes, carrier instructions, and load board visibility"
            comingSoon={false}
          >
            <AdditionalInfoSection value={additionalInfo} onChange={setAdditionalInfo} />
          </SectionCard>

          {isAssignCarrier && (
            <SectionCard
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
          )}
        </div>

        {/* Col 2 */}
        <div className="space-y-4">
          <SectionCard
            icon={MapPin}
            title="Delivery Location"
            description="Destination address, city, state, ZIP, and contact info"
            comingSoon={false}
          >
            <LocationFields value={delivery} onChange={setDelivery} />
          </SectionCard>

          <SectionCard
            icon={Calendar}
            title="Dates & Deadlines"
            description="First available, pickup deadline, and delivery deadline"
            comingSoon={false}
          >
            <DatesSection value={dates} onChange={setDates} />
          </SectionCard>

          <SectionCard
            icon={DollarSign}
            title="Pricing & Payment"
            description="Auto-calculated from distance and vehicle type via SupraPay"
            comingSoon={false}
          >
            <PricingSection
              pickupZip={pickup.zip}
              deliveryZip={delivery.zip}
              vehicles={vehicles}
            />
          </SectionCard>

          <SectionCard
            icon={ScrollText}
            title="Terms & Contract"
            description="Review terms, agree, and sign digitally before posting"
            comingSoon={false}
          >
            <ContractSection value={contract} onChange={setContract} />
          </SectionCard>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              {e}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-4 pb-8">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9 px-4 border-border"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs h-9 px-6 disabled:opacity-75"
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
    </>
  )
}
