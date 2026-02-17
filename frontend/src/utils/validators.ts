import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
