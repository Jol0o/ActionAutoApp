export interface LoadLocation {
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

export interface LoadVehicleItem {
  trailerType: string
  year: string
  make: string
  model: string
  vin: string
  color: string
  condition: string
}

export interface LoadPricing {
  miles?: number
  estimatedRate?: number
  carrierPayAmount?: number
  copCodAmount?: number
  balanceAmount?: number
}

export interface Load {
  _id: string
  loadNumber: string
  postType: "load-board" | "assign-carrier"
  status: string
  pickupLocation: LoadLocation
  deliveryLocation: LoadLocation
  vehicles: LoadVehicleItem[]
  dates: {
    firstAvailable: string
    pickupDeadline: string
    deliveryDeadline: string
    notes: string
  }
  pricing: LoadPricing
  additionalInfo: {
    notes: string
    instructions: string
    visibility: "public" | "private"
  }
  contract: {
    agreedToTerms: boolean
    signatureName: string
    signedAt?: string
  }
  createdAt: string
  createdBy?: string
}
