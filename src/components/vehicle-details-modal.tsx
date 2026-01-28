"use client"

import * as React from "react"
import { Share2, Gauge, FileText, Fuel, MapPin, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Vehicle } from "@/types/inventory"

interface VehicleDetailsModalProps {
    vehicle: Vehicle | null
    isOpen: boolean
    onClose: () => void
    onQuoteClick: () => void
    shippingQuote?: number | null
}

export function VehicleDetailsModal({
    vehicle,
    isOpen,
    onClose,
    onQuoteClick,
    shippingQuote
}: VehicleDetailsModalProps) {
    const [activeImage, setActiveImage] = React.useState<string>("")

    React.useEffect(() => {
        if (vehicle) {
            setActiveImage(vehicle.image)
        }
    }, [vehicle])

    if (!vehicle) return null

    const allImages = [vehicle.image, ...(vehicle.images || [])].filter(Boolean)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-3xl border-border/40 shadow-2xl">

                {/* Header - Compact & Clean */}
                <div className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-md z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-2">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground border-muted-foreground/30">
                                    #{vehicle.stockNumber}
                                </Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium">{vehicle.trim}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Main Content - Grid Layout */}
                <div className="flex-1 overflow-y-auto bg-muted/10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">

                        {/* LEFT COLUMN: Gallery & Core Details (8 cols) */}
                        <div className="lg:col-span-8 p-6 lg:p-8 space-y-6 flex flex-col">

                            {/* Gallery Section */}
                            <div className="space-y-3">
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg border border-border/50 relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={activeImage}
                                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                        className="h-full w-full object-contain"
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                        Action Auto Utah
                                    </div>
                                </div>

                                {/* Thumbnails */}
                                {allImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 snap-x">
                                        {allImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md border transition-all snap-start ${activeImage === img
                                                    ? "border-primary ring-2 ring-primary/20 opacity-100"
                                                    : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img}
                                                    alt={`Thumb ${idx}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Key Stats Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-background p-3 rounded-lg border shadow-sm">
                                    <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                                        <Gauge className="w-3 h-3" /> Mileage
                                    </div>
                                    <div className="font-semibold text-sm">{vehicle.mileage.toLocaleString()} mi</div>
                                </div>
                                <div className="bg-background p-3 rounded-lg border shadow-sm">
                                    <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                                        <Fuel className="w-3 h-3" /> Engine
                                    </div>
                                    <div className="font-semibold text-sm truncate" title={vehicle.fuelType}>{vehicle.fuelType || 'Gas'}</div>
                                </div>
                                <div className="bg-background p-3 rounded-lg border shadow-sm">
                                    <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                                        <FileText className="w-3 h-3" /> Transmission
                                    </div>
                                    <div className="font-semibold text-sm truncate" title={vehicle.transmission}>{vehicle.transmission || 'Auto'}</div>
                                </div>
                                <div className="bg-background p-3 rounded-lg border shadow-sm">
                                    <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                                        <Share2 className="w-3 h-3" /> Drivetrain
                                    </div>
                                    <div className="font-semibold text-sm truncate">{vehicle.driveTrain || 'FWD'}</div>
                                </div>
                            </div>

                            {/* Description / Additional Info */}
                            <div className="bg-background p-5 rounded-xl border shadow-sm space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    Vehicle Overview
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    This {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim} is finished in a {vehicle.exteriorColor || 'stunning'} exterior.
                                    Currently located in {vehicle.location}, it has been inspected and is {vehicle.status?.toLowerCase() || 'ready'}.
                                    {vehicle.notes && vehicle.notes.length > 0 && (
                                        <span className="block mt-2">{JSON.stringify(vehicle.notes)}</span>
                                    )}
                                </p>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-8 pt-2 text-xs text-muted-foreground">
                                    <div className="flex justify-between border-b pb-1">
                                        <span>VIN</span>
                                        <span className="font-mono text-foreground">{vehicle.vin}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Stock #</span>
                                        <span className="font-mono text-foreground">{vehicle.stockNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Interior</span>
                                        <span className="text-foreground">{vehicle.interiorColor || 'Standard'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Exterior</span>
                                        <span className="text-foreground">{vehicle.exteriorColor || vehicle.color}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Sidebar (4 cols) - Sticky on Desktop */}
                        <div className="lg:col-span-4 bg-background border-l shadow-sm lg:min-h-full">
                            <div className="p-6 space-y-6 lg:sticky lg:top-0">

                                {/* Pricing Block */}
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Our Price</p>
                                    <div className="text-4xl font-black text-primary tracking-tight">
                                        ${vehicle.price.toLocaleString()}
                                    </div>
                                    {shippingQuote && (
                                        <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1.5 animate-in slide-in-from-top-2 fade-in">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                            Shipping: <span className="font-bold">${shippingQuote.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Recon Status Card (Simplified) */}
                                <div className="bg-muted/10 border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                            <Gauge className="w-3.5 h-3.5" /> Recon Status
                                        </span>
                                        {vehicle.status && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-background">
                                                {vehicle.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Current Step</span>
                                            <span className="font-medium">{vehicle.currentStep || 'Processing'}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                                            <span>Started: {vehicle.reconStartDate ? new Date(vehicle.reconStartDate).toLocaleDateString() : 'Recent'}</span>
                                            <span>{vehicle.daysOnLot || 1} Days</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <Button
                                        size="lg"
                                        className="w-full text-sm font-bold shadow-md h-11"
                                        onClick={onQuoteClick}
                                    >
                                        Calculate Shipping
                                    </Button>
                                    <Button size="lg" variant="outline" className="w-full h-11 border-2 font-semibold text-sm">
                                        Check Availability
                                    </Button>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-foreground border">
                                            <MapPin className="w-3 h-3 mr-1.5" /> Directions
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-foreground border">
                                            <Share2 className="w-3 h-3 mr-1.5" /> Share
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Location Details - Enhanced */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" /> Location
                                    </h4>
                                    <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm bg-muted/20 hover:shadow-md transition-shadow group">
                                        <iframe
                                            title="Vehicle Location"
                                            width="100%"
                                            height="180"
                                            style={{ filter: "grayscale(20%) kontrast(1.2) opacity(0.9)" }}
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent("Action Auto Utah " + (vehicle.location || "Orem, UT"))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                            className="w-full h-[180px] object-cover group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="p-3 bg-background flex items-center justify-between border-t border-border/50">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-semibold">Action Auto Utah</p>
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                    {vehicle.location || 'Orem, UT'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] px-2 gap-1.5"
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Action Auto Utah " + (vehicle.location || ""))}`, '_blank')}
                                            >
                                                <MapPin className="h-3 w-3" /> Open
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
