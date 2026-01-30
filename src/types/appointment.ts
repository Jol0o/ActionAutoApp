export type AppointmentType = 'in-person' | 'phone' | 'video' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';

export interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Appointment {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  
  createdBy: Participant;
  participants: Participant[];
  
  conversationId?: string;
  vehicleId?: string;
  quoteId?: string;
  shipmentId?: string;
  
  reminderSent: boolean;
  reminderTime?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id?: string;
  sender: Participant | string;
  content: string;
  type: 'text' | 'file' | 'image' | 'appointment';
  metadata?: any;
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Participant[];
  messages: Message[];
  
  hasAppointment: boolean;
  appointmentId?: Appointment;
  
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: Participant;
  
  createdBy?: Participant;
  avatar?: string;
  
  isArchived: boolean;
  archivedBy: string[];
  
  createdAt: string;
  updatedAt: string;
}