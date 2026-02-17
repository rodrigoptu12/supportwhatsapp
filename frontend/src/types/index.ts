export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'attendant' | 'supervisor';
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  assignedUserId?: string;
  status: 'open' | 'closed' | 'waiting';
  channel: string;
  currentMenuLevel: string;
  isBotActive: boolean;
  needsHumanAttention: boolean;
  metadata: Record<string, unknown>;
  startedAt: string;
  endedAt?: string;
  lastMessageAt: string;
  customer: Pick<Customer, 'id' | 'name' | 'phoneNumber'>;
  assignedTo?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  messages?: Array<Pick<Message, 'content' | 'sentAt' | 'senderType'>>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'bot' | 'attendant' | 'system';
  senderUserId?: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  isRead: boolean;
  sentAt: string;
  createdAt: string;
  senderUser?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationStats {
  open: number;
  waiting: number;
  closed: number;
  total: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
