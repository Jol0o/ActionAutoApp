export type NotificationType = 
  | 'quote_created'
  | 'quote_updated'
  | 'quote_deleted'
  | 'shipment_created'
  | 'shipment_updated'
  | 'shipment_deleted'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'guest_response' // NEW: For guest RSVP changes
  | 'password_changed'
  | 'email_changed'
  | 'profile_updated'
  | 'driver_request'
  | 'driver_request_approved'
  | 'driver_request_rejected';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    quoteId?: string;
    shipmentId?: string;
    appointmentId?: string;
    guestEmail?: string;
    guestName?: string;
    guestPhone?: string;
    status?: 'accepted' | 'declined' | 'pending';
    previousStatus?: string;
    respondedAt?: string;
    vehicleName?: string;
    customerName?: string;
    trackingNumber?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  quoteCreated: boolean;
  quoteUpdated: boolean;
  quoteDeleted: boolean;
  shipmentCreated: boolean;
  shipmentUpdated: boolean;
  shipmentDeleted: boolean;
  passwordChanged: boolean;
  emailChanged: boolean;
  profileUpdated: boolean;
  loginAlerts: boolean;
  appointmentCreated: boolean;
  appointmentUpdated: boolean;
  appointmentCancelled: boolean;
  driverRequests: boolean;
  crmActivity: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  quoteCreated: true,
  quoteUpdated: true,
  quoteDeleted: true,
  shipmentCreated: true,
  shipmentUpdated: true,
  shipmentDeleted: true,
  passwordChanged: true,
  emailChanged: true,
  profileUpdated: true,
  loginAlerts: true,
  appointmentCreated: true,
  appointmentUpdated: true,
  appointmentCancelled: true,
  driverRequests: true,
  crmActivity: true,
};