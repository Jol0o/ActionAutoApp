import { Vehicle } from "@/types/inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TruckIcon, GaugeIcon, MapPinIcon } from "lucide-react"

interface CarInventoryCardProps {
    vehicle: Vehicle
    shippingPrice?: number
    onGetQuote: (vehicle: Vehicle) => void
}

export function CarInventoryCard({ vehicle, shippingPrice, onGetQuote }: CarInventoryCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group p-0">
            {/* Vehicle Image */}
            <div className="relative overflow-hidden bg-muted h-48">
                <img
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {shippingPrice !== undefined && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-1.5">
                            <TruckIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">
                                +${shippingPrice.toLocaleString()} shipping
                            </span>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground font-semibold">
                        Stock #{vehicle.stockNumber}
                    </Badge>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                    <h3 className="font-bold text-lg leading-tight">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.trim && (
                        <p className="text-sm text-muted-foreground mt-1">{vehicle.trim}</p>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <GaugeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {vehicle.mileage.toLocaleString()} mi
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{vehicle.location}</span>
                    </div>
                </div>

                {/* Additional Info */}
                {(vehicle.color || vehicle.transmission || vehicle.fuelType) && (
                    <div className="flex flex-wrap gap-2">
                        {vehicle.color && (
                            <Badge variant="outline" className="text-xs">
                                {vehicle.color}
                            </Badge>
                        )}
                        {vehicle.transmission && (
                            <Badge variant="outline" className="text-xs">
                                {vehicle.transmission}
                            </Badge>
                        )}
                        {vehicle.fuelType && (
                            <Badge variant="outline" className="text-xs">
                                {vehicle.fuelType}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Price and CTA */}
                <div className="pt-4 border-t space-y-3">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                ${vehicle.price.toLocaleString()}
                            </div>
                            {shippingPrice !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    Total: ${(vehicle.price + shippingPrice).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={() => onGetQuote(vehicle)}
                        variant={shippingPrice !== undefined ? "outline" : "default"}
                        className="w-full"
                        size="sm"
                    >
                        <TruckIcon className="w-4 h-4 mr-2" />
                        {shippingPrice !== undefined ? "Update Quote" : "Get Shipping Quote"}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
