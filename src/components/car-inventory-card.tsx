import { Vehicle } from "@/types/inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TruckIcon, GaugeIcon, MapPinIcon, Phone, Play, CheckCircle2 } from "lucide-react"

interface CarInventoryCardProps {
  vehicle: Vehicle
  shippingPrice?: number
  onGetQuote: (vehicle: Vehicle) => void
}

export function CarInventoryCard({
  vehicle,
  shippingPrice,
  onGetQuote
}: CarInventoryCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 p-0 h-full flex flex-col group">
      {/* Vehicle Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Shipping Price Animation */}
        {shippingPrice !== undefined && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-500">
            <TruckIcon className="w-3.5 h-3.5" />
            +${shippingPrice.toLocaleString()}
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-white/90 text-green-600 font-semibold">
            Stock #{vehicle.stockNumber}
          </Badge>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-5 flex flex-col flex-1 space-y-4">
        {/* Title */}
        <div className="text-center">
          <h3 className="font-bold text-lg leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && (
            <p className="text-sm text-muted-foreground mt-1">{vehicle.trim}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <GaugeIcon className="w-4 h-4" />
            {vehicle.mileage.toLocaleString()} mi
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPinIcon className="w-4 h-4" />
            {vehicle.location.split(",")[0].toUpperCase()}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {vehicle.color && <Badge variant="outline" className="border-green-600 text-green-600">{vehicle.color}</Badge>}
          {vehicle.transmission && <Badge variant="outline" className="border-green-600 text-green-600">{vehicle.transmission}</Badge>}
          {vehicle.fuelType && <Badge variant="outline" className="border-green-600 text-green-600">{vehicle.fuelType}</Badge>}
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t text-center">
          <div className="text-2xl font-bold text-green-600">${vehicle.price.toLocaleString()}</div>
          {shippingPrice !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Total: ${(vehicle.price + shippingPrice).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-2">
          <Button className="w-full bg-white border border-green-600 text-green-600 py-2 rounded text-sm font-semibold hover:bg-green-50 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Check Availability
          </Button>

          <Button className="w-full bg-white border border-green-600 text-green-600 py-2 rounded text-sm font-semibold hover:bg-green-50 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Apply Now
          </Button>

          <Button className="w-full bg-white border border-green-600 text-green-600 py-2 rounded text-sm font-semibold hover:bg-green-50 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Call Us
          </Button>

          <Button className="w-full bg-white border border-green-600 text-green-600 py-2 rounded text-sm font-semibold hover:bg-green-50 flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Video Test Drive
          </Button>

          <Button
            onClick={() => onGetQuote(vehicle)}
            className="w-full bg-green-600 text-white py-2 rounded text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <TruckIcon className="w-4 h-4" /> Home Shipping Quote
          </Button>
        </div>
      </div>
    </Card>
  )
}
