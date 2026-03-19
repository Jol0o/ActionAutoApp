export type DriverStatus = "on-route" | "idle" | "on-break" | "waiting" | "offline";

export interface DriverTrackingItem {
  id: string;
  status: DriverStatus;
  organizationId?: string;
  coords: {
    lat: number;
    lng: number;
  };
  lastSeenAt: string;
  driver: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  shipments: {
    id: string;
    trackingNumber?: string;
    status?: string;
    origin?: string;
    destination?: string;
  }[];
}
