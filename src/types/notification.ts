export type NotificationType = 
  | 'quote_created'
  | 'quote_updated'
  | 'quote_deleted'
  | 'shipment_created'
  | 'shipment_updated'
  | 'shipment_deleted'
  | 'password_changed'
  | 'email_changed'
  | 'profile_updated';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    quoteId?: string;
    shipmentId?: string;
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
};