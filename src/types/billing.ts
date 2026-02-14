export interface Payment {
  _id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  quoteId?: string;
  shipmentId?: string;
  invoiceNumber?: string;
  failureReason?: string;
  notes?: string;
  paidAt?: string;
  dueDate?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  byStatus: Record<string, { count: number; totalAmount: number }>;
  totalCount: number;
  totalRevenue: number;
  pendingAmount: number;
}

export interface CreatePaymentData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  currency?: string;
  description: string;
  quoteId?: string;
  shipmentId?: string;
  dueDate?: string;
  notes?: string;
}