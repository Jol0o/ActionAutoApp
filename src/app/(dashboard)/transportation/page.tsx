"use client"

import * as React from "react"
import {
    Truck,
    Search,
    Phone,
    X,
    MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"

interface Quote {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    vehicleId?: {
        _id: string
        year: number
        make: string
        modelName: string
        vin: string
        stockNumber: string
    }
    vehicleName?: string
    vehicleImage?: string
    vin?: string
    stockNumber?: string
    vehicleLocation?: string
    fromZip: string
    toZip: string
    fromAddress: string
    toAddress: string
    units: number
    enclosedTrailer: boolean
    vehicleInoperable: boolean
    miles: number
    rate: number
    eta: { min: number; max: number }
    status: string
    createdAt: string
}

interface Shipment {
    _id: string
    quoteId: Quote
    status: 'Available for Pickup' | 'Cancelled' | 'Delivered' | 'Dispatched' | 'In-Route'
    origin: string
    destination: string
    requestedPickupDate: string
    scheduledPickup?: string
    pickedUp?: string
    scheduledDelivery?: string
    delivered?: string
    trackingNumber?: string
    createdAt: string
}

export default function TransportationPage() {
    const [activeTab, setActiveTab] = React.useState("shipments")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("all")
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const [shipments, setShipments] = React.useState<Shipment[]>([])
    const [quotes, setQuotes] = React.useState<Quote[]>([])
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
    const [stats, setStats] = React.useState({
        all: 0,
        'Available for Pickup': 0,
        'Cancelled': 0,
        'Delivered': 0,
        'Dispatched': 0,
        'In-Route': 0
    })

    // Fetch data on mount
    React.useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            // Fetch all data in parallel
            const [shipmentsRes, quotesRes, vehiclesRes, statsRes] = await Promise.all([
                apiClient.get('/api/shipments'),
                apiClient.get('/api/quotes'),
                apiClient.get('/api/vehicles'),
                apiClient.get('/api/shipments/stats') // ✅ FIXED: Use correct stats endpoint
            ])

            // ✅ FIXED: Handle ApiResponse structure consistently
            const extractData = (response: any) => {
                // Handle both { data: { data: [...] } } and { data: [...] }
                if (response.data?.data !== undefined) {
                    return response.data.data
                }
                return response.data
            }

            setShipments(extractData(shipmentsRes) || [])
            setQuotes(extractData(quotesRes) || [])
            
            // ✅ FIXED: Transform vehicles to match frontend interface
            const vehicleData = extractData(vehiclesRes) || []
            const transformedVehicles = vehicleData.map((v: any) => ({
                id: v.id || v._id?.toString() || v._id,
                stockNumber: v.stockNumber || 'N/A',
                year: v.year,
                make: v.make,
                model: v.model || v.modelName, // ✅ Handle both model and modelName
                trim: v.trim || '',
                price: v.price || 0,
                mileage: v.mileage || 0,
                vin: v.vin,
                image: v.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
                location: v.location || 'Unknown',
                color: v.color || 'N/A',
                transmission: v.transmission || 'Automatic',
                fuelType: v.fuelType || 'Gasoline'
            }))
            
            console.log('✅ Vehicles loaded:', transformedVehicles.length, transformedVehicles)
            setVehicles(transformedVehicles)

            // ✅ FIXED: Handle stats properly
            const statsData = extractData(statsRes)
            if (statsData && typeof statsData === 'object') {
                setStats(statsData)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to load data'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCalculateQuote = async (formData: ShippingQuoteFormData) => {
        try {
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

            // ✅ FIXED: Handle response structure
            const data = response.data?.data || response.data
            await fetchData() // Refresh data
            alert(`Quote created! Rate: $${data.rate}, ETA: ${data.eta.min}-${data.eta.max} days`)
        } catch (error) {
            console.error('Error creating quote:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            alert('Failed to create quote: ' + errorMessage)
        }
    }

    const handleCreateShipment = async (quoteId: string) => {
        try {
            await apiClient.post('/api/shipments', { quoteId })
            await fetchData()
            alert('Shipment created successfully!')
        } catch (error) {
            console.error('Error creating shipment:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            alert('Failed to create shipment: ' + errorMessage)
        }
    }

    const filteredShipments = React.useMemo(() => {
        let filtered = shipments

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(s => s.status === selectedStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(s => {
                const quote = s.quoteId
                return (
                    quote?.firstName?.toLowerCase().includes(query) ||
                    quote?.lastName?.toLowerCase().includes(query) ||
                    quote?.vin?.toLowerCase().includes(query) ||
                    quote?.stockNumber?.toLowerCase().includes(query) ||
                    s.trackingNumber?.toLowerCase().includes(query)
                )
            })
        }

        return filtered
    }, [shipments, selectedStatus, searchQuery])

    // ✅ FIXED: Better error state
    if (error && !isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Data</h3>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchData} className="bg-green-500 hover:bg-green-600">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-green-500 p-1.5 sm:p-2 rounded">
                                <Truck className="size-4 sm:size-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                                    Transportation Management
                                </h1>
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 sm:gap-2 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4"
                                onClick={() => setActiveTab("drafts")}
                            >
                                <span>VIEW QUOTES</span>
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4"
                                onClick={() => setIsQuoteModalOpen(true)}
                            >
                                <span>START A QUOTE</span>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-gray-400" />
                            <Input 
                                placeholder="Search by name, VIN, stock, or tracking number..." 
                                className="pl-8 sm:pl-10 w-full text-sm h-8 sm:h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 sm:w-72 md:w-80 lg:w-64 bg-white border-r min-h-screen p-4 sm:p-5 md:p-6
                    transform transition-transform duration-300 ease-in-out
                    overflow-y-auto
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-8 sm:h-10">
                            <TabsTrigger value="shipments" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2">
                                <Truck className="size-2.5 sm:size-3 mr-0.5 sm:mr-1" />
                                <span>SHIPMENTS</span>
                            </TabsTrigger>
                            <TabsTrigger value="drafts" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2">
                                QUOTES
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-1.5 sm:space-y-2">
                        <button
                            onClick={() => {
                                setSelectedStatus('all')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'all' ? 'bg-yellow-50 text-yellow-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-sm"></span>
                                <span className="truncate">Show All</span>
                            </span>
                            <span className="text-gray-500 ml-2">{stats.all}</span>
                        </button>
                        
                        {Object.entries(stats).map(([status, count]) => {
                            if (status === 'all') return null
                            const colorMap: Record<string, string> = {
                                'Available for Pickup': 'yellow',
                                'Cancelled': 'red',
                                'Delivered': 'green',
                                'Dispatched': 'blue',
                                'In-Route': 'blue'
                            }
                            const color = colorMap[status] || 'gray'
                            
                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setSelectedStatus(status)
                                        setIsSidebarOpen(false)
                                    }}
                                    className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                        selectedStatus === status ? `bg-${color}-50 text-${color}-700` : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5 sm:gap-2">
                                        <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 bg-${color}-500 rounded-sm`}></span>
                                        <span className="truncate">{status}</span>
                                    </span>
                                    <span className="text-gray-500 ml-2">{count}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t">
                        <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Having Transportation Issues?</p>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                            <a href="mailto:support@example.com" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:underline break-all">
                                <span className="break-all">support@example.com</span>
                            </a>
                            <a href="tel:8554316570" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:underline">
                                <Phone className="size-3.5 sm:size-4" />
                                (855) 431-6570
                            </a>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-3 sm:p-4 md:p-6">
                    {activeTab === "shipments" ? (
                        isLoading ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <p>Loading shipments...</p>
                                </CardContent>
                            </Card>
                        ) : filteredShipments.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                    <Truck className="size-10 sm:size-12 md:size-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">
                                        No Shipments Found
                                    </h3>
                                    <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4 sm:mb-6 px-2 sm:px-4">
                                        {searchQuery 
                                            ? "No shipments match your search criteria."
                                            : "You don't have any shipments yet. Start by creating a quote."}
                                    </p>
                                    <Button 
                                        className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                                        onClick={() => setIsQuoteModalOpen(true)}
                                    >
                                        Create New Quote
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {filteredShipments.map((shipment) => (
                                    <ShipmentCard key={shipment._id} shipment={shipment} />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {quotes.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <h3 className="text-lg font-medium mb-2">No Quotes Found</h3>
                                        <p className="text-sm text-gray-500 mb-6">Create a new quote to get started.</p>
                                        <Button 
                                            className="bg-green-500 hover:bg-green-600"
                                            onClick={() => setIsQuoteModalOpen(true)}
                                        >
                                            Create Quote
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                quotes.map((quote) => (
                                    <QuoteCard 
                                        key={quote._id} 
                                        quote={quote}
                                        onCreateShipment={handleCreateShipment}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ShippingQuoteModal
                open={isQuoteModalOpen}
                onOpenChange={setIsQuoteModalOpen}
                vehicles={vehicles}
                onCalculate={handleCalculateQuote}
            />
        </div>
    )
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
    const quote = shipment.quoteId
    const vehicle = quote?.vehicleId
    const vehicleName = vehicle 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
        : quote?.vehicleName || 'N/A'

    const formatDate = (date?: string) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString()
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4">
                    <div className="md:col-span-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 font-semibold">VEHICLE INFO</p>
                        {quote?.vehicleImage && (
                            <img 
                                src={quote.vehicleImage} 
                                alt={vehicleName} 
                                className="w-full h-32 sm:h-36 md:h-32 object-cover rounded mb-2" 
                            />
                        )}
                        <p className="font-medium text-xs sm:text-sm">{vehicleName}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">VIN: {vehicle?.vin || quote?.vin || 'N/A'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                            Stock: {vehicle?.stockNumber || quote?.stockNumber || 'N/A'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                            Customer: {quote?.firstName} {quote?.lastName}
                        </p>
                    </div>
                    
                    <div className="md:col-span-6">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 font-semibold">SHIPMENT DETAILS</p>
                        <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                            <p className="font-medium">{shipment.origin} → {shipment.destination}</p>
                            <p className="text-gray-600 text-[10px] sm:text-xs">
                                Requested Pickup: {formatDate(shipment.requestedPickupDate)}
                            </p>
                            {shipment.scheduledPickup && (
                                <p className="text-gray-600 text-[10px] sm:text-xs">
                                    Scheduled Pickup: {formatDate(shipment.scheduledPickup)}
                                </p>
                            )}
                            {shipment.pickedUp && (
                                <p className="text-gray-600 text-[10px] sm:text-xs">
                                    Picked up: {formatDate(shipment.pickedUp)}
                                </p>
                            )}
                            {shipment.scheduledDelivery && (
                                <p className="text-gray-600 text-[10px] sm:text-xs">
                                    Scheduled Delivery: {formatDate(shipment.scheduledDelivery)}
                                </p>
                            )}
                            {shipment.delivered && (
                                <p className="text-gray-600 text-[10px] sm:text-xs">
                                    Delivered: {formatDate(shipment.delivered)}
                                </p>
                            )}
                            {shipment.trackingNumber && (
                                <p className="text-gray-600 text-[10px] sm:text-xs font-semibold">
                                    Tracking: {shipment.trackingNumber}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="md:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-between">
                        <Badge className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 ${
                            shipment.status === 'Available for Pickup' ? 'bg-yellow-100 text-yellow-700' :
                            shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            shipment.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {shipment.status}
                        </Badge>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="size-4 sm:size-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function QuoteCard({ quote, onCreateShipment }: { quote: Quote; onCreateShipment: (id: string) => void }) {
    const vehicle = quote.vehicleId
    const vehicleName = vehicle 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
        : quote.vehicleName || 'N/A'

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-semibold">{quote.firstName} {quote.lastName}</h3>
                        <p className="text-sm text-gray-500">{quote.email} • {quote.phone}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                        <p className="text-gray-500 text-xs">Vehicle</p>
                        <p className="font-medium">{vehicleName}</p>
                        {(vehicle?.vin || quote.vin) && (
                            <p className="text-xs text-gray-500">VIN: {vehicle?.vin || quote.vin}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Route</p>
                        <p className="font-medium">{quote.fromAddress} → {quote.toAddress}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Rate</p>
                        <p className="font-medium">${quote.rate.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">ETA</p>
                        <p className="font-medium">{quote.eta.min}-{quote.eta.max} days</p>
                    </div>
                </div>

                <Button 
                    size="sm" 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => onCreateShipment(quote._id)}
                >
                    Create Shipment
                </Button>
            </CardContent>  
        </Card>
    )
}