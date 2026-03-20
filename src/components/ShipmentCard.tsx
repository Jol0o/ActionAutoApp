import { MapPin, Truck, Download, Package, Calendar, CheckCircle, Clock, ArrowRight, Trash2, Mail, User, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shipment } from "@/types/transportation"
import * as React from "react"
import { useAlert, AlertDialog } from "@/components/AlertDialog"
import { EditShipmentModal } from "./EditShipmentModal"
import { generateShipmentPDF } from "@/utils/pdfGenerator"

interface ShipmentCardProps {
    shipment: Shipment
    onDelete: (id: string) => void | Promise<void>
    onUpdate?: (id: string, updatedShipment: Partial<Shipment>) => Promise<void>
}

interface ShipmentCardInnerProps {
    shipment: Shipment
    isDeleting: boolean
    isGeneratingPDF: boolean
    isEditModalOpen: boolean
    setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>
    onDeleteClick: () => void
    onSendEmailClick: () => void
    onExportPDFClick: () => void
    onSaveEdit: (updatedShipment: Partial<Shipment>) => Promise<void>
    onUpdate?: (id: string, updatedShipment: Partial<Shipment>) => Promise<void>
}

// Memoized heavy card body — isolated from alert state so it does NOT re-render
// when the confirmation dialog opens/closes, keeping the delete button snappy.
const ShipmentCardInner = React.memo(function ShipmentCardInner({
    shipment,
    isDeleting,
    isGeneratingPDF,
    isEditModalOpen,
    setIsEditModalOpen,
    onDeleteClick,
    onSendEmailClick,
    onExportPDFClick,
    onSaveEdit,
    onUpdate,
}: ShipmentCardInnerProps) {
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

    const getStatusConfig = () => {
        switch (shipment.status) {
            case 'Available for Pickup':
                return { color: 'bg-gradient-to-r from-yellow-500 to-amber-500', dotColor: 'bg-yellow-500', textColor: 'text-yellow-700' }
            case 'Delivered':
                return { color: 'bg-gradient-to-r from-green-500 to-emerald-500', dotColor: 'bg-green-500', textColor: 'text-green-700' }
            case 'Cancelled':
                return { color: 'bg-gradient-to-r from-red-500 to-rose-500', dotColor: 'bg-red-500', textColor: 'text-red-700' }
            case 'In-Route':
                return { color: 'bg-gradient-to-r from-blue-500 to-indigo-500', dotColor: 'bg-blue-500', textColor: 'text-blue-700' }
            case 'Dispatched':
                return { color: 'bg-gradient-to-r from-purple-500 to-violet-500', dotColor: 'bg-purple-500', textColor: 'text-purple-700' }
            default:
                return { color: 'bg-gradient-to-r from-gray-500 to-slate-500', dotColor: 'bg-gray-500', textColor: 'text-gray-700' }
        }
    }

    const statusConfig = getStatusConfig()

    return (
        <div className="flex justify-center">
            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden group max-w-4xl w-full">
                <CardContent className="p-0">
                    {/* Top Section - Vehicle Image */}
                    <div className="relative overflow-hidden w-full">
                        {quote?.vehicleImage ? (
                            <div className="relative w-full h-40 sm:h-56 md:h-64">
                                <img
                                    src={quote.vehicleImage}
                                    alt={vehicleName}
                                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                <div className="absolute top-2 left-2 right-2 flex items-start justify-between flex-wrap gap-1.5">
                                    {shipment.trackingNumber && (
                                        <Badge className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 px-2 py-0.5 shadow-lg text-[10px] sm:text-xs">
                                            <Package className="w-3 h-3 mr-1" />
                                            {shipment.trackingNumber}
                                        </Badge>
                                    )}
                                    <Badge className={`${statusConfig.color} text-white px-2 py-0.5 text-[10px] sm:text-xs font-semibold shadow-lg ml-auto`}>
                                        <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
                                        {shipment.status}
                                    </Badge>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
                                    <div className="backdrop-blur-md bg-black/40 rounded-lg p-2 sm:p-3 border border-white/10">
                                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-sm sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 truncate">{vehicleName}</h2>
                                                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-300">VIN</span>
                                                        <span className="font-medium truncate">{vehicle?.vin || quote?.vin || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-300">Stock #</span>
                                                        <span className="font-medium">{vehicle?.stockNumber || quote?.stockNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {quote?.vehicleLocation && (
                                                <div className="flex items-center gap-1.5 pt-1 sm:pt-0 sm:pl-3 sm:border-l sm:border-white/20">
                                                    <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span className="text-[10px] sm:text-xs truncate">{quote.vehicleLocation}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-32 sm:h-56 md:h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Bottom Section */}
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-3">
                            <div className="flex-1">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Customer:</span>
                                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {quote?.firstName} {quote?.lastName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500" />
                                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                            Added {formatDate(shipment.createdAt)}
                                        </span>
                                    </div>
                                    {shipment.organization && (
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500" />
                                            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                Organization: <span className="font-medium text-gray-700 dark:text-gray-300">{shipment.organization.name}</span>
                                            </span>
                                        </div>
                                    )}
                                    {shipment.createdBy && (
                                        <div className="flex items-center gap-1.5">
                                            {shipment.createdBy.avatar ? (
                                                <img
                                                    src={shipment.createdBy.avatar}
                                                    alt={shipment.createdBy.name || shipment.createdBy.email}
                                                    className="w-3.5 h-3.5 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                    <User className="w-2 h-2 text-green-600 dark:text-green-400" />
                                                </div>
                                            )}
                                            {shipment.createdBy.name || shipment.createdBy.email ? (
                                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                    By <span className="font-medium text-gray-700 dark:text-gray-300">{shipment.createdBy.name || shipment.createdBy.email}</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs text-red-400 dark:text-red-500 italic">
                                                    Deleted User
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 sm:h-9 px-2 sm:px-4 gap-1 sm:gap-1.5 text-[10px] sm:text-xs"
                                    onClick={onExportPDFClick}
                                    disabled={isGeneratingPDF}
                                >
                                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    {isGeneratingPDF ? '...' : 'Export'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 sm:h-9 px-2 sm:px-4 gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                                    onClick={onSendEmailClick}
                                >
                                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    Email
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-3 border border-green-200 dark:border-green-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Rate</span>
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">${quote?.rate?.toLocaleString() || 'N/A'}</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">USD</span>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Transport</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {quote?.enclosedTrailer ? 'Enclosed Trailer' : 'Open Trailer'}
                                        </p>
                                        {quote?.vehicleInoperable && (
                                            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs font-semibold">
                                                Inoperable
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                {/* Route */}
                                <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800 shadow-sm h-full">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        </div>
                                        <h3 className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Shipping Route</h3>
                                    </div>
                                    <div className="flex flex-col h-auto sm:h-[calc(100%-3rem)]">
                                        <div className="group mb-2 sm:mb-4">
                                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2.5 sm:p-4 border-2 border-green-300 dark:border-green-700 shadow-md transition-all">
                                                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-green-100 dark:ring-green-900">
                                                        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                                                    </div>
                                                    <span className="text-[8px] sm:text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide block leading-none">Starting Point</span>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-base leading-relaxed pl-1 truncate">{shipment.origin}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-center items-center py-1 sm:py-2">
                                            <div className="relative flex flex-col items-center gap-1 sm:gap-2">
                                                <div className="w-0.5 h-8 sm:h-16 bg-gradient-to-b from-green-400 via-blue-400 to-red-400 rounded-full shadow-lg relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
                                                </div>
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl ring-2 sm:ring-4 ring-blue-100 dark:ring-blue-900 animate-bounce">
                                                        <Truck className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="group mt-2 sm:mt-4">
                                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2.5 sm:p-4 border-2 border-red-300 dark:border-red-700 shadow-md transition-all">
                                                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-red-100 dark:ring-red-900">
                                                        <MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                                    </div>
                                                    <span className="text-[8px] sm:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide block leading-none">Final Stop</span>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-base leading-relaxed pl-1 truncate">{shipment.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-lg p-3 sm:p-4 border border-indigo-200 dark:border-indigo-800 shadow-sm h-full">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                                        <h3 className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Shipment Timeline</h3>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-green-300 dark:from-blue-700 dark:via-purple-700 dark:to-green-700"></div>
                                        <div className="space-y-2 sm:space-y-3 relative">
                                            {[
                                                { label: "Requested", date: shipment.requestedPickupDate, step: "Step 1", color: "blue" },
                                                { label: "Scheduled Pickup", date: shipment.scheduledPickup, step: "Step 2", color: "indigo" },
                                                { label: "Picked Up", date: shipment.pickedUp, step: "Step 3", color: "purple" },
                                                { label: "Est. Delivery", date: shipment.scheduledDelivery, step: "Step 4", color: "orange" },
                                                { label: "Delivered", date: shipment.delivered, step: "Complete", color: "green", icon: true }
                                            ].map((item, idx) => (
                                                <div key={idx} className="relative flex items-center gap-2 sm:gap-3 group">
                                                    <div className="relative z-10 flex-shrink-0">
                                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center shadow-md ring-2 sm:ring-4 ring-${item.color}-100 dark:ring-${item.color}-900 group-hover:ring-${item.color}-200 dark:group-hover:ring-${item.color}-800 transition-all`}>
                                                            {item.icon ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>}
                                                        </div>
                                                    </div>
                                                    <div className={`flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-${item.color}-200 dark:border-${item.color}-700 shadow-sm group-hover:shadow-md transition-all flex items-center justify-between`}>
                                                        <div className="min-w-0">
                                                            <p className={`text-[10px] sm:text-sm font-bold text-${item.color}-700 dark:text-${item.color}-400 leading-none mb-0.5 truncate`}>{item.label}</p>
                                                            <p className="text-[9px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 leading-none">{formatDate(item.date)}</p>
                                                        </div>
                                                        <span className={`text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-${item.color}-100 dark:bg-${item.color}-900 text-${item.color}-700 dark:text-${item.color}-300 rounded-full font-semibold shrink-0`}>
                                                            {item.step}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-end">
                            <Button
                                className="h-8 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] sm:text-xs px-2 sm:px-4"
                                size="sm"
                                onClick={() => setIsEditModalOpen(true)}
                                disabled={isDeleting || !onUpdate}
                            >
                                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                Edit Details
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-10 text-[10px] sm:text-xs px-2 sm:px-4"
                            >
                                History
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-8 sm:h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 text-[10px] sm:text-xs px-2 sm:px-4"
                                size="sm"
                                onClick={onDeleteClick}
                                disabled={isDeleting}
                            >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />
                                {isDeleting ? '...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EditShipmentModal
                shipment={shipment}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={onSaveEdit}
            />
        </div>
    )
})

// ─── Thin outer shell — manages state and alert only ──────────────────────────
export function ShipmentCard({ shipment, onDelete, onUpdate }: ShipmentCardProps) {
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false)
    const { showAlert, alert, hideAlert } = useAlert()

    const handleDelete = React.useCallback(() => {
        const quote = shipment.quoteId || shipment.preservedQuoteData
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
                } catch (error) {
                    console.error('Error deleting shipment:', error)
                    setIsDeleting(false)
                    throw error
                }
            }
        })
    }, [showAlert, shipment, onDelete])

    const handleSaveEdit = React.useCallback(async (updatedShipment: Partial<Shipment>) => {
        if (!onUpdate) {
            console.error('onUpdate prop is not provided')
            return
        }
        await onUpdate(shipment._id, updatedShipment)
        showAlert({
            type: "success",
            title: "Shipment Updated",
            message: "The shipment has been successfully updated."
        })
    }, [showAlert, onUpdate, shipment._id])

    const handleSendEmail = React.useCallback(() => {
        const quote = shipment.quoteId || shipment.preservedQuoteData
        const customerEmail = quote?.email || ''
        showAlert({
            type: "confirm",
            title: "Send Shipment Details",
            message: `Send shipment details to ${customerEmail}? This will include tracking information and current status.`,
            confirmText: "Yes, Send Email",
            cancelText: "Cancel",
            onConfirm: async () => {
                // TODO: Implement email sending functionality
            }
        })
    }, [showAlert, shipment])

    const handleExportPDF = React.useCallback(async () => {
        setIsGeneratingPDF(true)
        try {
            await generateShipmentPDF(shipment)
            showAlert({
                type: "success",
                title: "PDF Generated",
                message: "Shipment documentation has been downloaded successfully."
            })
        } catch (error) {
            console.error('Error generating PDF:', error)
            showAlert({
                type: "error",
                title: "Error",
                message: "Failed to generate PDF. Please try again."
            })
        } finally {
            setIsGeneratingPDF(false)
        }
    }, [showAlert, shipment])

    return (
        <>
            <AlertDialog {...alert} onOpenChange={hideAlert} />
            <ShipmentCardInner
                shipment={shipment}
                isDeleting={isDeleting}
                isGeneratingPDF={isGeneratingPDF}
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                onDeleteClick={handleDelete}
                onSendEmailClick={handleSendEmail}
                onExportPDFClick={handleExportPDF}
                onSaveEdit={handleSaveEdit}
                onUpdate={onUpdate}
            />
        </>
    )
}
