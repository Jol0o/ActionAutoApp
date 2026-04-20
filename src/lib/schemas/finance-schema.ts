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
