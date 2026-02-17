import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'attendant', 'supervisor']).default('attendant'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export type LoginDTO = z.infer<typeof loginSchema>['body'];
export type RegisterDTO = z.infer<typeof registerSchema>['body'];

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
