import { Load } from "@/types/load";
import { Quote } from "@/types/transportation";

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function buildShipmentSummary(loads: Load[]) {
  const total = loads.length;
  const delivered = loads.filter((l) => l.status === "Delivered").length;
  const inRoute = loads.filter((l) => l.status === "In-Transit").length;
  const dispatched = loads.filter((l) =>
    (["Picked Up", "Assigned", "Accepted"] as string[]).includes(l.status),
  ).length;
  const available = loads.filter((l) => l.status === "Posted").length;
  const totalRate = loads.reduce(
    (sum, l) =>
      sum + (l.pricing?.estimatedRate ?? l.pricing?.carrierPayAmount ?? 0),
    0,
  );
  const onTimeRate =
    total > 0 ? Math.round((delivered / total) * 100) : 0;
  return { total, delivered, inRoute, dispatched, available, totalRate, onTimeRate };
}

export function buildQuoteSummary(quotes: Quote[]) {
  const total = quotes.length;
  const booked = quotes.filter(
    (q) => q.status === "booked" || q.status === "accepted",
  ).length;
  const pending = quotes.filter((q) => q.status === "pending").length;
  const conversionRate =
    total > 0 ? Math.round((booked / total) * 100) : 0;
  const totalRate = quotes.reduce((sum, q) => sum + (q.rate || 0), 0);
  const avgRate = total > 0 ? totalRate / total : 0;
  return { total, booked, pending, conversionRate, totalRate, avgRate };
}

export function shipmentCustomer(s: Load): string {
  const loc = s.pickupLocation;
  return (
    loc.companyName ||
    loc.contactName ||
    [loc.firstName, loc.lastName].filter(Boolean).join(" ") ||
    "—"
  );
}

export function shipmentVehicle(s: Load): string {
  const v = s.vehicles[0];
  if (!v) return "—";
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "—";
}

export function shipmentVin(s: Load): string {
  return s.vehicles[0]?.vin || "—";
}

export function shipmentRate(s: Load): number {
  return s.pricing?.estimatedRate ?? s.pricing?.carrierPayAmount ?? 0;
}

export function shipmentTransportType(s: Load): string {
  return s.trailerType || "—";
}

export function driverName(s: Load): string {
  if (!s.assignedDriverId) return "Unassigned";
  if (typeof s.assignedDriverId === "object")
    return s.assignedDriverId.name || "—";
  return "—";
}

export function quoteCustomer(q: Quote): string {
  return [q.firstName, q.lastName].filter(Boolean).join(" ") || "—";
}

export function quoteVehicle(q: Quote): string {
  if (q.vehicleId) {
    return (
      [q.vehicleId.year, q.vehicleId.make, q.vehicleId.modelName]
        .filter(Boolean)
        .join(" ") || "—"
    );
  }
  return q.vehicleName || "—";
}

export function quoteFromAddr(q: Quote): string {
  return q.fromAddress || q.fromZip || "—";
}

export function quoteToAddr(q: Quote): string {
  return q.toAddress || q.toZip || "—";
}

export function quoteEta(q: Quote): string {
  if (!q.eta) return "—";
  return `${q.eta.min}–${q.eta.max} days`;
}

export function quoteTransportType(q: Quote): string {
  return q.enclosedTrailer ? "Enclosed" : "Open";
}
