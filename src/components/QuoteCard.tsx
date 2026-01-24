import { Check, ChevronDown, MapPin, Calendar, Package, Clock, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Quote } from "@/types/transportation"
import { useState } from "react"
import { useAlert } from "@/components/AlertDialog"
import { EditQuoteModal } from "./EditQuoteModal"

interface QuoteCardProps {
    quote: Quote
    onCreateShipment: (id: string) => Promise<boolean | void>
    onDelete: (id: string) => void
    onUpdate: (id: string, updatedQuote: Partial<Quote>) => Promise<void>
}

export function QuoteCard({ quote, onCreateShipment, onDelete, onUpdate }: QuoteCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isCreatingShipment, setIsCreatingShipment] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const { showAlert, hideAlert, AlertComponent } = useAlert()

    const vehicle = quote.vehicleId
    const vehicleName = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
        : quote.vehicleName || 'N/A'

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleCreateShipment = async () => {
        showAlert({
            type: "confirm",
            title: "Create Shipment",
            message: `Are you sure you want to create a shipment for ${quote.firstName} ${quote.lastName}? This quote will be moved to shipments and removed from the quotes list.`,
            confirmText: "Yes, Create Shipment",
            cancelText: "No, Cancel",
            onConfirm: async () => {
                setIsCreatingShipment(true)
                try {
                    await onCreateShipment(quote._id)
                    showAlert({
                        type: "success",
                        title: "Shipment Created",
                        message: "The shipment has been created successfully and the quote has been moved to shipments."
                    })
                } catch (error) {
                    console.error('Error creating shipment:', error)
                    showAlert({
                        type: "error",
                        title: "Error",
                        message: "Failed to create shipment. Please try again."
                    })
                    setIsCreatingShipment(false)
                }
            }
        })
    }

    const handleDelete = async () => {
        showAlert({
            type: "confirm",
            title: "Delete Quote",
            message: `Are you sure you want to delete this quote for ${quote.firstName} ${quote.lastName}? This action cannot be undone.`,
            confirmText: "Yes, Delete",
            cancelText: "No, Keep Quote",
            onConfirm: async () => {
                setIsDeleting(true)
                try {
                    await onDelete(quote._id)
                    showAlert({
                        type: "success",
                        title: "Quote Deleted",
                        message: "The quote has been successfully deleted."
                    })
                } catch (error) {
                    console.error('Error deleting quote:', error)
                    showAlert({
                        type: "error",
                        title: "Error",
                        message: "Failed to delete quote. Please try again."
                    })
                    setIsDeleting(false)
                }
            }
        })
    }

    const handleSaveEdit = async (updatedQuote: Partial<Quote>) => {
        await onUpdate(quote._id, updatedQuote)
        showAlert({
            type: "success",
            title: "Quote Updated",
            message: "The quote has been successfully updated."
        })
    }

    return (
        <>
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <AlertComponent />
                <CardContent className="p-0">
                    <div className="grid grid-cols-12">
                        {/* Left Section - Vehicle Info */}
                        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-gray-50 to-white p-6 border-r border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Vehicle Info</h3>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Ready
                                </Badge>
                            </div>

                            {quote.vehicleImage && (
                                <div className="mb-4 relative group">
                                    <img
                                        src={quote.vehicleImage}
                                        alt={vehicleName}
                                        className="w-full h-40 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <p className="text-base font-semibold text-gray-900">{vehicleName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {quote.vehicleLocation && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {quote.vehicleLocation}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-3 border-t border-gray-100">
                                    {(vehicle?.vin || quote.vin) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">VIN</span>
                                            <span className="text-xs font-medium text-gray-700">{vehicle?.vin || quote.vin}</span>
                                        </div>
                                    )}
                                    {(vehicle?.stockNumber || quote.stockNumber) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Stock #</span>
                                            <span className="text-xs font-medium text-gray-700">{vehicle?.stockNumber || quote.stockNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <div className="bg-green-50 rounded-lg p-3 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Quote Rate</span>
                                            <span className="text-lg font-bold text-green-700">${quote.rate.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">ETA</span>
                                            <span className="text-xs font-medium text-gray-700">{quote.eta.min}-{quote.eta.max} days</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 flex items-center gap-1 pt-2">
                                    <Calendar className="w-3 h-3" />
                                    Added {formatDate(quote.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Shipment Details */}
                        <div className="col-span-12 lg:col-span-8 p-6 bg-white">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Shipment Details</h3>
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200">
                                    Pending Assignment
                                </Badge>
                            </div>

                            <div className="space-y-5">
                                {/* Customer & Route Info */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                Customer
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">{quote.firstName} {quote.lastName}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{quote.email}</p>
                                            <p className="text-xs text-gray-600">{quote.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                Route
                                            </p>
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{quote.fromAddress}</p>
                                                        <p className="text-xs text-gray-500">{quote.fromZip}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-1">
                                                    <div className="w-px h-4 bg-gray-300"></div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{quote.toAddress}</p>
                                                        <p className="text-xs text-gray-500">{quote.toZip}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipment Options */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Transport Type</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {quote.enclosedTrailer ? 'Enclosed' : 'Open'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Vehicle Status</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {quote.vehicleInoperable ? 'Inoperable' : 'Operable'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Units</p>
                                        <p className="text-sm font-semibold text-gray-900">{quote.units}</p>
                                    </div>
                                </div>

                                {/* Timeline Status */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Shipment Timeline
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Requested Pickup</p>
                                            <p className="text-xs font-medium text-gray-900">{formatDate(quote.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Scheduled Pickup</p>
                                            <p className="text-xs font-medium text-gray-400">Pending</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Scheduled Delivery</p>
                                            <p className="text-xs font-medium text-gray-400">Pending</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Estimated Miles</p>
                                            <p className="text-xs font-medium text-gray-900">{quote.miles} mi</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                                        onClick={handleCreateShipment}
                                        disabled={isCreatingShipment || isDeleting}
                                    >
                                        {isCreatingShipment ? 'Creating...' : 'Create Shipment'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-gray-300 hover:bg-gray-50"
                                        onClick={() => setIsEditModalOpen(true)}
                                        disabled={isCreatingShipment || isDeleting}
                                    >
                                        Edit Quote
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleDelete}
                                        disabled={isDeleting || isCreatingShipment}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EditQuoteModal
                quote={quote}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEdit}
            />
        </>
    )
}