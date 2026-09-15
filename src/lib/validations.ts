import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const createHouseSchema = z.object({
  name: z.string().min(1, 'House name is required').max(50, 'House name is too long'),
})

export const joinHouseSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
})

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title is too long'),
  description: z.string().max(500).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['none', 'low', 'medium', 'high']).optional(),
  visibility: z.enum(['shared', 'private']).optional(),
  recurringRule: z.object({
    frequency: z.enum(['daily', 'weekday', 'weekly', 'custom']),
    days: z.array(z.number().min(0).max(6)).optional(),
  }).optional().nullable(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'completed', 'skipped']).optional(),
})

export const createTargetSchema = z.object({
  title: z.string().min(1, 'Target title is required').max(200),
  description: z.string().max(500).optional(),
  targetType: z.enum(['tasks_completed', 'custom_count']).optional(),
  targetValue: z.number().min(1, 'Target value must be at least 1'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
})

export const updateTargetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  targetValue: z.number().min(1).optional(),
  currentValue: z.number().min(0).optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().optional().nullable(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

export const updateHouseSchema = z.object({
  name: z.string().min(1).max(50),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateHouseInput = z.infer<typeof createHouseSchema>
export type JoinHouseInput = z.infer<typeof joinHouseSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateTargetInput = z.infer<typeof createTargetSchema>
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
