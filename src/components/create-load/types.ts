export interface LocationBlock {
  locationType: string
  companyName: string
  contactName: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  phoneExt: string
  notes: string
}

export interface LoadVehicle {
  id: string
  trailerType: string
  year: string
  make: string
  model: string
  vin: string
  color: string
  condition: string
}

export interface LoadDates {
  firstAvailable: string
  pickupDeadline: string
  deliveryDeadline: string
  notes: string
}

export const emptyLocation = (): LocationBlock => ({
  locationType: "",
  companyName: "",
  contactName: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: "",
  phoneExt: "",
  notes: "",
})

export const emptyVehicle = (): LoadVehicle => ({
  id: crypto.randomUUID(),
  trailerType: "",
  year: "",
  make: "",
  model: "",
  vin: "",
  color: "",
  condition: "Operable",
})

export const emptyDates = (): LoadDates => ({
  firstAvailable: "",
  pickupDeadline: "",
  deliveryDeadline: "",
  notes: "",
})

// Representative ZIP per state (major city) — used for auto-fill
// Using well-known major city ZIPs that resolve reliably via Nominatim/OpenStreetMap
export const STATE_ZIP_MAP: Record<string, string> = {
  AL:"35203", AK:"99501", AZ:"85004", AR:"72201", CA:"90012",
  CO:"80202", CT:"06103", DE:"19801", FL:"33101", GA:"30303",
  HI:"96813", ID:"83702", IL:"60601", IN:"46204", IA:"50309",
  KS:"66101", KY:"40202", LA:"70112", ME:"04101", MD:"21201",
  MA:"02101", MI:"48226", MN:"55401", MS:"39201", MO:"63101",
  MT:"59601", NE:"68102", NV:"89101", NH:"03101", NJ:"07102",
  NM:"87101", NY:"10001", NC:"27601", ND:"58102", OH:"43215",
  OK:"73102", OR:"97201", PA:"19103", RI:"02903", SC:"29201",
  SD:"57101", TN:"37201", TX:"75201", UT:"84101", VT:"05401",
  VA:"23219", WA:"98101", WV:"25301", WI:"53202", WY:"82001",
  DC:"20001",
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
]

export const LOCATION_TYPES = [
  "Business","Residence","Auction","Port",
  "Repo Yard","Dealer","Auto Show","Other",
]

export const TRAILER_TYPES = [
  "Open","Enclosed","Driveaway","Flatbed","Hotshot","Single","Multiple",
]

export const VEHICLE_CONDITIONS = ["Operable", "Inoperable"]

export const MAX_VEHICLES = 12

export interface LoadAdditionalInfo {
  notes: string
  instructions: string
  visibility: "public" | "private"
}

export interface LoadContract {
  agreedToTerms: boolean
  signatureName: string
}

export const emptyAdditionalInfo = (): LoadAdditionalInfo => ({
  notes: "",
  instructions: "",
  visibility: "public",
})

export const emptyContract = (): LoadContract => ({
  agreedToTerms: false,
  signatureName: "",
})
