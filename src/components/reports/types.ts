import { Payment } from "@/types/billing"
import { DriverPayout } from "@/types/driver-payout"
import { Load } from "@/types/load"

export type TabValue = "ALL" | "Transportation" | "Driver Reports" | "Billings"

export interface AssignedDriver {
  _id: string
  name: string
  email: string
}

export interface ReportData {
  loads: Load[]
  payments: Payment[]
  payouts: DriverPayout[]
}
