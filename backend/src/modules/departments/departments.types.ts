import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const departmentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateDepartmentDTO = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentDTO = z.infer<typeof updateDepartmentSchema>['body'];
