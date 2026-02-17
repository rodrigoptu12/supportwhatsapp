import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
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

export type UserRole = 'admin' | 'attendant' | 'supervisor';

export type ConversationStatus = 'open' | 'closed' | 'waiting';

export type SenderType = 'customer' | 'bot' | 'attendant' | 'system';

export type MessageType = 'text' | 'image' | 'audio' | 'document';
