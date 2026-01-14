"use client"

import * as React from "react"
import { Vehicle, ShippingQuoteFormData, ShippingQuote, QuoteCalculation } from "@/types/inventory"
import { CarInventoryCard } from "@/components/car-inventory-card"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { Button } from "@/components/ui/button"
import { TruckIcon, FilterIcon } from "lucide-react"

// Mock vehicle data
const mockVehicles: Vehicle[] = [
    {
        id: "1",
        stockNumber: "L20294",
        year: 2022,
        make: "Acura",
        model: "MDX",
        trim: "SH-AWD W/TECH",
        price: 45990,
        mileage: 46870,
        vin: "5J8YD4H86NL123456",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "White",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "2",
        stockNumber: "L21163",
        year: 2024,
        make: "Mercedes-Benz",
        model: "S-Class",
        trim: "S 580 4MATIC",
        price: 110000,
        mileage: 12483,
        vin: "WDDUX8GB8PA123456",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Black",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "3",
        stockNumber: "L20694",
        year: 2021,
        make: "Acura",
        model: "RDX",
        trim: "SH-AWD W/A-SPEC",
        price: 38500,
        mileage: 96441,
        vin: "5J8TC2H51ML123456",
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "Silver",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "4",
        stockNumber: "L21009",
        year: 2020,
        make: "Audi",
        model: "A6",
        trim: "Premium Plus",
        price: 32900,
        mileage: 41629,
        vin: "WAUC2AF28LN123456",
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Blue",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "5",
        stockNumber: "L20615",
        year: 2019,
        make: "BMW",
        model: "X5",
        trim: "xDrive40i",
        price: 42000,
        mileage: 38076,
        vin: "5UXCR6C09KL123456",
        image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "White",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "6",
        stockNumber: "L21143",
        year: 2018,
        make: "Chevrolet",
        model: "Silverado 1500",
        trim: "LT Crew Cab",
        price: 28900,
        mileage: 116639,
        vin: "1GCUKREC0JZ123456",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Red",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "7",
        stockNumber: "L20893",
        year: 2021,
        make: "Honda",
        model: "CR-V",
        trim: "Hybrid Sport",
        price: 29500,
        mileage: 55997,
        vin: "7FARW2H89ME123456",
        image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "Gray",
        transmission: "Automatic",
        fuelType: "Hybrid",
    },
    {
        id: "8",
        stockNumber: "L20846",
        year: 2020,
        make: "Toyota",
        model: "RAV4",
        trim: "XLE Premium",
        price: 27800,
        mileage: 65399,
        vin: "2T3N1RFV4LC123456",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Silver",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "9",
        stockNumber: "M21027",
        year: 2019,
        make: "Ford",
        model: "F-150",
        trim: "Lariat SuperCrew",
        price: 38900,
        mileage: 163076,
        vin: "1FTEW1E89KF123456",
        image: "https://images.unsplash.com/photo-1587981118728-1f01be1c4ece?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "Black",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "10",
        stockNumber: "M19928",
        year: 2022,
        make: "Tesla",
        model: "Model 3",
        trim: "Long Range AWD",
        price: 42500,
        mileage: 76762,
        vin: "5YJ3E1EA8NF123456",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Blue",
        transmission: "Automatic",
        fuelType: "Electric",
    },
    {
        id: "11",
        stockNumber: "L21076",
        year: 2020,
        make: "Lexus",
        model: "RX 350",
        trim: "F Sport",
        price: 41200,
        mileage: 63225,
        vin: "2T2BZMCA4LC123456",
        image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "White",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
    {
        id: "12",
        stockNumber: "L20301",
        year: 2021,
        make: "Jeep",
        model: "Grand Cherokee",
        trim: "Limited 4WD",
        price: 36900,
        mileage: 69682,
        vin: "1C4RJFBG9MC123456",
        image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Gray",
        transmission: "Automatic",
        fuelType: "Gasoline",
    },
]

// Mock shipping calculation
function calculateShipping(formData: ShippingQuoteFormData, vehicles: Vehicle[]): QuoteCalculation {
    // Base price calculation based on ZIP code (mock logic)
    const zipCode = parseInt(formData.zipCode)
    const distanceFactor = Math.abs(zipCode - 84791) / 1000 // Utah ZIP is ~84791
    const baseShippingPrice = 500 + (distanceFactor * 200)

    const quotes: Record<string, ShippingQuote> = {}

    vehicles.forEach(vehicle => {
        const vehicleBasePrice = baseShippingPrice
        const enclosedFee = formData.enclosedTrailer ? 300 : 0
        const inoperableFee = formData.vehicleInoperable ? 200 : 0
        const totalPrice = vehicleBasePrice + enclosedFee + inoperableFee

        quotes[vehicle.id] = {
            vehicleId: vehicle.id,
            basePrice: vehicleBasePrice,
            enclosedTrailerFee: enclosedFee,
            inoperableFee: inoperableFee,
            totalPrice: Math.round(totalPrice),
            estimatedDays: "5-7 business days",
        }
    })

    return { quotes, formData }
}

export default function InventoryPublicPage() {
    const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [quoteCalculation, setQuoteCalculation] = React.useState<QuoteCalculation | null>(null)

    const handleGetQuote = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setIsModalOpen(true)
    }

    const handleCalculateAll = () => {
        setSelectedVehicle(null)
        setIsModalOpen(true)
    }

    const handleCalculate = (formData: ShippingQuoteFormData) => {
        const calculation = calculateShipping(formData, mockVehicles)
        setQuoteCalculation(calculation)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">
                            Premium Pre-Owned Vehicles
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Explore our curated selection of quality vehicles. Get instant shipping quotes to your location.
                        </p>
                        <div className="pt-4">
                            <Button
                                size="lg"
                                onClick={handleCalculateAll}
                                className="gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <TruckIcon className="w-5 h-5" />
                                Calculate Shipping Quote
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{mockVehicles.length}</span> vehicles
                            {quoteCalculation && (
                                <span className="ml-2 text-primary">
                                    • Shipping to {quoteCalculation.formData.zipCode}
                                </span>
                            )}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FilterIcon className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                {/* Vehicle Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockVehicles.map((vehicle) => (
                        <CarInventoryCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            shippingPrice={quoteCalculation?.quotes[vehicle.id]?.totalPrice}
                            onGetQuote={handleGetQuote}
                        />
                    ))}
                </div>
            </div>

            {/* Shipping Quote Modal */}
            <ShippingQuoteModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                vehicle={selectedVehicle}
                onCalculate={handleCalculate}
            />
        </div>
    )
}
