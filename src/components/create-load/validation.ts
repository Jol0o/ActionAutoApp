import { z } from "zod"
import { LOCATION_TYPES, TRAILER_TYPES, VEHICLE_CONDITIONS, US_STATES } from "./types"

// ─── Location Block ───────────────────────────────────────────────────────────

export const locationBlockSchema = z.object({
  locationType: z.enum(LOCATION_TYPES as [string, ...string[]]).optional().or(z.literal("")),
  companyName:  z.string().trim().max(100, "Company name is too long").optional(),
  contactName:  z.string().trim().min(1, "Contact name is required").max(50, "Contact name must be 50 characters or less"),
  street:       z.string().trim()
                  .min(1, "Street address is required")
                  .max(100, "Street address must be 100 characters or less")
                  .regex(/^\d+\s+\S/, "Enter a valid street address (e.g. 123 Main St)"),
  city:         z.string().trim()
                  .min(2, "City is required")
                  .max(100, "City is too long")
                  .regex(/^[a-zA-Z\s\-'.]+$/, "City must contain letters only — no numbers or special characters"),
  state:        z.enum(US_STATES as [string, ...string[]], { error: "State is required" }),
  zip:          z.string().trim().regex(/^\d{5}(-\d{4})?$/, "ZIP must be 5 digits (e.g. 84101)"),
  country:      z.string().trim().length(2).default("US"),
  phone:        z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  phoneExt:     z.string().trim().max(6).optional(),
  notes:        z.string().trim().max(500, "Notes must be under 500 characters").optional(),
})

// ─── Vehicle ──────────────────────────────────────────────────────────────────

const trailerValues = TRAILER_TYPES.map((t) => t.value) as [string, ...string[]]
const conditionValues = VEHICLE_CONDITIONS as [string, ...string[]]

export const loadVehicleSchema = z.object({
  id:          z.string(),
  trailerType: z.enum(trailerValues, { error: "Trailer type is required" }),
  year:        z.string().trim()
                 .min(4, "Year is required")
                 .regex(/^\d{4}$/, "Year must be a 4-digit number")
                 .refine((y) => {
                   const n = Number(y)
                   return n >= 1900 && n <= new Date().getFullYear() + 1
                 }, "Year is out of range"),
  make:        z.string().trim().min(1, "Make is required").max(15, "Make must be 15 characters or less"),
  model:       z.string().trim().min(1, "Model is required").max(15, "Model must be 15 characters or less"),
  vin:         z.string().trim().toUpperCase().max(17, "VIN must be at most 17 characters").optional().or(z.literal("")),
  color:       z.string().trim().max(15, "Color must be 15 characters or less").optional(),
  condition:   z.enum(conditionValues, { error: "Condition is required" }),
})

// ─── Dates ────────────────────────────────────────────────────────────────────

export const loadDatesSchema = z.object({
  firstAvailable:  z.string().min(1, "First available date is required"),
  pickupDeadline:  z.string().optional(),
  deliveryDeadline:z.string().optional(),
  notes:           z.string().trim().max(500, "Date notes must be under 500 characters").optional(),
}).refine(
  (d) => {
    if (d.firstAvailable && d.pickupDeadline) {
      return new Date(d.pickupDeadline) >= new Date(d.firstAvailable)
    }
    return true
  },
  { message: "Pickup deadline must be on or after first available date", path: ["pickupDeadline"] }
).refine(
  (d) => {
    if (d.firstAvailable && d.deliveryDeadline) {
      return new Date(d.deliveryDeadline) >= new Date(d.firstAvailable)
    }
    return true
  },
  { message: "Delivery deadline must be on or after first available date", path: ["deliveryDeadline"] }
)

// ─── Additional Info ──────────────────────────────────────────────────────────

export const loadAdditionalInfoSchema = z.object({
  notes:        z.string().trim().max(400, "Load notes must be 400 characters or less").optional(),
  instructions: z.string().trim().max(400, "Carrier instructions must be 400 characters or less").optional(),
  visibility:   z.enum(["public", "private"]).default("public"),
})

// ─── Contract ─────────────────────────────────────────────────────────────────

export const loadContractSchema = z.object({
  agreedToTerms:  z.literal(true, { error: "You must agree to the Terms & Conditions" }),
  signatureName:  z.string().trim().min(1, "Digital signature is required").max(50, "Signature must be 50 characters or less"),
})

// ─── Full form ────────────────────────────────────────────────────────────────

export const createLoadFormSchema = z.object({
  pickup:         locationBlockSchema,
  delivery:       locationBlockSchema,
  vehicles:       z.array(loadVehicleSchema)
                    .min(1, "At least one vehicle is required")
                    .max(12, "Maximum 12 vehicles per load"),
  dates:          loadDatesSchema,
  additionalInfo: loadAdditionalInfoSchema,
  contract:       loadContractSchema,
})

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
  selectedDriverId: string | null,
): string[] {
  const result = createLoadFormSchema.safeParse({ pickup, delivery, vehicles, dates, additionalInfo, contract })

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
      path[0] === "pickup"         ? `Pickup ${String(path[1] ?? "").replace(/([A-Z])/g, " $1").toLowerCase()}: ` :
      path[0] === "delivery"       ? `Delivery ${String(path[1] ?? "").replace(/([A-Z])/g, " $1").toLowerCase()}: ` :
      path[0] === "vehicles"       ? `Vehicle ${Number(path[1]) + 1} — ` :
      path[0] === "dates"          ? "Dates — " :
      path[0] === "additionalInfo" ? "Additional Info — " :
      path[0] === "contract"       ? "" :
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
