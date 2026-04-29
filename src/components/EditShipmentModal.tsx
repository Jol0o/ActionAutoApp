import { useState } from "react"
import { X, Lock, Megaphone, DollarSign, Phone, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Shipment } from "@/types/transportation"
import { trailerTypeOptions } from "@/components/driver-profile/driver-profile-constants"

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
        origin: shipment.origin || `${(shipment as any).pickupLocation?.city}, ${(shipment as any).pickupLocation?.state}`,
        destination: shipment.destination || `${(shipment as any).deliveryLocation?.city}, ${(shipment as any).deliveryLocation?.state}`,
        requestedPickupDate: (shipment as any).dates?.firstAvailable || shipment.requestedPickupDate || '',
        scheduledPickup: (shipment as any).dates?.pickupDeadline || shipment.scheduledPickup || '',
        pickedUp: (shipment as any).pickedUpAt || (shipment as any).pickedUp || '',
        scheduledDelivery: (shipment as any).dates?.deliveryDeadline || (shipment as any).scheduledDelivery || '',
        delivered: (shipment as any).deliveredAt || (shipment as any).delivered || '',
        isPostedToBoard: (shipment as any).additionalInfo?.visibility === 'public',
        trailerTypeRequired: (shipment as any).trailerType || '',
        vehicleCount: (shipment as any).vehicles?.length || 1,
        preDispatchNotes: (shipment as any).additionalInfo?.notes || '',
        carrierPayAmount: (shipment as any).carrierPayAmount ?? (shipment as any).pricing?.carrierPayAmount ?? '',
        copCodAmount: (shipment as any).copCodAmount ?? (shipment as any).pricing?.copCodAmount ?? '',
        specialInstructions: (shipment as any).specialInstructions || (shipment as any).additionalInfo?.instructions || '',
        loadSpecificTerms: (shipment as any).contract?.signatureName || '', // Mapping to something if relevant
        desiredDeliveryDate: (shipment as any).desiredDeliveryDate || (shipment as any).dates?.deliveryDeadline || '',
        internalLoadId: (shipment as any).loadNumber || (shipment as any).trackingNumber || '',
        originContact: {
            contactName: (shipment as any).pickupLocation?.contactName || (shipment as any).originContact?.contactName || '',
            email: (shipment as any).pickupLocation?.email || (shipment as any).originContact?.email || '',
            phone: (shipment as any).pickupLocation?.phone || (shipment as any).originContact?.phone || '',
            cellPhone: (shipment as any).pickupLocation?.cellPhone || (shipment as any).originContact?.cellPhone || '',
            buyerReferenceNumber: (shipment as any).pickupLocation?.buyerReferenceNumber || (shipment as any).originContact?.buyerReferenceNumber || '',
        },
        destinationContact: {
            contactName: (shipment as any).deliveryLocation?.contactName || (shipment as any).destinationContact?.contactName || '',
            email: (shipment as any).deliveryLocation?.email || (shipment as any).destinationContact?.email || '',
            phone: (shipment as any).deliveryLocation?.phone || (shipment as any).destinationContact?.phone || '',
            cellPhone: (shipment as any).deliveryLocation?.cellPhone || (shipment as any).destinationContact?.cellPhone || '',
            buyerReferenceNumber: (shipment as any).deliveryLocation?.buyerReferenceNumber || (shipment as any).destinationContact?.buyerReferenceNumber || '',
        },
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
            const payload: any = {
                status: formData.status,
                origin: formData.origin,
                destination: formData.destination,
                dates: {
                    firstAvailable: formData.requestedPickupDate,
                    pickupDeadline: formData.scheduledPickup,
                    deliveryDeadline: formData.scheduledDelivery,
                },
                pickedUpAt: formData.pickedUp,
                deliveredAt: formData.delivered,
                additionalInfo: {
                    visibility: formData.isPostedToBoard ? 'public' : 'private',
                    notes: formData.preDispatchNotes,
                    instructions: formData.specialInstructions,
                },
                trailerType: formData.trailerTypeRequired,
                pricing: {
                    carrierPayAmount: formData.carrierPayAmount !== '' ? Number(formData.carrierPayAmount) : undefined,
                    copCodAmount: formData.copCodAmount !== '' ? Number(formData.copCodAmount) : undefined,
                },
                pickupLocation: {
                    ...(shipment as any).pickupLocation,
                    contactName: formData.originContact.contactName,
                    phone: formData.originContact.phone,
                },
                deliveryLocation: {
                    ...(shipment as any).deliveryLocation,
                    contactName: formData.destinationContact.contactName,
                    phone: formData.destinationContact.phone,
                }
            }
            await onSave(payload)
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
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Edit Shipment</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
                        {/* Shipment Status */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shipment Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        Tracking Number
                                        <Lock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={shipment.trackingNumber || 'Not assigned'}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Tracking numbers are automatically generated and cannot be modified
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Route Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Route Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Origin
                                    </label>
                                    <input
                                        type="text"
                                        name="origin"
                                        value={formData.origin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Destination
                                    </label>
                                    <input
                                        type="text"
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shipment Timeline</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Requested Pickup Date
                                    </label>
                                    <input
                                        type="date"
                                        name="requestedPickupDate"
                                        value={formData.requestedPickupDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Scheduled Pickup
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledPickup"
                                        value={formData.scheduledPickup}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Picked Up
                                    </label>
                                    <input
                                        type="date"
                                        name="pickedUp"
                                        value={formData.pickedUp}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Scheduled Delivery
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledDelivery"
                                        value={formData.scheduledDelivery}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Delivered
                                    </label>
                                    <input
                                        type="date"
                                        name="delivered"
                                        value={formData.delivered}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                                Dispatch & Board
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Post to Driver Board</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make this load visible to your drivers on the Available Loads board</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isPostedToBoard: !prev.isPostedToBoard }))}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isPostedToBoard ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isPostedToBoard ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Required Trailer Type
                                        </label>
                                        <select
                                            name="trailerTypeRequired"
                                            value={formData.trailerTypeRequired}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">Any trailer</option>
                                            {trailerTypeOptions.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Vehicle Count
                                        </label>
                                        <input
                                            type="number"
                                            name="vehicleCount"
                                            value={formData.vehicleCount}
                                            onChange={handleChange}
                                            min={1}
                                            max={12}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Pre-Dispatch Notes
                                    </label>
                                    <textarea
                                        name="preDispatchNotes"
                                        value={formData.preDispatchNotes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, preDispatchNotes: e.target.value }))}
                                        rows={2}
                                        maxLength={500}
                                        placeholder="Special instructions for the driver..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                Pricing & Terms
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Carrier Pay ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="carrierPayAmount"
                                        value={formData.carrierPayAmount}
                                        onChange={handleChange}
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        COD/COP Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="copCodAmount"
                                        value={formData.copCodAmount}
                                        onChange={handleChange}
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Internal Load ID
                                    </label>
                                    <input
                                        type="text"
                                        name="internalLoadId"
                                        value={formData.internalLoadId}
                                        onChange={handleChange}
                                        maxLength={50}
                                        placeholder="CD-00001"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Desired Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        name="desiredDeliveryDate"
                                        value={formData.desiredDeliveryDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Load-Specific Terms
                                    </label>
                                    <input
                                        type="text"
                                        name="loadSpecificTerms"
                                        value={formData.loadSpecificTerms}
                                        onChange={handleChange}
                                        maxLength={500}
                                        placeholder="e.g. Must tarp, No stack..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Special Instructions (revealed after dispatch)
                                </label>
                                <textarea
                                    name="specialInstructions"
                                    value={formData.specialInstructions}
                                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                                    rows={2}
                                    maxLength={4000}
                                    placeholder="Gate codes, dock instructions, hazmat requirements..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-blue-600" />
                                Origin Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.originContact.contactName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, originContact: { ...prev.originContact, contactName: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.originContact.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, originContact: { ...prev.originContact, phone: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.originContact.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, originContact: { ...prev.originContact, email: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cell Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.originContact.cellPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, originContact: { ...prev.originContact, cellPhone: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-indigo-600" />
                                Destination Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.destinationContact.contactName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinationContact: { ...prev.destinationContact, contactName: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.destinationContact.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinationContact: { ...prev.destinationContact, phone: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.destinationContact.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinationContact: { ...prev.destinationContact, email: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cell Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.destinationContact.cellPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinationContact: { ...prev.destinationContact, cellPhone: e.target.value } }))}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
