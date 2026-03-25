"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Truck,
  MapPin,
  ChevronRight,
  Building2,
  Phone,
  User,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
]

const LOCATION_TYPES = [
  "Business",
  "Residence",
  "Auction",
  "Port",
  "Repo Yard",
  "Dealer",
  "Auto Show",
  "Other",
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationBlock {
  locationType: string
  companyName: string
  contactName: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  phoneExt: string
  notes: string
}

const emptyLocation = (): LocationBlock => ({
  locationType: "",
  companyName: "",
  contactName: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: "",
  phoneExt: "",
  notes: "",
})

// ─── Field Row helper ─────────────────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}

function Field({
  label,
  required,
  icon: Icon,
  children,
  className,
}: {
  label: string
  required?: boolean
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="size-3 text-muted-foreground/70" />}
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── Location Fields ──────────────────────────────────────────────────────────

interface LocationFieldsProps {
  value: LocationBlock
  onChange: (updated: LocationBlock) => void
}

function LocationFields({ value, onChange }: LocationFieldsProps) {
  const set = (key: keyof LocationBlock) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...value, [key]: e.target.value })

  const setSelect = (key: keyof LocationBlock) => (val: string) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      {/* Location Type */}
      <Field label="Location Type" required icon={Building2}>
        <Select value={value.locationType} onValueChange={setSelect("locationType")}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-sm">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Company + Contact */}
      <FieldRow>
        <Field label="Company Name" icon={Building2}>
          <Input
            placeholder="ABC Motors"
            value={value.companyName}
            onChange={set("companyName")}
            className="h-9 text-sm"
          />
        </Field>
        <Field label="Contact Name" icon={User}>
          <Input
            placeholder="John Smith"
            value={value.contactName}
            onChange={set("contactName")}
            className="h-9 text-sm"
          />
        </Field>
      </FieldRow>

      {/* Street Address */}
      <Field label="Street Address" required icon={MapPin}>
        <Input
          placeholder="1234 Main St, Suite 100"
          value={value.street}
          onChange={set("street")}
          className="h-9 text-sm"
        />
      </Field>

      {/* City / State / ZIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="City" required className="col-span-1">
          <Input
            placeholder="Salt Lake City"
            value={value.city}
            onChange={set("city")}
            className="h-9 text-sm"
          />
        </Field>
        <Field label="State" required className="col-span-1">
          <Select value={value.state} onValueChange={setSelect("state")}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="UT" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="ZIP" required className="col-span-2 sm:col-span-1">
          <Input
            placeholder="84101"
            value={value.zip}
            onChange={set("zip")}
            maxLength={10}
            className="h-9 text-sm"
          />
        </Field>
      </div>

      {/* Country / Phone / Ext */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Country" className="col-span-1">
          <Input
            placeholder="US"
            value={value.country}
            onChange={set("country")}
            maxLength={3}
            className="h-9 text-sm uppercase"
          />
        </Field>
        <Field label="Phone" icon={Phone} className="col-span-1">
          <Input
            placeholder="(801) 555-0100"
            value={value.phone}
            onChange={set("phone")}
            type="tel"
            className="h-9 text-sm"
          />
        </Field>
        <Field label="Ext" icon={Hash} className="col-span-1">
          <Input
            placeholder="102"
            value={value.phoneExt}
            onChange={set("phoneExt")}
            maxLength={6}
            className="h-9 text-sm"
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Location Notes">
        <Textarea
          placeholder="Gate code, dock instructions, hours of operation…"
          value={value.notes}
          onChange={set("notes")}
          rows={2}
          className="text-sm resize-none"
        />
      </Field>
    </div>
  )
}

// ─── Section Skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      ))}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: React.ElementType
  title: string
  description: string
  children?: React.ReactNode
  skeletonRows?: number
  comingSoon?: boolean
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  skeletonRows = 3,
  comingSoon = true,
}: SectionCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="bg-green-500/10 dark:bg-green-500/20 p-1.5 rounded">
            <Icon className="size-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">
              {title}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 py-4">
        {comingSoon ? <SectionSkeleton rows={skeletonRows} /> : children}
      </CardContent>
    </Card>
  )
}

// ─── Load Form Layout ─────────────────────────────────────────────────────────

interface LoadFormProps {
  pickup: LocationBlock
  setPickup: (v: LocationBlock) => void
  delivery: LocationBlock
  setDelivery: (v: LocationBlock) => void
  onCancel: () => void
  submitLabel: string
}

function LoadFormLayout({
  pickup,
  setPickup,
  delivery,
  setDelivery,
  onCancel,
  submitLabel,
}: LoadFormProps) {
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
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-2 mt-6 pb-8">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-9 px-4 border-border"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled
          className="gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs h-9 px-6 disabled:opacity-50"
        >
          <Truck className="size-4" />
          {submitLabel}
        </Button>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateLoadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = React.useState("load-board")

  // Shared form state — same locations for both tabs
  const [lbPickup, setLbPickup] = React.useState<LocationBlock>(emptyLocation)
  const [lbDelivery, setLbDelivery] = React.useState<LocationBlock>(emptyLocation)
  const [acPickup, setAcPickup] = React.useState<LocationBlock>(emptyLocation)
  const [acDelivery, setAcDelivery] = React.useState<LocationBlock>(emptyLocation)

  // Preserve filters when going back
  const handleBack = () => {
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const tab = searchParams.get("tab")
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (tab) params.set("tab", tab)
    const query = params.toString()
    router.push(`/transportation${query ? `?${query}` : ""}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 border-none hover:bg-secondary"
              onClick={handleBack}
              aria-label="Go back to Transportation"
            >
              <ArrowLeft className="size-4" />
            </Button>

            <nav className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground min-w-0">
              <button
                onClick={handleBack}
                className="hover:text-foreground transition-colors truncate"
              >
                Transport
              </button>
              <ChevronRight className="size-3 shrink-0" />
              <span className="text-foreground font-medium truncate">
                Create Load
              </span>
            </nav>
          </div>

          {/* Right: icon + title + post button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="bg-green-500 p-1.5 rounded shrink-0">
                <Truck className="size-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground hidden md:block">
                Create Load
              </span>
            </div>
            <Button
              size="sm"
              disabled
              className="gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4 disabled:opacity-50"
            >
              <Truck className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">POST LOAD</span>
              <span className="xs:hidden">POST</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 md:px-6 pt-4 pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 bg-muted border border-border">
            <TabsTrigger
              value="load-board"
              className="text-[11px] sm:text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Post to Load Board
            </TabsTrigger>
            <TabsTrigger
              value="assign-carrier"
              className="text-[11px] sm:text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Assign to a Carrier
            </TabsTrigger>
          </TabsList>

          {/* ── Load Board Tab ──────────────────────────────────────────── */}
          <TabsContent value="load-board" className="mt-4 outline-none">
            <LoadFormLayout
              pickup={lbPickup}
              setPickup={setLbPickup}
              delivery={lbDelivery}
              setDelivery={setLbDelivery}
              onCancel={handleBack}
              submitLabel="POST LOAD"
            />
          </TabsContent>

          {/* ── Assign to Carrier Tab ───────────────────────────────────── */}
          <TabsContent value="assign-carrier" className="mt-4 outline-none">
            <LoadFormLayout
              pickup={acPickup}
              setPickup={setAcPickup}
              delivery={acDelivery}
              setDelivery={setAcDelivery}
              onCancel={handleBack}
              submitLabel="ASSIGN CARRIER"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
