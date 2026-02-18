export interface DriverRequest {
  _id: string;
  driverUserId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  dealerEmail: string;
  organizationId: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverRequestStatus {
  _id: string;
  status: "pending" | "approved" | "rejected";
  organizationId?: {
    _id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  dealerEmail: string;
  createdAt: string;
  reviewedAt?: string;
}
