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
  _id: string;
  sender?: Participant | string; // Made optional
  senderId?: string; // Added to support useConversations
  content: string;
  type?: 'text' | 'file' | 'image' | 'appointment'; // Made optional
  metadata?: any;
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'individual'; // Added individual to support mismatch
  name?: string;
  participants: Participant[]; // Keep as Participant[], assume data matches
  messages: Message[];

  hasAppointment?: boolean; // Made optional
  appointmentId?: Appointment | string | any; // Relaxed type

  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: Participant;

  createdBy?: Participant;
  avatar?: string;

  isArchived?: boolean; // Made optional
  archivedBy?: string[]; // Made optional

  createdAt?: string; // Made optional
  updatedAt: string;
}