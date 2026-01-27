"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, FileText, Fuel, Gauge, Check, MapPin, Share2 } from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api-client"
import type { Vehicle } from "@/types/inventory"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"

export default function VehicleDetailsPage() {
    const params = useParams()
    const vehicleId = params.vehicleId as string

    const [vehicle, setVehicle] = React.useState<Vehicle | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [activeImage, setActiveImage] = React.useState<string>("")
    const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false)

    React.useEffect(() => {
        const fetchVehicle = async () => {
            try {
                setLoading(true)
                const response = await apiClient.get(`/api/vehicles/${vehicleId}`)
                const data = response.data?.data || response.data
                if (!data) throw new Error("Vehicle not found")

                // Transform functionality if needed, similar to the list page
                const transformedVehicle: Vehicle = {
                    id: data.id || data._id,
                    stockNumber: data.stockNumber || 'N/A',
                    year: data.year,
                    make: data.make,
                    model: data.model || data.modelName,
                    trim: data.trim || '',
                    price: data.price || 0,
                    mileage: data.mileage || 0,
                    vin: data.vin,
                    image: data.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
                    images: data.images || [],
                    location: data.location || 'Unknown',
                    color: data.color || 'N/A',
                    transmission: data.transmission || 'Automatic',
                    fuelType: data.fuelType || 'Gasoline',
                    exteriorColor: data.exteriorColor,
                    interiorColor: data.interiorColor,
                    status: data.status,
                    daysOnLot: data.daysOnLot,
                    bodyStyle: data.bodyStyle,
                    driveTrain: data.driveTrain
                }

                setVehicle(transformedVehicle)
                setActiveImage(transformedVehicle.image)
            } catch (err: any) {
                console.error("Error fetching vehicle details:", err)
                setError(err.message || "Failed to load vehicle details")
            } finally {
                setLoading(false)
            }
        }

        if (vehicleId) {
            fetchVehicle()
        }
    }, [vehicleId])

    if (loading) {
        return (
            <div className="container py-8 max-w-7xl mx-auto min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                    <p className="text-muted-foreground">Loading vehicle details...</p>
                </div>
            </div>
        )
    }

    if (error || !vehicle) {
        return (
            <div className="container py-8 max-w-7xl mx-auto">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <h1 className="text-2xl font-bold text-destructive">Error Loading Vehicle</h1>
                    <p className="text-muted-foreground">{error || "Vehicle not found"}</p>
                    <Button asChild variant="outline">
                        <Link href="/inventory">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Inventory
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const allImages = [vehicle.image, ...(vehicle.images || [])].filter(Boolean)

    return (
        <div className="min-h-screen bg-muted/10 pb-12">
            {/* Breadcrumb / Back Navigation */}
            <div className="border-b bg-background">
                <div className="container max-w-7xl mx-auto py-4 px-4">
                    <Link
                        href="/inventory"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Inventory
                    </Link>
                </div>
            </div>

            <div className="container max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Images */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="aspect-video relative overflow-hidden rounded-xl border bg-black/5 shadow-sm">
                            {/* Main Image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={activeImage}
                                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                className="h-full w-full object-cover"
                            />
                            {vehicle.status && (
                                <Badge className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 uppercase tracking-wide">
                                    {vehicle.status}
                                </Badge>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === img ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"
                                            }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img}
                                            alt={`View ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Vehicle Description / Notes */}
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Vehicle Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    This {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim} is currently {vehicle.status?.toLowerCase() || 'available'}.
                                    It features a {vehicle.exteriorColor || 'standard'} exterior paired with a {vehicle.interiorColor || 'standard'} interior.
                                    With {vehicle.mileage.toLocaleString()} miles, it is ready for its next owner.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Key Info & CTA */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                                <CardHeader className="space-y-1 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold leading-tight">
                                                {vehicle.year} {vehicle.make} {vehicle.model}
                                            </h1>
                                            <p className="text-lg text-muted-foreground">{vehicle.trim}</p>
                                        </div>
                                        <Button size="icon" variant="ghost" className="shrink-0">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-primary">
                                            ${vehicle.price.toLocaleString()}
                                        </span>
                                    </div>
                                </CardHeader>
                                <Separator />
                                <CardContent className="grid gap-4 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Mileage</span>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Gauge className="h-4 w-4 text-muted-foreground" />
                                                {vehicle.mileage.toLocaleString()} mi
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Transmission</span>
                                            <div className="flex items-center gap-2 font-medium">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {vehicle.transmission || 'Auto'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Engine</span>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Fuel className="h-4 w-4 text-muted-foreground" />
                                                {vehicle.fuelType || 'Gas'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Stock #</span>
                                            <div className="flex items-center gap-2 font-medium">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {vehicle.stockNumber}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">Location</span>
                                            <span className="font-medium flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {vehicle.location}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">VIN</span>
                                            <span className="font-mono text-xs">{vehicle.vin}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">Color</span>
                                            <span className="font-medium">{vehicle.exteriorColor || vehicle.color}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <Button
                                            size="lg"
                                            className="w-full text-base font-semibold shadow-md active:scale-[0.98] transition-all"
                                            onClick={() => setIsQuoteModalOpen(true)}
                                        >
                                            Calculate Shipping Quote
                                        </Button>
                                        <Button size="lg" variant="outline" className="w-full">
                                            Contact Availability
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <ShippingQuoteModal
                open={isQuoteModalOpen}
                onOpenChange={setIsQuoteModalOpen}
                vehicles={[vehicle]}
                // We reuse the existing modal logic but limit it to this vehicle
                // In a real app, logic might be shared via context or hook
                onCalculate={async (formData) => {
                    // Replicating the logic from main page or moving it to a helper would be better
                    // For now, implementing inline to ensure functionality
                    try {
                        console.log('[Quote] Submitting quote request:', formData)

                        const response = await apiClient.post('/api/quotes', {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            phone: formData.phone,
                            vehicleId: formData.vehicleId,
                            fromZip: formData.fromZip,
                            toZip: formData.zipCode,
                            fromAddress: formData.fromAddress,
                            toAddress: formData.fullAddress,
                            units: formData.units,
                            enclosedTrailer: formData.enclosedTrailer,
                            vehicleInoperable: formData.vehicleInoperable
                        })

                        const data = response.data?.data || response.data
                        alert(`Quote created successfully! Rate: $${data.rate}, ETA: ${data.eta.min}-${data.eta.max} days`)
                        setIsQuoteModalOpen(false)
                    } catch (error: any) {
                        console.error('[Quote] Error creating quote:', error)
                        const message = error.response?.data?.message || error.message || 'Unknown error'
                        alert('Failed to create quote: ' + message)
                    }
                }}
            />
        </div>
    )
}
