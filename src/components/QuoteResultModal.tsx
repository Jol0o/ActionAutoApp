import * as React from "react"
import { CheckCircle, MapPin, Truck, Clock, DollarSign, Package, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Quote } from "@/types/transportation"

interface QuoteResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote | null
  onCreateShipment: () => void
  onViewQuote: () => void
}

export function QuoteResultModal({
  open,
  onOpenChange,
  quote,
  onCreateShipment,
  onViewQuote
}: QuoteResultModalProps) {
  if (!quote) return null

  const vehicle = quote.vehicleId
  const vehicleName = vehicle 
    ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
    : quote.vehicleName || 'Vehicle'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 rounded-full p-3 bg-green-50 border-2 border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Quote Calculated Successfully
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Your shipping quote is ready for review
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Vehicle Information */}
          {quote.vehicleImage && (
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={quote.vehicleImage} 
                alt={vehicleName}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-semibold text-lg">{vehicleName}</h3>
                {quote.vehicleLocation && (
                  <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    {quote.vehicleLocation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Customer Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{quote.firstName} {quote.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{quote.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{quote.phone}</p>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Route Details
            </h4>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                <div className="w-0.5 h-12 bg-gradient-to-b from-green-500 to-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Origin</p>
                  <p className="font-semibold text-gray-900">{quote.fromAddress}</p>
                  <p className="text-sm text-gray-600">{quote.fromZip}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Destination</p>
                  <p className="font-semibold text-gray-900">{quote.toAddress}</p>
                  <p className="text-sm text-gray-600">{quote.toZip}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Distance</p>
                <p className="text-lg font-bold text-gray-900">{quote.miles} mi</p>
              </div>
            </div>
          </div>

          {/* Pricing and Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Transport Rate</h4>
              </div>
              <p className="text-3xl font-bold text-green-700">${quote.rate.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">Total shipping cost</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Estimated Time</h4>
              </div>
              <p className="text-3xl font-bold text-blue-700">{quote.eta.min}-{quote.eta.max}</p>
              <p className="text-xs text-gray-600 mt-1">days</p>
            </div>
          </div>

          {/* Transport Options */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Transport Type</p>
              <p className="text-sm font-semibold text-gray-900">
                {quote.enclosedTrailer ? 'Enclosed' : 'Open'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Vehicle Status</p>
              <p className="text-sm font-semibold text-gray-900">
                {quote.vehicleInoperable ? 'Inoperable' : 'Operable'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Units</p>
              <p className="text-sm font-semibold text-gray-900">{quote.units}</p>
            </div>
          </div>

          {/* VIN and Stock Info */}
          {(quote.vin || quote.stockNumber) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                {quote.vin && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">VIN Number</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.vin}</p>
                  </div>
                )}
                {quote.stockNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Stock Number</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.stockNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onCreateShipment}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg h-12 text-base font-semibold"
            >
              <Truck className="w-5 h-5 mr-2" />
              Create Shipment
            </Button>
            <Button
              onClick={onViewQuote}
              variant="outline"
              className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 h-12 text-base font-semibold"
            >
              View Draft
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}