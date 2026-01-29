import { NotificationPreferences } from './notification';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  notificationPreferences: NotificationPreferences;
  theme: 'light' | 'dark';
  subscription?: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'cancelled';
    startDate: string;
    endDate?: string;
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateEmailRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  notificationPreferences?: Partial<NotificationPreferences>;
  theme?: 'light' | 'dark';
}