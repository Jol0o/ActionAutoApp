// components/ShipmentCard.tsx

import { MapPin, Truck, Download, Package, Calendar, CheckCircle, Clock, ArrowRight, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shipment } from "@/types/transportation"
import { useState } from "react"
import { useAlert } from "@/components/AlertDialog"

interface ShipmentCardProps {
    shipment: Shipment
    onDelete: (id: string) => void
}

export function ShipmentCard({ shipment, onDelete }: ShipmentCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const { showAlert, hideAlert, AlertComponent } = useAlert()
    
    // Get quote data from either the quote reference or preserved data
    const quote = shipment.quoteId || shipment.preservedQuoteData
    const vehicle = quote?.vehicleId
    const vehicleName = vehicle 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
        : quote?.vehicleName || 'N/A'

    const formatDate = (date?: string) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }

    const handleDelete = async () => {
        const customerName = quote ? `${quote.firstName} ${quote.lastName}` : 'this customer'
        showAlert({
            type: "confirm",
            title: "Delete Shipment",
            message: `Are you sure you want to delete the shipment for ${customerName}? This action cannot be undone and the quote will be restored to "accepted" status.`,
            confirmText: "Yes, Delete",
            cancelText: "No, Keep Shipment",
            onConfirm: async () => {
                setIsDeleting(true)
                try {
                    await onDelete(shipment._id)
                    showAlert({
                        type: "success",
                        title: "Shipment Deleted",
                        message: "The shipment has been successfully deleted and the quote has been restored."
                    })
                } catch (error) {
                    console.error('Error deleting shipment:', error)
                    showAlert({
                        type: "error",
                        title: "Error",
                        message: "Failed to delete shipment. Please try again."
                    })
                    setIsDeleting(false)
                }
            }
        })
    }

    const getStatusConfig = () => {
        switch(shipment.status) {
            case 'Available for Pickup':
                return { 
                    color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
                    dotColor: 'bg-yellow-500',
                    textColor: 'text-yellow-700'
                }
            case 'Delivered':
                return { 
                    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
                    dotColor: 'bg-green-500',
                    textColor: 'text-green-700'
                }
            case 'Cancelled':
                return { 
                    color: 'bg-gradient-to-r from-red-500 to-rose-500',
                    dotColor: 'bg-red-500',
                    textColor: 'text-red-700'
                }
            case 'In-Route':
                return { 
                    color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                    dotColor: 'bg-blue-500',
                    textColor: 'text-blue-700'
                }
            case 'Dispatched':
                return { 
                    color: 'bg-gradient-to-r from-purple-500 to-violet-500',
                    dotColor: 'bg-purple-500',
                    textColor: 'text-purple-700'
                }
            default:
                return { 
                    color: 'bg-gradient-to-r from-gray-500 to-slate-500',
                    dotColor: 'bg-gray-500',
                    textColor: 'text-gray-700'
                }
        }
    }

    const statusConfig = getStatusConfig()

    return (
        <div className="flex justify-center">
            <AlertComponent />
            <Card className="border border-gray-200 hover:shadow-2xl transition-all duration-500 overflow-hidden group max-w-5xl w-full">
                <CardContent className="p-0">
                    <div className="grid grid-cols-12">
                        {/* Left Section - Vehicle Image & Info */}
                        <div className="col-span-12 lg:col-span-5 relative overflow-hidden">
                            {quote?.vehicleImage ? (
                                <div className="relative h-full min-h-[350px]">
                                    <img 
                                        src={quote.vehicleImage} 
                                        alt={vehicleName} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                                    />
                                    {/* Multi-layer gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
                                    
                                    {/* Tracking number badge */}
                                    {shipment.trackingNumber && (
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 shadow-lg border border-white/20">
                                                <Package className="w-3 h-3 mr-1.5" />
                                                {shipment.trackingNumber}
                                            </Badge>
                                        </div>
                                    )}
                                    
                                    {/* Vehicle info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <div className="backdrop-blur-md bg-black/30 rounded-xl p-5 border border-white/10">
                                            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                                {vehicleName}
                                            </h2>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-300 text-xs mb-0.5">VIN Number</span>
                                                    <span className="font-semibold">{vehicle?.vin || quote?.vin || 'N/A'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-300 text-xs mb-0.5">Stock #</span>
                                                    <span className="font-semibold">{vehicle?.stockNumber || quote?.stockNumber || 'N/A'}</span>
                                                </div>
                                            </div>
                                            {quote?.vehicleLocation && (
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                                                    <MapPin className="w-4 h-4 text-blue-400" />
                                                    <span className="text-sm">{quote.vehicleLocation}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[350px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <Package className="w-20 h-20 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Right Section - Shipment Details */}
                        <div className="col-span-12 lg:col-span-7 p-6 bg-gradient-to-br from-white to-gray-50">
                            {/* Header with Status & Actions */}
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                                <div className="flex-1">
                                    <Badge className={`${statusConfig.color} text-white px-4 py-1.5 text-sm font-semibold shadow-lg mb-3`}>
                                        <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                                        {shipment.status}
                                    </Badge>
                                    
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Customer:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {quote?.firstName} {quote?.lastName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                Added {formatDate(shipment.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 text-xs border-gray-300 hover:bg-gray-100 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export PDF
                                </Button>
                            </div>

                            {/* Pricing Information */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Transport Rate</span>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-green-700">${quote?.rate?.toLocaleString() || 'N/A'}</span>
                                    <span className="text-sm text-gray-600">USD</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                    90-Day Trend: <span className="font-semibold text-green-600">${quote?.rate?.toLocaleString() || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Route Information */}
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    Route Details
                                </h3>
                                
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex flex-col items-center gap-2 mt-1">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                                                    <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-red-500"></div>
                                                    <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Origin</p>
                                                        <p className="font-semibold text-gray-900">{shipment.origin}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Destination</p>
                                                        <p className="font-semibold text-gray-900">{shipment.destination}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    Shipment Timeline
                                </h3>
                                
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Requested Pickup</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.requestedPickupDate)}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Scheduled Pickup</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.scheduledPickup)}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Picked Up</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.pickedUp)}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Scheduled Delivery</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.scheduledDelivery)}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100 col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Delivered</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.delivered)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transport Details */}
                            <div className="flex items-center gap-2 mb-4 bg-white rounded-lg p-3 border border-gray-200">
                                <Truck className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Transport Method</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {quote?.enclosedTrailer ? 'Enclosed Trailer' : 'Open Trailer'}
                                    </p>
                                </div>
                                {quote?.vehicleInoperable && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                        Inoperable
                                    </Badge>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button 
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300"
                                    size="lg"
                                >
                                    Edit Details
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="border-gray-300 hover:bg-gray-100"
                                    size="lg"
                                >
                                    View History
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    size="lg"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}