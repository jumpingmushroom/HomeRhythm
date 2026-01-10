import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const taskSchemaBase = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  schedule_type: z.enum(['once', 'recurring']),
  due_date: z.string().optional().nullable(), // ISO 8601 date format
  flexibility_window: z.enum(['exact_date', 'within_week', 'within_month', 'within_year']).optional().nullable(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'seasonal']).optional().nullable(),
  recurrence_interval: z.number().int().positive().optional().nullable(),
  recurrence_config: z.string().optional().nullable(), // JSON string
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  estimated_time: z.number().int().positive().optional().nullable(),
  estimated_cost: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigned_to: z.number().int().positive().optional().nullable(),
});

export const taskSchema = taskSchemaBase.refine((data) => {
  // If schedule_type is 'recurring', recurrence_pattern must be provided
  if (data.schedule_type === 'recurring' && !data.recurrence_pattern) {
    return false;
  }
  // If schedule_type is 'once', recurrence_pattern should not be provided
  if (data.schedule_type === 'once' && data.recurrence_pattern) {
    return false;
  }
  return true;
}, {
  message: "For recurring tasks, recurrence_pattern is required. For one-time tasks, recurrence_pattern should not be set.",
  path: ['schedule_type'],
});

export const taskSchemaPartial = taskSchemaBase.partial();

export const completionSchema = z.object({
  completed_at: z.string(),
  completion_notes: z.string().optional().nullable(),
});

export const householdSchema = z.object({
  name: z.string().min(1).max(100),
});

export const inviteSchema = z.object({
  email: z.string().email(),
});

export const acceptInviteSchema = z.object({
  invite_code: z.string().min(1),
});

// Advanced Task Features Validation

// Subtasks
export const subtaskSchema = z.object({
  text: z.string().min(1).max(500),
  completed: z.number().int().min(0).max(1).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const subtaskReorderSchema = z.object({
  subtasks: z.array(z.object({
    id: z.number().int().positive(),
    position: z.number().int().nonnegative(),
  })),
});

// Dependencies
export const dependencySchema = z.object({
  task_id: z.number().int().positive(),
  depends_on_task_id: z.number().int().positive(),
}).refine(data => data.task_id !== data.depends_on_task_id, {
  message: "A task cannot depend on itself",
  path: ['depends_on_task_id'],
});

// Time Tracking
export const timeEntryStartSchema = z.object({
  started_at: z.string().optional(), // ISO timestamp, defaults to now
});

export const timeEntryStopSchema = z.object({
  ended_at: z.string().optional(), // ISO timestamp, defaults to now
  notes: z.string().max(1000).optional().nullable(),
});

export const timeEntryUpdateSchema = z.object({
  notes: z.string().max(1000).optional().nullable(),
  duration: z.number().int().positive().optional(), // Manual override in seconds
});

// Comments
export const commentSchema = z.object({
  comment_text: z.string().min(1).max(2000),
});

// Template Generation
export const templateGenerateSchema = z.object({
  due_date: z.string().optional().nullable(),
  assigned_to: z.number().int().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  // Optional translated content (for i18n support)
  translated_title: z.string().min(1).max(200).optional(),
  translated_description: z.string().optional().nullable(),
  translated_subtasks: z.array(z.string()).optional(),
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
