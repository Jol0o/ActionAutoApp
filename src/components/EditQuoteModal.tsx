import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Quote } from "@/types/transportation"

interface EditQuoteModalProps {
    quote: Quote
    isOpen: boolean
    onClose: () => void
    onSave: (updatedQuote: Partial<Quote>) => Promise<void>
}

export function EditQuoteModal({ quote, isOpen, onClose, onSave }: EditQuoteModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        firstName: quote.firstName,
        lastName: quote.lastName,
        email: quote.email,
        phone: quote.phone,
        fromAddress: quote.fromAddress,
        fromZip: quote.fromZip,
        toAddress: quote.toAddress,
        toZip: quote.toZip,
        rate: quote.rate,
        miles: quote.miles,
        units: quote.units,
        enclosedTrailer: quote.enclosedTrailer,
        vehicleInoperable: quote.vehicleInoperable,
        vehicleName: quote.vehicleName || '',
        vin: quote.vin || '',
        stockNumber: quote.stockNumber || '',
        vehicleLocation: quote.vehicleLocation || '',
        etaMin: quote.eta.min,
        etaMax: quote.eta.max
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                fromAddress: formData.fromAddress,
                fromZip: formData.fromZip,
                toAddress: formData.toAddress,
                toZip: formData.toZip,
                rate: formData.rate,
                miles: formData.miles,
                units: formData.units,
                enclosedTrailer: formData.enclosedTrailer,
                vehicleInoperable: formData.vehicleInoperable,
                vehicleName: formData.vehicleName,
                vin: formData.vin,
                stockNumber: formData.stockNumber,
                vehicleLocation: formData.vehicleLocation,
                eta: { min: formData.etaMin, max: formData.etaMax }
            })
            onClose()
        } catch (error) {
            console.error('Error saving quote:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-8 py-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Edit Quote</h2>
                        <p className="text-emerald-50 text-sm mt-1">Update quote information</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/90 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-8 space-y-8">
                        {/* Customer Information */}
                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Vehicle Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vehicle Name
                                    </label>
                                    <input
                                        type="text"
                                        name="vehicleName"
                                        value={formData.vehicleName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        VIN
                                    </label>
                                    <input
                                        type="text"
                                        name="vin"
                                        value={formData.vin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stock Number
                                    </label>
                                    <input
                                        type="text"
                                        name="stockNumber"
                                        value={formData.stockNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vehicle Location
                                    </label>
                                    <input
                                        type="text"
                                        name="vehicleLocation"
                                        value={formData.vehicleLocation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Route Information */}
                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Route Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Address
                                    </label>
                                    <input
                                        type="text"
                                        name="fromAddress"
                                        value={formData.fromAddress}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        name="fromZip"
                                        value={formData.fromZip}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To Address
                                    </label>
                                    <input
                                        type="text"
                                        name="toAddress"
                                        value={formData.toAddress}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        name="toZip"
                                        value={formData.toZip}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quote Details */}
                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Quote Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rate ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="rate"
                                        value={formData.rate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Miles
                                    </label>
                                    <input
                                        type="number"
                                        name="miles"
                                        value={formData.miles}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Units
                                    </label>
                                    <input
                                        type="number"
                                        name="units"
                                        value={formData.units}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ETA Min (days)
                                    </label>
                                    <input
                                        type="number"
                                        name="etaMin"
                                        value={formData.etaMin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ETA Max (days)
                                    </label>
                                    <input
                                        type="number"
                                        name="etaMax"
                                        value={formData.etaMax}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transport Options */}
                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Transport Options
                            </h3>
                            <div className="flex gap-8">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="enclosedTrailer"
                                        checked={formData.enclosedTrailer}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">
                                        Enclosed Trailer
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="vehicleInoperable"
                                        checked={formData.vehicleInoperable}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">
                                        Vehicle Inoperable
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="border-gray-300 hover:bg-gray-100 px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg shadow-emerald-500/30 px-6"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}