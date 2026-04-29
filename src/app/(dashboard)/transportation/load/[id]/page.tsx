"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getLoadById } from "@/lib/api/loads"
import { ArrowLeft, MapPin, Calendar, Car, DollarSign, FileText, ScrollText, Truck, AlertCircle, Phone, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

// Skeleton loader
function LoadDetailsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-24 h-8 bg-muted rounded"></div>
        <div className="w-48 h-8 bg-muted rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-muted rounded-xl"></div>
        <div className="h-64 bg-muted rounded-xl"></div>
      </div>
      <div className="h-48 bg-muted rounded-xl"></div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  let color = "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
  switch (status) {
    case "Posted": color = "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30"; break;
    case "Assigned": color = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"; break;
    case "In-Transit": color = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"; break;
    case "Delivered": color = "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30"; break;
    case "Cancelled": color = "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30"; break;
  }
  return <Badge variant="outline" className={`${color} px-3 py-1 font-medium text-xs rounded-full shadow-none`}>{status}</Badge>
}

export default function LoadDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: load, isLoading, isError } = useQuery({
    queryKey: ["load", id],
    queryFn: () => getLoadById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })

  if (isLoading) return <LoadDetailsSkeleton />

  if (isError || !load) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="size-12 text-destructive opacity-80" />
        <h2 className="text-xl font-semibold">Load Not Found</h2>
        <p className="text-muted-foreground text-sm">We couldn't find the details for this load. It may have been deleted.</p>
        <Button variant="outline" onClick={() => router.push("/transportation")}>Back to Transportation</Button>
      </div>
    )
  }

  // format dates helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A"
    try {
      return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a")
    } catch {
      return "Invalid date"
    }
  }

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "N/A"
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in zoom-in-[0.98] duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground mb-2" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-2" /> Back to Loads
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{load.loadNumber}</h1>
            <StatusBadge status={load.status} />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            Posted {formatDate(load.createdAt)}
            {load.postType === "assign-carrier" && <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Direct Dispatch</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="bg-background"><FileText className="size-4 mr-2 text-muted-foreground" /> Print Bol</Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Edit Load</Button>
        </div>
      </div>

      {/* ── Route Card ── */}
      <Card className="border-border shadow-sm overflow-hidden bg-card relative p-0">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row relative">
            {/* Pick-Up */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/10 p-3 rounded-2xl shrink-0 mt-1 border border-blue-500/20">
                  <MapPin className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Pick-Up</p>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{load.pickupLocation?.city}, {load.pickupLocation?.state} {load.pickupLocation?.zip}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{load.pickupLocation?.street}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 text-sm pt-2">
                    {load.pickupLocation?.companyName && (
                      <div className="col-span-2 flex items-center gap-2.5 text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/50">
                        <Building2 className="size-4 shrink-0 text-foreground/70" /> <span className="font-medium text-foreground">{load.pickupLocation.companyName}</span>
                      </div>
                    )}
                    <div className="col-span-2 flex flex-col gap-1 text-muted-foreground pl-1">
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 shrink-0" /> <span className="font-medium">{load.pickupLocation?.phone}</span> {load.pickupLocation?.phoneExt ? `ext ${load.pickupLocation.phoneExt}` : ""}
                      </div>
                      {load.pickupLocation?.contactName && (
                        <div className="text-sm pl-5 text-muted-foreground/80">— {load.pickupLocation.contactName}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Divider / Connector */}
            <div className="hidden lg:flex flex-col items-center justify-center relative px-2">
              <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent absolute left-1/2 -translate-x-1/2"></div>
              <div className="bg-background border-2 border-border rounded-full p-2.5 z-10 shadow-sm relative">
                <Truck className="size-5 text-muted-foreground" />
              </div>
            </div>
            {/* Mobile Divider */}
            <div className="lg:hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent relative flex items-center justify-center my-2">
              <div className="bg-background border-2 border-border rounded-full p-1.5 z-10 absolute">
                <Truck className="size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Delivery */}
            <div className="flex-1 p-6 md:p-8 lg:bg-muted/10 relative">
              <div className="flex items-start gap-4">
                <div className="bg-green-500/10 p-3 rounded-2xl shrink-0 mt-1 border border-green-500/20">
                  <MapPin className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5">Delivery</p>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{load.deliveryLocation?.city}, {load.deliveryLocation?.state} {load.deliveryLocation?.zip}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{load.deliveryLocation?.street}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 text-sm pt-2">
                    {load.deliveryLocation?.companyName && (
                      <div className="col-span-2 flex items-center gap-2.5 text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border/50">
                        <Building2 className="size-4 shrink-0 text-foreground/70" /> <span className="font-medium text-foreground">{load.deliveryLocation.companyName}</span>
                      </div>
                    )}
                    <div className="col-span-2 flex flex-col gap-1 text-muted-foreground pl-1">
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 shrink-0" /> <span className="font-medium">{load.deliveryLocation?.phone}</span> {load.deliveryLocation?.phoneExt ? `ext ${load.deliveryLocation.phoneExt}` : ""}
                      </div>
                      {load.deliveryLocation?.contactName && (
                        <div className="text-sm pl-5 text-muted-foreground/80">— {load.deliveryLocation.contactName}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Dates Bar */}
          <div className="bg-muted/30 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-sm relative z-0">
            <div className="flex flex-col">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="size-3.5" /> First Available</p>
              <p className="font-medium text-foreground pl-5">{formatShortDate(load.dates?.firstAvailable)}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="size-3.5" /> Pickup Deadline</p>
              <p className="font-medium text-foreground pl-5">{formatShortDate(load.dates?.pickupDeadline)}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="size-3.5" /> Delivery Deadline</p>
              <p className="font-medium text-foreground pl-5">{formatShortDate(load.dates?.deliveryDeadline)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (Vehicles) ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Car className="size-5 text-muted-foreground" /> Vehicles <span className="text-muted-foreground font-normal text-sm bg-muted px-2 py-0.5 rounded-full">{load.vehicles?.length || 0}</span>
              </CardTitle>
              {load.trailerType && (
                <Badge variant="secondary" className="font-bold text-xs uppercase tracking-wider bg-background border-border shadow-sm">
                  {load.trailerType.replace(/_/g, " ")}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {load.vehicles?.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-background border border-border/50 p-3 rounded-xl shrink-0 shadow-sm">
                        <Car className="size-5 text-foreground/70" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground">{v.year} {v.make} {v.model}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5 font-mono bg-background px-1.5 py-0.5 rounded inline-block border border-border/30">{v.vin || "No VIN provided"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Badge variant="outline" className={`${v.condition === "Operable" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"} shadow-sm font-bold`}>
                        {v.condition}
                      </Badge>
                      {v.color && (
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-full shadow-sm">
                          <div className="size-2.5 rounded-full border border-border shadow-inner" style={{ backgroundColor: v.color.toLowerCase() }} /> {v.color}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (Pricing & Info) ── */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="border-border/80 shadow-sm bg-gradient-to-br from-card to-muted/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <DollarSign className="size-24" />
            </div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <DollarSign className="size-5 text-green-600 dark:text-green-500" /> Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Carrier Pay</span>
                <span className="font-bold text-xl text-foreground">${load.pricing?.carrierPayAmount?.toLocaleString() || "0"}</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">COD / COP</span>
                <span className="font-semibold text-lg">${load.pricing?.copCodAmount?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Total Distance</span>
                <span className="font-semibold">{load.pricing?.miles?.toLocaleString() || "0"} mi</span>
              </div>
              {load.pricing?.estimatedRate && (
                <div className="flex items-center justify-between mt-3 p-3 bg-background border border-border/50 rounded-xl shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><AlertCircle className="size-3" /> Est. Market Rate</span>
                  <span className="font-bold text-sm text-foreground">${load.pricing.estimatedRate.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract / Terms */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <ScrollText className="size-5 text-muted-foreground" /> Contract
              </CardTitle>
            </CardHeader>
            <CardContent>
              {load.contract?.agreedToTerms ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2.5">
                    <div className="size-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-sm font-bold tracking-tight">Terms Agreed & Signed</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Signed by: <span className="text-foreground font-semibold">{load.contract.signatureName}</span></p>
                  <p className="text-[10px] text-muted-foreground/80 font-mono">{formatDate(load.contract.signedAt || load.createdAt)}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50 text-sm text-muted-foreground italic">
                  <AlertCircle className="size-4" /> No contract details available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          {(load.additionalInfo?.instructions || load.additionalInfo?.notes) && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <FileText className="size-5 text-muted-foreground" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {load.additionalInfo.instructions && (
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Carrier Instructions</h5>
                    <p className="text-sm bg-muted/30 p-3.5 rounded-xl border border-border/50 leading-relaxed text-foreground/90">{load.additionalInfo.instructions}</p>
                  </div>
                )}
                {load.additionalInfo.notes && (
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Internal Notes</h5>
                    <p className="text-sm bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/10 leading-relaxed text-blue-900 dark:text-blue-200">{load.additionalInfo.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
