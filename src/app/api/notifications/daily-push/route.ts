import { pool } from "@/lib/db";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";

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

// Daily background check (Vercel cron). Sends push notifications for:
//   1. Tasks due within the next 24h for every user.
//   2. Habit reminders scheduled for today (reminder_days includes today's
//      weekday) when the user has notifications_reminders enabled.
// Runs at most once per day on the Hobby plan.
export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { rows: users } = await pool.query(
      `SELECT DISTINCT user_id FROM tasks
       WHERE deleted_at IS NULL AND status != 'completed'
       AND due_date IS NOT NULL AND due_date <= $1
       AND due_date >= $2`,
      [tomorrow.toISOString(), now.toISOString()]
    );

    const { rows: habitUsers } = await pool.query<{ user_id: string }>(
      `SELECT DISTINCT h.user_id
       FROM habits h
       JOIN user_settings s ON s.user_id = h.user_id
       WHERE h.deleted_at IS NULL AND h.reminder_time IS NOT NULL
       AND h.reminder_days IS NOT NULL AND array_length(h.reminder_days, 1) > 0
       AND s.notifications_reminders = true`
    );

    const userIds = new Set<string>([...users.map((u) => u.user_id), ...habitUsers.map((h) => h.user_id)]);

    if (userIds.size === 0) {
      return Response.json({ sent: 0, reason: "no_due_tasks" });
    }

    let sent = 0;
    for (const userId of userIds) {
      const { rows: settings } = await pool.query<{ timezone: string }>(
        `SELECT timezone FROM user_settings WHERE user_id = $1`,
        [userId]
      );
      const tz = settings[0]?.timezone ?? "UTC";
      const weekday = weekdayToday(tz);

      const { rows: tasks } = await pool.query(
        `SELECT id, title, due_date FROM tasks
         WHERE user_id = $1 AND deleted_at IS NULL AND status != 'completed'
         AND due_date IS NOT NULL AND due_date <= $2 AND due_date >= $3
         ORDER BY due_date ASC LIMIT 10`,
        [userId, tomorrow.toISOString(), now.toISOString()]
      );

      const { rows: habits } = await pool.query<{ id: string; name: string }>(
        `SELECT id, name FROM habits
         WHERE user_id = $1 AND deleted_at IS NULL
         AND reminder_time IS NOT NULL
         AND reminder_days IS NOT NULL AND $2 = ANY(reminder_days)
         ORDER BY reminder_time ASC LIMIT 10`,
        [userId, weekday]
      );

      const { rows: subscriptions } = await pool.query<PushSubscriptionRow>(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
        [userId]
      );

      for (const sub of subscriptions) {
        for (const task of tasks) {
          const res = await sendPush(sub, {
            title: "Task due soon",
            body: `${task.title} — due ${new Date(task.due_date).toLocaleString()}`,
            url: "/app/today",
            tag: `task-${task.id}`,
          });
          if (res.ok) sent++;
        }
        for (const habit of habits) {
          const res = await sendPush(sub, {
            title: "Habit reminder",
            body: `Don't forget to ${habit.name} today`,
            url: "/app/habits",
            tag: `habit-${habit.id}-${now.toISOString().slice(0, 10)}`,
          });
          if (res.ok) sent++;
        }
      }
    }

    return Response.json({ sent });
  } catch (err) {
    console.error("daily-push error:", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
