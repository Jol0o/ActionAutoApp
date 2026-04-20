"use client"

import * as React from "react"
import { Share2, Gauge, FileText, Fuel, MapPin, X, Copy, Check, Lock, ClipboardList, History, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { Vehicle } from "@/types/inventory"
import { useOrg } from "@/hooks/useOrg"

interface VehicleDetailViewProps {
    vehicle: Vehicle
    onInquiryClick?: (vehicle: Vehicle) => void
    onApplyNow?: (vehicle: Vehicle) => void
    onQuoteClick?: () => void
    shippingQuote?: number | null
    isPublic?: boolean
}

export function VehicleDetailView({
    vehicle,
    onInquiryClick,
    onApplyNow,
    onQuoteClick,
    shippingQuote,
    isPublic = false
}: VehicleDetailViewProps) {
    const { userRole, isSuperAdmin } = useOrg();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin;
    const [activeImage, setActiveImage] = React.useState<string>(vehicle.image)
    const [isCopied, setIsCopied] = React.useState(false)

    React.useEffect(() => {
        console.log("[DEBUG] Vehicle Detail View Data:", {
            id: vehicle.id,
            vin: vehicle.vin,
            hasComments: !!vehicle.comments,
            commentsLength: vehicle.comments?.length,
            comments: vehicle.comments,
            allKeys: Object.keys(vehicle)
        });
    }, [vehicle]);
    1
    const allImages = [vehicle.image, ...(vehicle.images || [])].filter(Boolean)

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/vehicle/${vehicle.id}`
        const shareData = {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} at Action Auto Utah!`,
            url: shareUrl,
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
                toast.success("Shared successfully!")
            } else {
                await navigator.clipboard.writeText(shareUrl)
                setIsCopied(true)
                toast.success("Link copied to clipboard!")
                setTimeout(() => setIsCopied(false), 2000)
            }
        } catch (err) {
            console.error("Error sharing:", err)
            // Fallback to clipboard if share was cancelled or failed
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleDirections = () => {
        const destination = encodeURIComponent(`Action Auto Utah ${vehicle.location || "Orem, UT"}`)
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank")
    }

    return (
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
                            <div className="font-semibold text-sm">{vehicle.mileage?.toLocaleString()} mi</div>
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
                        {vehicle.comments ? (
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {vehicle.comments}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim} is finished in a {vehicle.exteriorColor || 'stunning'} exterior.
                                Currently located in {vehicle.location}, it has been inspected and is {vehicle.status?.toLowerCase() || 'ready'}.
                            </p>
                        )}
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

                    {/* Admin Specific: Internal Notes Section */}
                    {isAdmin && vehicle.notes && vehicle.notes.length > 0 && (
                        <div className="bg-background/50 p-5 rounded-xl border border-primary/20 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                                <ClipboardList className="w-4 h-4" /> Internal Staff Notes
                            </h3>
                            <div className="space-y-3">
                                {vehicle.notes.map((note, idx) => (
                                    <div key={idx} className="bg-muted/20 p-3 rounded-lg text-xs space-y-1 border border-border/50">
                                        <div className="flex justify-between items-center opacity-70">
                                            <span className="font-bold">{note.author?.name || 'Staff Member'}</span>
                                            <span>{note.date ? new Date(note.date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <p className="text-foreground leading-relaxed italic">"{note.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>


                {/* RIGHT COLUMN: Sidebar (4 cols) - Sticky on Desktop */}
                <div className="lg:col-span-4 bg-background border-l shadow-sm lg:min-h-full">
                    <div className="p-6 space-y-6 lg:sticky lg:top-0">

                        {/* Pricing Block */}
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Our Price</p>
                            <div className="text-4xl font-black text-primary tracking-tight">
                                ${vehicle.price?.toLocaleString()}
                            </div>
                            {shippingQuote && (
                                <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1.5 animate-in slide-in-from-top-2 fade-in">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                    Shipping: <span className="font-bold">${shippingQuote.toLocaleString()}</span>
                                </div>
                            )}
                        </div>


                        {/* Admin Specific: Internal Cost Dashboard */}
                        {isAdmin && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-right-2 duration-500">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-tighter flex items-center gap-1.5 text-primary">
                                        <Lock className="w-3.5 h-3.5" /> Staff Financials
                                    </span>
                                    <Badge variant="default" className="text-[9px] h-4 bg-primary/20 text-primary border-transparent">
                                        Admin Eyes Only
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Dealer Cost</p>
                                        <p className="text-lg font-black tracking-tight">${vehicle.cost?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Potential Profit</p>
                                        <p className="text-lg font-black tracking-tight text-green-600">
                                            ${((vehicle.price || 0) - (vehicle.cost || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <Separator className="bg-primary/10" />
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] uppercase font-bold">
                                        <span className="text-muted-foreground flex items-center gap-1"><History className="w-3 h-3" /> Recon Stage</span>
                                        <span className="text-primary">{vehicle.currentStep || 'Ready'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '75%' }} />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-tight italic">
                                        {vehicle.status === 'In Recon' ? 'Vehicle is currently moving through the reconditioning pipeline.' : 'Vehicle completed recon and is live.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Public Status Card (Simplified for Customers) */}
                        {!isAdmin && (
                            <div className="bg-muted/10 border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <Gauge className="w-3.5 h-3.5" /> Status
                                    </span>
                                    {vehicle.status && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-background">
                                            {vehicle.status}
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Availability</span>
                                        <span className="font-medium">{vehicle.status || 'Checking...'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                                        <span>Listed Locally</span>
                                        <span>Ready for Sale</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            {onQuoteClick && (
                                <Button
                                    size="lg"
                                    className="w-full text-sm font-bold shadow-md h-11"
                                    onClick={onQuoteClick}
                                >
                                    Calculate Shipping
                                </Button>
                            )}
                            {onInquiryClick && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full h-11 border-2 font-semibold text-sm"
                                    onClick={() => onInquiryClick(vehicle)}
                                >
                                    Check Availability
                                </Button>
                            )}
                            {onApplyNow && (
                                <Button
                                    size="lg"
                                    className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm shadow-lg"
                                    onClick={() => onApplyNow(vehicle)}
                                >
                                    Apply For Financing
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs text-muted-foreground hover:text-foreground border"
                                    onClick={handleDirections}
                                >
                                    <MapPin className="w-3 h-3 mr-1.5" /> Directions
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs text-muted-foreground hover:text-foreground border flex items-center justify-center gap-1.5"
                                    onClick={handleShare}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="w-3 h-3 text-green-500" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-3 h-3" />
                                            <span>Share</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Location Details */}
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
                                    className="w-full h-[180px] object-cover"
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
                                        onClick={handleDirections}
                                    >
                                        <MapPin className="h-3 w-3" /> Open Maps
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
