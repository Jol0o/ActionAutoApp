"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ChevronRight, Truck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadFormLayout } from "@/components/create-load/LoadFormLayout"
import {
  emptyLocation,
  emptyVehicle,
  emptyDates,
  emptyAdditionalInfo,
  emptyContract,
  LocationBlock,
  LoadVehicle,
  LoadDates,
  LoadAdditionalInfo,
  LoadContract,
} from "@/components/create-load/types"

export default function CreateLoadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = React.useState("load-board")
  const [successInfo, setSuccessInfo] = React.useState<{ loadNumber: string } | null>(null)

  // Load Board tab state
  const [lbPickup,          setLbPickup]          = React.useState<LocationBlock>(emptyLocation())
  const [lbDelivery,        setLbDelivery]        = React.useState<LocationBlock>(emptyLocation())
  const [lbVehicles,        setLbVehicles]        = React.useState<LoadVehicle[]>([emptyVehicle()])
  const [lbDates,           setLbDates]           = React.useState<LoadDates>(emptyDates())
  const [lbAdditionalInfo,  setLbAdditionalInfo]  = React.useState<LoadAdditionalInfo>(emptyAdditionalInfo())
  const [lbContract,        setLbContract]        = React.useState<LoadContract>(emptyContract())

  // Assign to Carrier tab state
  const [acPickup,          setAcPickup]          = React.useState<LocationBlock>(emptyLocation())
  const [acDelivery,        setAcDelivery]        = React.useState<LocationBlock>(emptyLocation())
  const [acVehicles,        setAcVehicles]        = React.useState<LoadVehicle[]>([emptyVehicle()])
  const [acDates,           setAcDates]           = React.useState<LoadDates>(emptyDates())
  const [acAdditionalInfo,  setAcAdditionalInfo]  = React.useState<LoadAdditionalInfo>(emptyAdditionalInfo())
  const [acContract,        setAcContract]        = React.useState<LoadContract>(emptyContract())

  const buildBackUrl = () => {
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const tab    = searchParams.get("tab")
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (tab)    params.set("tab", tab)
    const query = params.toString()
    return `/transportation${query ? `?${query}` : ""}`
  }

  const handleBack = () => router.push(buildBackUrl())

  const handleSuccess = (_loadId: string, loadNumber: string) => {
    setSuccessInfo({ loadNumber })
    setTimeout(() => router.push(buildBackUrl()), 2000)
  }

  if (successInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-12 text-green-500" />
          <p className="text-lg font-semibold text-foreground">Load Created!</p>
          <p className="text-sm text-muted-foreground">
            Load <span className="font-mono font-medium text-foreground">{successInfo.loadNumber}</span> has been posted.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting to Transportation…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
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
              <button onClick={handleBack} className="hover:text-foreground transition-colors truncate">
                Transport
              </button>
              <ChevronRight className="size-3 shrink-0" />
              <span className="text-foreground font-medium truncate">Create Load</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="bg-green-500 p-1.5 rounded shrink-0">
                <Truck className="size-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground hidden md:block">
                Create Load
              </span>
            </div>
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

          <TabsContent value="load-board" className="mt-4 outline-none">
            <LoadFormLayout
              postType="load-board"
              pickup={lbPickup}                   setPickup={setLbPickup}
              delivery={lbDelivery}               setDelivery={setLbDelivery}
              vehicles={lbVehicles}               setVehicles={setLbVehicles}
              dates={lbDates}                     setDates={setLbDates}
              additionalInfo={lbAdditionalInfo}   setAdditionalInfo={setLbAdditionalInfo}
              contract={lbContract}               setContract={setLbContract}
              onCancel={handleBack}
              onSuccess={handleSuccess}
              submitLabel="POST LOAD"
            />
          </TabsContent>

          <TabsContent value="assign-carrier" className="mt-4 outline-none">
            <LoadFormLayout
              postType="assign-carrier"
              pickup={acPickup}                   setPickup={setAcPickup}
              delivery={acDelivery}               setDelivery={setAcDelivery}
              vehicles={acVehicles}               setVehicles={setAcVehicles}
              dates={acDates}                     setDates={setAcDates}
              additionalInfo={acAdditionalInfo}   setAdditionalInfo={setAcAdditionalInfo}
              contract={acContract}               setContract={setAcContract}
              onCancel={handleBack}
              onSuccess={handleSuccess}
              submitLabel="ASSIGN CARRIER"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
