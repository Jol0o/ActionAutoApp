import { Quote, Shipment } from "@/types/transportation"
import { ShipmentSummary, QuoteSummary } from "./types"

function quoteData(s: Shipment) {
  return s.quoteId || s.preservedQuoteData
}

export function buildShipmentSummary(shipments: Shipment[]): ShipmentSummary {
  const total = shipments.length
  const delivered = shipments.filter(s => s.status === "Delivered").length
  const inRoute = shipments.filter(s => s.status === "In-Route").length
  const dispatched = shipments.filter(s => s.status === "Dispatched").length
  const available = shipments.filter(s => s.status === "Available for Pickup").length
  const cancelled = shipments.filter(s => s.status === "Cancelled").length
  const rates = shipments.map(s => quoteData(s)?.rate || 0).filter(r => r > 0)
  const totalRate = rates.reduce((a, b) => a + b, 0)
  const avgRate = rates.length > 0 ? totalRate / rates.length : 0
  const miles = shipments.map(s => quoteData(s)?.miles || 0).filter(m => m > 0)
  const totalMiles = miles.reduce((a, b) => a + b, 0)

  const deliveryDays = shipments
    .filter(s => s.pickedUp && s.delivered)
    .map(s => {
      const diff = new Date(s.delivered!).getTime() - new Date(s.pickedUp!).getTime()
      return diff / 86_400_000
    })
  const avgDeliveryDays = deliveryDays.length > 0
    ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length
    : 0

  const active = total - cancelled
  const onTimeRate = active > 0 ? Math.round((delivered / active) * 100) : 0

  return { total, delivered, inRoute, dispatched, available, cancelled, avgRate, totalRate, totalMiles, avgDeliveryDays, onTimeRate }
}

export function buildQuoteSummary(quotes: Quote[]): QuoteSummary {
  const total = quotes.length
  const pending = quotes.filter(q => q.status === "pending").length
  const accepted = quotes.filter(q => q.status === "accepted").length
  const rejected = quotes.filter(q => q.status === "rejected").length
  const booked = quotes.filter(q => q.status === "booked").length
  const rates = quotes.map(q => q.rate || 0).filter(r => r > 0)
  const totalRate = rates.reduce((a, b) => a + b, 0)
  const avgRate = rates.length > 0 ? totalRate / rates.length : 0
  const miles = quotes.map(q => q.miles || 0).filter(m => m > 0)
  const totalMiles = miles.reduce((a, b) => a + b, 0)
  const conversionRate = total > 0 ? Math.round((booked / total) * 100) : 0
  const enclosedCount = quotes.filter(q => q.enclosedTrailer).length
  const inoperableCount = quotes.filter(q => q.vehicleInoperable).length

  return { total, pending, accepted, rejected, booked, avgRate, totalRate, totalMiles, conversionRate, enclosedCount, inoperableCount }
}

export function fmtDate(d?: string): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export function fmtNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(num))
}

export function shipmentCustomer(s: Shipment): string {
  const q = quoteData(s)
  return [q?.firstName, q?.lastName].filter(Boolean).join(" ") || "—"
}

export function shipmentVehicle(s: Shipment): string {
  const q = quoteData(s)
  if (q?.vehicleId) return `${q.vehicleId.year} ${q.vehicleId.make} ${q.vehicleId.modelName}`
  return q?.vehicleName || "—"
}

export function shipmentVin(s: Shipment): string {
  const q = quoteData(s)
  return q?.vehicleId?.vin || q?.vin || "—"
}

export function shipmentStock(s: Shipment): string {
  const q = quoteData(s)
  return q?.vehicleId?.stockNumber || q?.stockNumber || "—"
}

export function shipmentRate(s: Shipment): number {
  return quoteData(s)?.rate || 0
}

export function shipmentMiles(s: Shipment): number {
  return quoteData(s)?.miles || 0
}

export function shipmentTransportType(s: Shipment): string {
  return quoteData(s)?.enclosedTrailer ? "Enclosed" : "Open"
}

export function shipmentRoute(s: Shipment): string {
  return `${s.origin || "—"} → ${s.destination || "—"}`
}

export function calcDuration(pickedUp?: string, delivered?: string): string {
  if (!pickedUp || !delivered) return "—"
  const diff = new Date(delivered).getTime() - new Date(pickedUp).getTime()
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function driverName(s: Shipment): string {
  if (!s.assignedDriverId) return "Unassigned"
  if (typeof s.assignedDriverId === "object") return s.assignedDriverId.name || "Unknown"
  return "Assigned"
}

export function quoteCustomer(q: Quote): string {
  return [q.firstName, q.lastName].filter(Boolean).join(" ") || "—"
}

export function quoteVehicle(q: Quote): string {
  if (q.vehicleId) return `${q.vehicleId.year} ${q.vehicleId.make} ${q.vehicleId.modelName}`
  return q.vehicleName || "—"
}

export function quoteVin(q: Quote): string {
  return q.vehicleId?.vin || q.vin || "—"
}

export function quoteStock(q: Quote): string {
  return q.vehicleId?.stockNumber || q.stockNumber || "—"
}

export function quoteFromAddr(q: Quote): string {
  return q.fromAddress || q.fromZip || "—"
}

export function quoteToAddr(q: Quote): string {
  return q.toAddress || q.toZip || "—"
}

export function quoteEta(q: Quote): string {
  if (!q.eta?.min && !q.eta?.max) return "—"
  return `${q.eta.min || 0}–${q.eta.max || 0}d`
}

export function quoteTransportType(q: Quote): string {
  return q.enclosedTrailer ? "Enclosed" : "Open"
}

export function quoteRoute(q: Quote): string {
  return `${q.fromAddress || q.fromZip || "—"} → ${q.toAddress || q.toZip || "—"}`
}
