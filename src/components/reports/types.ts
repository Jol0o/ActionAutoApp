import { Payment } from "@/types/billing"
import { DriverPayout } from "@/types/driver-payout"

export type TabValue = "ALL" | "Transportation" | "Driver Reports" | "Billings"

export interface AssignedDriver {
  _id: string
  name: string
  email: string
}

export interface Shipment {
  _id: string
  status: "Available for Pickup" | "Cancelled" | "Delivered" | "Dispatched" | "In-Route"
  origin: string
  destination: string
  trackingNumber?: string
  pickedUp?: string
  delivered?: string
  assignedDriverId?: AssignedDriver | string | null
  assignedAt?: string
  proofOfDelivery?: {
    submittedAt?: string
    confirmedAt?: string
  }
  preservedQuoteData?: {
    firstName?: string
    lastName?: string
    vehicleName?: string
    rate?: number
  }
  createdAt: string
}

export interface ReportData {
  shipments: Shipment[]
  payments: Payment[]
  payouts: DriverPayout[]
}
