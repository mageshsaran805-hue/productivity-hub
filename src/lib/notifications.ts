import { pool } from "@/lib/db";

export type NotificationType = "task_reminder" | "habit_reminder" | "due_date" | "achievement" | "system";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Inserts a notification row, honoring the dedup_key unique index so repeated
 * scans never create duplicates for the same event.
 * Returns the row if inserted, or null when a duplicate was skipped.
 */
export async function createNotification(
  userId: string,
  input: { type: NotificationType; title: string; message?: string; data?: Record<string, unknown>; dedupKey?: string }
): Promise<NotificationRow | null> {
  const { rows } = await pool.query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, title, message, data, dedup_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING
     RETURNING id, user_id, type, title, message, read, data, created_at`,
    [userId, input.type, input.title, input.message ?? null, input.data ?? null, input.dedupKey ?? null]
  );
  return rows[0] ?? null;
}

/** Marks a single notification read; returns true when a row was updated. */
export async function markRead(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notifications SET read = true WHERE user_id = $1 AND id = $2 AND NOT read`,
    [userId, id]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Marks every notification read for the user. */
export async function markAllRead(userId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE notifications SET read = true WHERE user_id = $1 AND NOT read`,
    [userId]
  );
  return result.rowCount ?? 0;
}

/** Counts unread notifications. */
export async function countUnread(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND NOT read`,
    [userId]
  );
  return Number(rows[0]?.count ?? 0);
}

function weekdayToday(timezone: string): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).formatToParts(now);
  const name = parts.find((p) => p.type === "weekday")?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[name] ?? now.getDay();
}

function timeOfDayMinutes(timezone: string): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "0";
  return Number(hour) * 60 + Number(minute);
}

function localDateISO(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`;
}

/**
 * Scans the user's tasks and habits and inserts any notifications that are due
 * right now, skipping anything already inserted via dedup_key.
 *
 * Returns the newly created notification rows (empty array when nothing is due).
 */
export async function generateDueNotifications(userId: string): Promise<NotificationRow[]> {
  const created: NotificationRow[] = [];

  const { rows: settings } = await pool.query<{ timezone: string }>(
    `SELECT timezone FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  const tz = settings[0]?.timezone ?? "UTC";

  // ── Tasks ────────────────────────────────────────────────────────────────
  // A reminder is due when remind_before_minutes is set and the lead time has
  // elapsed; otherwise a due_date notice fires when the task is overdue or due
  // today. Only active (non-completed, non-deleted) tasks with a due date.
  const { rows: tasks } = await pool.query<{
    id: string;
    title: string;
    due_date: string;
    remind_before_minutes: number | null;
    status: string;
  }>(
    `SELECT id, title, due_date, remind_before_minutes, status
     FROM tasks
     WHERE user_id = $1 AND deleted_at IS NULL AND status != 'completed'
       AND due_date IS NOT NULL`,
    [userId]
  );

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    const dueMs = new Date(task.due_date).getTime();

    if (task.remind_before_minutes != null && task.remind_before_minutes > 0) {
      const reminderMs = dueMs - task.remind_before_minutes * 60 * 1000;
      if (reminderMs <= nowMs && dueMs > nowMs) {
        const row = await createNotification(userId, {
          type: "task_reminder",
          title: "Task due soon",
          message: `${task.title} — due ${new Date(task.due_date).toLocaleString()}`,
          data: { task_id: task.id, due_date: task.due_date },
          dedupKey: `task:${task.id}`,
        });
        if (row) created.push(row);
      }
    } else if (dueMs <= nowMs || dueMs < todayStart.getTime() + dayMs) {
      const overdue = dueMs < todayStart.getTime();
      const row = await createNotification(userId, {
        type: "due_date",
        title: overdue ? "Task overdue" : "Task due today",
        message: overdue
          ? `${task.title} is overdue`
          : `${task.title} is due today`,
        data: { task_id: task.id, due_date: task.due_date },
        dedupKey: `task-due:${task.id}:${new Date(task.due_date).toISOString().slice(0, 10)}`,
      });
      if (row) created.push(row);
    }
  }

  // ── Habits ───────────────────────────────────────────────────────────────
  // Reminder fires on the scheduled weekday once reminder_time has passed and
  // the habit hasn't been logged yet today.
  const weekday = weekdayToday(tz);
  const nowMinutes = timeOfDayMinutes(tz);
  const dateISO = localDateISO(tz);

  const { rows: habits } = await pool.query<{
    id: string;
    name: string;
    reminder_time: string;
    reminder_days: number[];
  }>(
    `SELECT id, name, reminder_time, reminder_days
     FROM habits
     WHERE user_id = $1 AND deleted_at IS NULL
       AND reminder_time IS NOT NULL
       AND reminder_days IS NOT NULL`,
    [userId]
  );

  for (const habit of habits) {
    if (!habit.reminder_days.includes(weekday)) continue;

    const [h, m] = habit.reminder_time.split(":").map(Number);
    const reminderMinutes = h * 60 + m;
    if (nowMinutes < reminderMinutes) continue;

    const { rows: logs } = await pool.query<{ id: string }>(
      `SELECT id FROM habit_logs WHERE habit_id = $1 AND date = $2 LIMIT 1`,
      [habit.id, dateISO]
    );
    if (logs.length > 0) continue;

    const row = await createNotification(userId, {
      type: "habit_reminder",
      title: "Habit reminder",
      message: `Don't forget to ${habit.name} today`,
      data: { habit_id: habit.id, date: dateISO },
      dedupKey: `habit:${habit.id}:${dateISO}`,
    });
    if (row) created.push(row);
  }

  return created;
}