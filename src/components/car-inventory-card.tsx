import { Vehicle } from "@/types/inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TruckIcon, GaugeIcon, MapPinIcon, Phone, Play, CheckCircle2, ArrowUpRight } from "lucide-react"

interface CarInventoryCardProps {
  vehicle: Vehicle
  shippingPrice?: number
  onGetQuote: (vehicle: Vehicle) => void
  onVehicleClick?: (vehicle: Vehicle) => void
}

export function CarInventoryCard({
  vehicle,
  shippingPrice,
  onGetQuote,
  onVehicleClick
}: CarInventoryCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 p-0 h-full flex flex-col group border-transparent hover:border-border/50">
      {/* Vehicle Image */}
      <div
        onClick={() => onVehicleClick?.(vehicle)}
        className="block relative h-64 overflow-hidden bg-muted cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Shipping Price Animation */}
        {shippingPrice !== undefined && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-500 shadow-md">
            <TruckIcon className="w-3.5 h-3.5" />
            +${shippingPrice.toLocaleString()}
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-white/95 text-green-700 font-semibold shadow-sm backdrop-blur-sm">
            Stock #{vehicle.stockNumber}
          </Badge>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-3 md:p-5 flex flex-col flex-1 space-y-4">
        {/* Title */}
        <div className="text-center relative">
          <div
            onClick={() => onVehicleClick?.(vehicle)}
            className="inline-block group-hover:text-primary transition-colors cursor-pointer"
          >
            <h3 className="font-bold text-lg leading-tight flex items-center justify-center gap-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
          </div>
          {vehicle.trim && (
            <p className="text-sm text-muted-foreground mt-1">{vehicle.trim}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/30 py-1.5 rounded-md">
            <GaugeIcon className="w-4 h-4" />
            {vehicle.mileage.toLocaleString()} mi
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/30 py-1.5 rounded-md">
            <MapPinIcon className="w-4 h-4" />
            {vehicle.location.split(",")[0].toUpperCase()}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {vehicle.color && <Badge variant="secondary" className="font-normal text-xs">{vehicle.color}</Badge>}
          {vehicle.transmission && <Badge variant="secondary" className="font-normal text-xs">{vehicle.transmission}</Badge>}
          {vehicle.fuelType && <Badge variant="secondary" className="font-normal text-xs">{vehicle.fuelType}</Badge>}
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t text-center">
          <div className="text-2xl font-bold text-green-600">${vehicle.price.toLocaleString()}</div>
          {shippingPrice !== undefined && (
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              Total with Shipping: ${(vehicle.price + shippingPrice).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9">
              Check Availability
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9">
              Apply Now
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Phone className="w-3 h-3 mr-1" /> Call Us
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Play className="w-3 h-3 mr-1" /> Video
            </Button>
          </div>

          <Button
            onClick={() => onGetQuote(vehicle)}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-[0.99] transition-all"
          >
            <TruckIcon className="w-4 h-4 mr-2" /> Home Shipping Quote
          </Button>
        </div>
      </div>
    </Card>
  )
}
