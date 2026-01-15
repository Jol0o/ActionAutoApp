"use client"

import * as React from "react"
import {
    Truck,
    MapPin,
    Navigation,
    Search,
    Plus,
    MoreVertical,
    Phone,
    Mail,
    X,
    Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Shipment {
    id: string
    vehicle: string
    vin: string
    stock: string
    route: string
    status: string
    requestedDate: string
    image?: string
    scheduledPickup?: string
    pickedUp?: string
    scheduledDelivery?: string
    delivered?: string
}

export default function TransportationPage() {
    const [activeTab, setActiveTab] = React.useState("shipments")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("all")
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    
    // Replace with actual data from your backend
    const shipments: Shipment[] = []
    const draftShipments: Shipment[] = []
    
    const statusCounts = {
        all: shipments.length,
        pickup: shipments.filter(s => s?.status === 'Available for Pickup').length,
        cancelled: shipments.filter(s => s?.status === 'Cancelled').length,
        delivered: shipments.filter(s => s?.status === 'Delivered').length,
        dispatched: shipments.filter(s => s?.status === 'Dispatched').length,
        inroute: shipments.filter(s => s?.status === 'In-Route').length
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
                                    Transportation by ACERTUS
                                </h1>
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4">
                                <span>SHIP VEHICLES</span>
                            </Button>
                            <Button size="sm" className="gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4">
                                <span>START A QUOTE</span>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-gray-400" />
                            <Input 
                                placeholder="Search Shipping Orders ..." 
                                className="pl-8 sm:pl-10 w-full text-sm h-8 sm:h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:flex items-center gap-3 lg:gap-4">
                            <div className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                                Rows: <select className="border rounded px-1.5 lg:px-2 py-0.5 lg:py-1 ml-1 text-xs lg:text-sm">
                                    <option>10</option>
                                    <option>25</option>
                                    <option>50</option>
                                </select>
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                                1-1 of 1
                            </div>
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
                    {/* Close button for mobile */}
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
                                DRAFTS
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
                            <span className="text-gray-500 ml-2">{statusCounts.all}</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                setSelectedStatus('pickup')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'pickup' ? 'bg-yellow-50 text-yellow-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-sm"></span>
                                <span className="truncate">Available for Pickup</span>
                            </span>
                            <span className="text-gray-500 ml-2">{statusCounts.pickup}</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedStatus('cancelled')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'cancelled' ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-sm"></span>
                                <span className="truncate">Cancelled</span>
                            </span>
                            <span className="text-gray-500 ml-2">{statusCounts.cancelled}</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedStatus('delivered')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'delivered' ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-sm"></span>
                                <span className="truncate">Delivered</span>
                            </span>
                            <span className="text-gray-500 ml-2">{statusCounts.delivered}</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedStatus('dispatched')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'dispatched' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-sm"></span>
                                <span className="truncate">Dispatched</span>
                            </span>
                            <span className="text-gray-500 ml-2">{statusCounts.dispatched}</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedStatus('inroute')
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm ${
                                selectedStatus === 'inroute' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-sm"></span>
                                <span className="truncate">In-Route</span>
                            </span>
                            <span className="text-gray-500 ml-2">{statusCounts.inroute}</span>
                        </button>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t">
                        <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Having Transportation Issues?</p>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                            <a href="mailto:carketech@acertusdelivers.com" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:underline break-all">
                                <span className="break-all">carketech@acertusdelivers.com</span>
                            </a>
                            <a href="tel:8554316570" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:underline">
                                <Phone className="size-3.5 sm:size-4" />
                                (855) 431-6570
                            </a>
                        </div>
                        <a href="#" className="text-xs sm:text-sm text-green-600 hover:underline mt-3 sm:mt-4 block">
                            FAQ'S
                        </a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-3 sm:p-4 md:p-6">
                    {shipments.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                <Truck className="size-10 sm:size-12 md:size-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">No Shipments Found</h3>
                                <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4 sm:mb-6 px-2 sm:px-4">
                                    {searchQuery 
                                        ? "No shipments match your search criteria."
                                        : "You don't have any shipments yet. Start by creating a new shipment."}
                                </p>
                                <Button className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm h-8 sm:h-9 md:h-10">
                                    <Plus className="size-3 sm:size-4 mr-1 sm:mr-2" />
                                    Create New Shipment
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {shipments.map((shipment) => (
                                <ShipmentCard key={shipment.id} shipment={shipment} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4">
                    <div className="md:col-span-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 font-semibold">VEHICLE INFO</p>
                        {shipment.image && (
                            <img src={shipment.image} alt={shipment.vehicle} className="w-full h-32 sm:h-36 md:h-32 object-cover rounded mb-2" />
                        )}
                        <p className="font-medium text-xs sm:text-sm">{shipment.vehicle}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">VIN: {shipment.vin}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Stock#: {shipment.stock}</p>
                    </div>
                    
                    <div className="md:col-span-6">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 font-semibold">SHIPMENTS</p>
                        <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                            <p className="font-medium">{shipment.route}</p>
                            <p className="text-gray-600 text-[10px] sm:text-xs">Requested Pickup Date: {shipment.requestedDate}</p>
                            {shipment.scheduledPickup && <p className="text-gray-600 text-[10px] sm:text-xs">Scheduled Pickup: {shipment.scheduledPickup}</p>}
                            {shipment.pickedUp && <p className="text-gray-600 text-[10px] sm:text-xs">Picked up: {shipment.pickedUp}</p>}
                            {shipment.scheduledDelivery && <p className="text-gray-600 text-[10px] sm:text-xs">Scheduled Delivery: {shipment.scheduledDelivery}</p>}
                            {shipment.delivered && <p className="text-gray-600 text-[10px] sm:text-xs">Delivered: {shipment.delivered}</p>}
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