import { z } from "zod"

// Helper for required string fields with custom message
const requiredString = (msg: string) => z.string().min(1, { message: msg })

export const PersonalInfoSchema = z.object({
  applicationType: z.enum(["individual", "joint"]),
  firstName: requiredString("First name is required"),
  lastName: requiredString("Last name is required"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Invalid SSN format (XXX-XX-XXXX)"),
  dob: requiredString("Date of birth is required"),
  dlNumber: requiredString("Driver's License number is required"),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
})

export const ContactSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
})

export const ResidenceSchema = z.object({
  address: requiredString("Street address is required"),
  city: requiredString("City is required"),
  state: requiredString("State is required"),
  zipCode: z.string().length(5, "Invalid ZIP code"),
  housingStatus: z.enum(["own", "rent", "other"]),
  monthlyPayment: z.number().min(0, "Monthly payment cannot be negative"),
  yearsAtAddress: z.number().min(0),
  monthsAtAddress: z.number().min(0).max(11),
})

export const EmploymentSchema = z.object({
  employerName: requiredString("Employer name is required"),
  jobTitle: requiredString("Job title is required"),
  workPhone: z.string().optional(),
  annualIncome: z.number().min(0, "Income cannot be negative"),
  incomeFrequency: z.enum(["annually", "monthly", "bi-weekly", "weekly"]),
  employmentYears: z.number().min(0),
  employmentMonths: z.number().min(0).max(11),
})

export const ReferenceSchema = z.object({
  refName: requiredString("Reference name is required"),
  refRelationship: requiredString("Relationship is required"),
  refPhone: z.string().min(10, "Invalid phone number"),
})

export const TradeInSchema = z.object({
  hasTradeIn: z.boolean(),
  tradeYear: z.string().optional(),
  tradeMake: z.string().optional(),
  tradeModel: z.string().optional(),
  tradeMileage: z.string().optional(),
})

export const FinanceApplicationSchema = z.object({
  personal: PersonalInfoSchema,
  contact: ContactSchema,
  residence: ResidenceSchema,
  employment: EmploymentSchema,
  reference: ReferenceSchema,
  tradeIn: TradeInSchema,
})

export type FinanceApplicationData = z.infer<typeof FinanceApplicationSchema>


// ─── Load Creation Schemas ──────────────────────────────────────────────────

export const locationBlockSchema = z.object({
  locationType: z.string().optional(),
  companyName: z.string().trim().max(100).optional(),
  contactName: z.string().trim().min(1, "Contact name is required").max(50),
  street: z.string().trim().min(1, "Street address is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required"),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  country: z.string().trim().length(2).default("US"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be 10 digits"),
  phoneExt: z.string().trim().max(6).optional(),
  notes: z.string().trim().max(500).optional(),
})

export const loadVehicleSchema = z.object({
  id: z.string(),
  year: z.string().trim().regex(/^\d{4}$/, "Year must be 4 digits"),
  make: z.string().trim().min(1, "Make is required").max(20),
  model: z.string().trim().min(1, "Model is required").max(20),
  vin: z.string().trim().toUpperCase().max(17).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional(),
  condition: z.enum(["Operable", "Inoperable"]),
})

export const loadDatesSchema = z.object({
  firstAvailable: z.string().min(1, "First available date is required"),
  pickupDeadline: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
}).refine(data => {
  const today = new Date();
  today.setHours(0,0,0,0);
  return new Date(data.firstAvailable) >= today;
}, { message: "First available date cannot be in the past", path: ["firstAvailable"] });

export const loadAdditionalInfoSchema = z.object({
  notes: z.string().optional(),
  instructions: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("public"),
})

export const loadContractSchema = z.object({
  agreedToTerms: z.literal(true, { error: "You must agree to the terms" }),
  signatureName: z.string().min(1, "Signature is required"),
})

export const createLoadFormSchema = z.object({
  pickup: locationBlockSchema,
  delivery: locationBlockSchema,
  vehicles: z.array(loadVehicleSchema).min(1, "At least one vehicle is required"),
  dates: loadDatesSchema,
  trailerType: z.string().min(1, "Trailer type is required"),
  additionalInfo: loadAdditionalInfoSchema,
  contract: loadContractSchema,
}).refine(data => {
  const vins = data.vehicles.map(v => v.vin).filter(Boolean);
  return new Set(vins).size === vins.length;
}, { message: "Duplicate VINs not allowed", path: ["vehicles"] });
