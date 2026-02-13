export interface VehicleInterest {
  year: string;
  make: string;
  model: string;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string; // e.g., "ADF Email", "Website", "Walk-in"
  status: string; // e.g., "New", "Contacted", "Appointment Set"
  vehicle: VehicleInterest;
  comments: string;
  createdAt: string;
  updatedAt: string;
}