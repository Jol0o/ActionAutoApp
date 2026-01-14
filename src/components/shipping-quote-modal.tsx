"use client"

import * as React from "react"
import { X, MapPin, User, Mail, Phone, MapPinned, Package, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Vehicle, ShippingQuoteFormData } from "@/types/inventory"

interface ShippingQuoteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicle?: Vehicle | null
    onCalculate: (formData: ShippingQuoteFormData) => void
}

export function ShippingQuoteModal({
    open,
    onOpenChange,
    vehicle,
    onCalculate,
}: ShippingQuoteModalProps) {
    const [isCalculating, setIsCalculating] = React.useState(false)
    const [formData, setFormData] = React.useState<ShippingQuoteFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        zipCode: "",
        units: 1,
        fullAddress: "",
        enclosedTrailer: false,
        vehicleInoperable: false,
    })

    const [errors, setErrors] = React.useState<Partial<Record<keyof ShippingQuoteFormData, string>>>({})

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof ShippingQuoteFormData, string>> = {}

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"

        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format"
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required"
        } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
            newErrors.phone = "Invalid phone number"
        }

        if (!formData.zipCode.trim()) {
            newErrors.zipCode = "ZIP code is required"
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
            newErrors.zipCode = "Invalid ZIP code"
        }

        if (!formData.fullAddress.trim()) {
            newErrors.fullAddress = "Full address is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsCalculating(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        onCalculate(formData)
        setIsCalculating(false)
        onOpenChange(false)

        // Reset form
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            zipCode: "",
            units: 1,
            fullAddress: "",
            enclosedTrailer: false,
            vehicleInoperable: false,
        })
        setErrors({})
    }

    const updateField = (field: keyof ShippingQuoteFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border text-card-foreground">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Close</span>
                </button>

                <DialogHeader className="space-y-3 pb-4 border-b border-border">
                    {vehicle && (
                        <div className="flex items-start gap-3">
                            <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                                <img
                                    src={vehicle.image}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-lg font-bold">
                                    Get Quote for {vehicle.year} {vehicle.make} {vehicle.model}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Premium shipping quote from Utah to your destination
                                </p>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground">
                                        {vehicle.make} {vehicle.model}
                                    </span>
                                    <span className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground">
                                        ${vehicle.price.toLocaleString()} Value
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {!vehicle && (
                        <div>
                            <DialogTitle className="text-lg font-bold">
                                Calculate Shipping Quote
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Get shipping quotes for all vehicles from Utah to your destination
                            </p>
                        </div>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Shipping From */}
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-semibold">Shipping From</span>
                        </div>
                        <p className="text-sm">Utah, United States (84791)</p>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-semibold">Customer Information</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => updateField("firstName", e.target.value)}
                                    className={`bg-background border-input ${errors.firstName ? "border-destructive" : ""
                                        }`}
                                    placeholder="John Loyd"
                                />
                                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => updateField("lastName", e.target.value)}
                                    className={`bg-background border-input ${errors.lastName ? "border-destructive" : ""
                                        }`}
                                    placeholder="Belen"
                                />
                                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    className={`pl-10 bg-background border-input ${errors.email ? "border-destructive" : ""
                                        }`}
                                    placeholder="jloyd9836@gmail.com"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    className={`pl-10 bg-background border-input ${errors.phone ? "border-destructive" : ""
                                        }`}
                                    placeholder="9991502898"
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Destination */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPinned className="w-4 h-4" />
                            <span className="text-sm font-semibold">Destination</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-xs">ZIP Code</Label>
                                <Input
                                    id="zipCode"
                                    value={formData.zipCode}
                                    onChange={(e) => updateField("zipCode", e.target.value)}
                                    className={`bg-background border-input ${errors.zipCode ? "border-destructive" : ""
                                        }`}
                                    placeholder="90210"
                                />
                                {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="units" className="text-xs">Units</Label>
                                <Input
                                    id="units"
                                    type="number"
                                    min="1"
                                    value={formData.units}
                                    onChange={(e) => updateField("units", parseInt(e.target.value) || 1)}
                                    className="bg-background border-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs">Full Destination Address</Label>
                            <Input
                                id="address"
                                value={formData.fullAddress}
                                onChange={(e) => updateField("fullAddress", e.target.value)}
                                className={`bg-background border-input ${errors.fullAddress ? "border-destructive" : ""
                                    }`}
                                placeholder="456 Oak St, City, State"
                            />
                            {errors.fullAddress && <p className="text-xs text-destructive">{errors.fullAddress}</p>}
                        </div>
                    </div>

                    {/* Transport Options */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-semibold">Transport Options</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start space-x-3 bg-accent/30 p-3 rounded-lg border border-border">
                                <Checkbox
                                    id="enclosedTrailer"
                                    checked={formData.enclosedTrailer}
                                    onCheckedChange={(checked) => updateField("enclosedTrailer", checked as boolean)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <Label htmlFor="enclosedTrailer" className="text-sm font-medium cursor-pointer">
                                        Enclosed Trailer
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Extra protection for your vehicle (additional cost)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 bg-accent/30 p-3 rounded-lg border border-border">
                                <Checkbox
                                    id="vehicleInoperable"
                                    checked={formData.vehicleInoperable}
                                    onCheckedChange={(checked) => updateField("vehicleInoperable", checked as boolean)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <Label htmlFor="vehicleInoperable" className="text-sm font-medium cursor-pointer">
                                        Vehicle is inoperable
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Vehicle doesn&apos;t run or drive (additional cost)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={isCalculating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                "Calculate"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
