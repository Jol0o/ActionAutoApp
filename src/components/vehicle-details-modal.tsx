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
import { VehicleDetailView } from "@/components/inventory/VehicleDetailView"
import type { Vehicle } from "@/types/inventory"

interface VehicleDetailsModalProps {
    vehicle: Vehicle | null
    isOpen: boolean
    onClose: () => void
    onQuoteClick: () => void
    onInquiryClick: (vehicle: Vehicle) => void
    onApplyNow: (vehicle: Vehicle) => void
    shippingQuote?: number | null
}

export function VehicleDetailsModal({
    vehicle,
    isOpen,
    onClose,
    onQuoteClick,
    onInquiryClick,
    onApplyNow,
    shippingQuote
}: VehicleDetailsModalProps) {
    if (!vehicle) return null

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

                {/* Scrollable Content */}
                <VehicleDetailView
                    vehicle={vehicle}
                    onInquiryClick={onInquiryClick}
                    onApplyNow={onApplyNow}
                    onQuoteClick={onQuoteClick}
                    shippingQuote={shippingQuote}
                />
            </DialogContent>
        </Dialog>
    )
}
