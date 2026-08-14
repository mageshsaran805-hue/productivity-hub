import { pool } from "@/lib/db";

export type ActivityEntityType =
  | "task"
  | "project"
  | "habit"
  | "subtask"
  | "tag"
  | "comment";

export type ActivityAction =
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "task.reopened"
  | "task.deleted"
  | "subtask.created"
  | "subtask.completed"
  | "subtask.deleted"
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "habit.created"
  | "habit.updated"
  | "habit.deleted"
  | "habit.logged"
  | "tag.created"
  | "tag.updated"
  | "tag.deleted"
  | "comment.created";

export interface ActivityRow {
  id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Appends an entry to the immutable activity_logs trail. Fire-and-forget by
 * default: callers should not fail their request if logging fails, so any
 * thrown error is swallowed here unless the caller passes `await: true`.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: ActivityEntityType,
  entityId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, metadata ?? null]
    );
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}