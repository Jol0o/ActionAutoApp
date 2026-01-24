import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Shipment } from "@/types/transportation"

interface EditShipmentModalProps {
    shipment: Shipment
    isOpen: boolean
    onClose: () => void
    onSave: (updatedShipment: Partial<Shipment>) => Promise<void>
}

export function EditShipmentModal({ shipment, isOpen, onClose, onSave }: EditShipmentModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        status: shipment.status,
        origin: shipment.origin,
        destination: shipment.destination,
        trackingNumber: shipment.trackingNumber || '',
        requestedPickupDate: shipment.requestedPickupDate || '',
        scheduledPickup: shipment.scheduledPickup || '',
        pickedUp: shipment.pickedUp || '',
        scheduledDelivery: shipment.scheduledDelivery || '',
        delivered: shipment.delivered || ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Error saving shipment:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    const statusOptions = [
        'Available for Pickup',
        'Dispatched',
        'In-Route',
        'Delivered',
        'Cancelled'
    ]

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Edit Shipment</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
                        {/* Shipment Status */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tracking Number
                                    </label>
                                    <input
                                        type="text"
                                        name="trackingNumber"
                                        value={formData.trackingNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="TRK-XXXXXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Route Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Origin
                                    </label>
                                    <input
                                        type="text"
                                        name="origin"
                                        value={formData.origin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Destination
                                    </label>
                                    <input
                                        type="text"
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Timeline</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Requested Pickup Date
                                    </label>
                                    <input
                                        type="date"
                                        name="requestedPickupDate"
                                        value={formData.requestedPickupDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Pickup
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledPickup"
                                        value={formData.scheduledPickup}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Picked Up
                                    </label>
                                    <input
                                        type="date"
                                        name="pickedUp"
                                        value={formData.pickedUp}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Delivery
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledDelivery"
                                        value={formData.scheduledDelivery}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Delivered
                                    </label>
                                    <input
                                        type="date"
                                        name="delivered"
                                        value={formData.delivered}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}