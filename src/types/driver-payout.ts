export interface DriverPayout {
  _id: string;
  organizationId: string;
  shipmentId: string | { _id: string; trackingNumber?: string; origin?: string; destination?: string };
  driverId: string | { _id: string; name: string; email: string; avatar?: string };
  driverName: string;
  driverEmail: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  stripeTransferId?: string;
  payoutNumber?: string;
  paidAt?: string;
  failureReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableShipment {
  _id: string;
  trackingNumber?: string;
  origin: string;
  destination: string;
  delivered?: string;
  createdAt: string;
  assignedDriverId: {
    _id: string;
    name: string;
    email: string;
    stripeConnectAccountId?: string;
  };
  preservedQuoteData?: {
    rate?: number;
    vehicleName?: string;
    firstName?: string;
    lastName?: string;
  };
  existingPayout?: DriverPayout | null;
  pendingConfirmation?: boolean;
  proofOfDelivery?: {
    imageUrl: string;
    submittedAt: string;
    note?: string;
    confirmedAt?: string;
  };
}

export interface DriverPayoutStats {
  totalPaid: number;
  totalPending: number;
  countPaid: number;
  countPending: number;
  countFailed: number;
}

export interface CreatePayoutData {
  shipmentId: string;
  driverId: string;
  amount: number;
  description?: string;
  notes?: string;
}

export interface StripeConnectStatus {
  connected: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}
