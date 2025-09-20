import { z } from 'zod';

export const userRoleSchema = z.enum(['marketer', 'analyst', 'admin']);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: userRoleSchema,
  sso_sub: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: userRoleSchema.default('marketer'),
  sso_sub: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  role: userRoleSchema.optional(),
}).partial();

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;