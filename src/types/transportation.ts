// types/transportation.ts

export interface Quote {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId?: {
    _id: string;
    year: number;
    make: string;
    modelName: string;
    vin: string;
    stockNumber: string;
  };
  vehicleName?: string;
  vehicleImage?: string;
  vin?: string;
  stockNumber?: string;
  vehicleLocation?: string;
  fromZip: string;
  toZip: string;
  fromAddress: string;
  toAddress: string;
  units: number;
  enclosedTrailer: boolean;
  vehicleInoperable: boolean;
  miles: number;
  rate: number;
  eta: { min: number; max: number };
  status: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
  organization?: {
    name: string;
    logoUrl?: string;
  };
}

export interface Shipment {
  _id: string;
  quoteId?: Quote;
  preservedQuoteData?: Quote;
  status:
  | "Available for Pickup"
  | "Cancelled"
  | "Delivered"
  | "Dispatched"
  | "In-Route";
  origin: string;
  destination: string;
  requestedPickupDate: string;
  scheduledPickup?: string;
  pickedUp?: string;
  scheduledDelivery?: string;
  delivered?: string;
  trackingNumber?: string;
  createdAt: string;
  assignedDriverId?:
  | string
  | {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
  assignedAt?: string;
  driverAcceptedAt?: string;
  proofOfDelivery?: {
    imageUrl: string;
    submittedAt: string;
    note?: string;
    confirmedAt?: string;
    confirmedBy?: string;
  };
  trailerTypeRequired?: string;
  vehicleCount?: number;
  isPostedToBoard?: boolean;
  preDispatchNotes?: string;
  pendingDriverRequests?: Array<{
    driverId: string;
    driverName: string;
    requestedAt: string;
    status: "pending" | "approved" | "rejected";
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
  }>;
  carrierPayAmount?: number;
  copCodAmount?: number;
  balanceAmount?: number;
  specialInstructions?: string;
  loadSpecificTerms?: string;
  desiredDeliveryDate?: string;
  internalLoadId?: string;
  originContact?: {
    contactName?: string;
    email?: string;
    phone?: string;
    cellPhone?: string;
    buyerReferenceNumber?: string;
  };
  destinationContact?: {
    contactName?: string;
    email?: string;
    phone?: string;
    cellPhone?: string;
    buyerReferenceNumber?: string;
  };
  myRequestStatus?: "pending" | "approved" | "rejected" | null;
  myRequestedAt?: string | null;
  rejectionReason?: string | null;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  };
  organization?: {
    name: string;
    logoUrl?: string;
  };
}

export interface ShipmentStats {
  all: number;
  "Available for Pickup": number;
  Cancelled: number;
  Delivered: number;
  Dispatched: number;
  "In-Route": number;
}
