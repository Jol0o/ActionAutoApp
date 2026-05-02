import { z } from "zod"
import { 
  createLoadFormSchema, 
  locationBlockSchema, 
  loadVehicleSchema, 
  loadDatesSchema,
  loadAdditionalInfoSchema,
  loadContractSchema
} from "@/lib/schemas/finance-schema"

export { createLoadFormSchema, locationBlockSchema, loadVehicleSchema, loadDatesSchema, loadAdditionalInfoSchema, loadContractSchema }
export type CreateLoadFormValues = z.infer<typeof createLoadFormSchema>

// ─── Parse and return flat error messages ────────────────────────────────────

export function validateLoadForm(
  postType: "load-board" | "assign-carrier",
  pickup: unknown,
  delivery: unknown,
  vehicles: unknown,
  dates: unknown,
  additionalInfo: unknown,
  contract: unknown,
  trailerType: unknown,
  selectedDriverId: string | null,
): string[] {
  const result = createLoadFormSchema.safeParse({ pickup, delivery, vehicles, dates, additionalInfo, contract, trailerType })

  if (result.success) {
    const extra: string[] = []
    if (postType === "assign-carrier" && !selectedDriverId) {
      extra.push("Please select a driver to assign")
    }
    return extra
  }

  // Map Zod paths to human-readable prefixes
  const messages = result.error.issues.map((issue) => {
    const path = issue.path
    // e.g. ["pickup","phone"] → "Pickup phone: ..."
    const prefix =
      path[0] === "pickup" ? `Pickup ${String(path[1] ?? "").replace(/([A-Z])/g, " $1").toLowerCase()}: ` :
        path[0] === "delivery" ? `Delivery ${String(path[1] ?? "").replace(/([A-Z])/g, " $1").toLowerCase()}: ` :
          path[0] === "vehicles" ? `Vehicle ${Number(path[1]) + 1} — ` :
            path[0] === "dates" ? "Dates — " :
              path[0] === "additionalInfo" ? "Additional Info — " :
                path[0] === "contract" ? "" :
                  ""
    return `${prefix}${issue.message}`
  })

  // Deduplicate
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const m of messages) {
    if (!seen.has(m)) { seen.add(m); deduped.push(m) }
  }

  if (postType === "assign-carrier" && !selectedDriverId) {
    deduped.push("Please select a driver to assign")
  }

  return deduped
}
