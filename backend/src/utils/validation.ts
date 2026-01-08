import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  recurrence_type: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly', 'seasonal']),
  recurrence_interval: z.number().int().positive().optional().nullable(),
  recurrence_config: z.string().optional().nullable(), // JSON string
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  estimated_time: z.number().int().positive().optional().nullable(),
  estimated_cost: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const completionSchema = z.object({
  completed_at: z.string(),
  completion_notes: z.string().optional().nullable(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
