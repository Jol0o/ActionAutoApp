import { Quote, Shipment } from "@/types/transportation"

export interface TransportationReportData {
  shipments: Shipment[]
  quotes: Quote[]
}

export type TransportationReportType = "shipment" | "quote"

export interface ShipmentSummary {
  total: number
  delivered: number
  inRoute: number
  dispatched: number
  available: number
  cancelled: number
  avgRate: number
  totalRate: number
  totalMiles: number
  avgDeliveryDays: number
  onTimeRate: number
}

export interface QuoteSummary {
  total: number
  pending: number
  accepted: number
  rejected: number
  booked: number
  avgRate: number
  totalRate: number
  totalMiles: number
  conversionRate: number
  enclosedCount: number
  inoperableCount: number
}
