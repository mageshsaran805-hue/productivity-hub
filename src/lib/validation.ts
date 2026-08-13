import { z } from "zod";
import { ApiError } from "./api-errors";

/**
 * Shared input validation: zod schemas for every API payload plus a UUID
 * guard. Pure module (no Next.js imports) so it can be unit-tested.
 */

export const taskCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(["backlog", "todo", "in_progress", "completed", "archived"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).optional(),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurring_rule: z.string().max(500).optional().nullable(),
  is_favorite: z.boolean().optional(),
  estimated_minutes: z.number().int().min(0).optional().nullable(),
  order: z.number().int().optional(),
});

export const taskUpdateSchema = taskCreateSchema
  .partial()
  .omit({ workspace_id: true })
  .extend({
    completed_at: z.string().optional().nullable(),
  });

export const projectCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().max(50).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  due_date: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial().omit({ workspace_id: true });

export const habitCreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  frequency_times: z.number().int().min(1).optional(),
  category_id: z.string().uuid().optional().nullable(),
  color: z.string().max(50).optional(),
  icon: z.string().max(100).optional(),
  reminder_time: z.string().optional().nullable(),
  reminder_days: z.array(z.number().int().min(0).max(6)).optional(),
});

export const habitUpdateSchema = habitCreateSchema.partial().omit({ workspace_id: true });

export const habitLogSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "date must be YYYY-MM-DD"),
  completed: z.boolean(),
  value: z.number().optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export const settingsSchema = z.object({
  notifications_email: z.boolean().optional(),
  notifications_push: z.boolean().optional(),
  notifications_reminders: z.boolean().optional(),
  theme: z.string().max(20).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  week_starts_on: z.number().int().min(0).max(6).optional(),
});

export const calendarEventCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  is_all_day: z.boolean().optional(),
  color: z.string().max(50).optional(),
});

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(50).optional(),
});

export const sendEmailSchema = z.object({
  taskIds: z.array(z.string().min(1)).max(100).optional(),
});

/** Validates a UUID path/query parameter; throws a clean 400 instead of
 *  letting Postgres fail with a cast error (500). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function requireUuid(value: string | undefined, name = "id"): string {
  if (!value || !UUID_RE.test(value)) {
    throw new ApiError(400, `Invalid ${name} (must be a UUID)`);
  }
  return value;
}
