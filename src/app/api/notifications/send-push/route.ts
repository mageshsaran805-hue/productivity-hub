import { requireUser, pool, json } from "@/lib/db";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

// Authenticated trigger: sends push notifications for the current user's tasks
// that are due within the next 24h (or overdue). Used when the user visits the
// app so they get immediate feedback even if the daily cron hasn't run yet.
// Also writes in-app notification rows (deduped) so the feed stays in sync.
export async function POST() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { rows: tasks } = await pool.query(
      `SELECT id, title, due_date FROM tasks
       WHERE user_id = $1 AND deleted_at IS NULL AND status != 'completed'
       AND due_date IS NOT NULL AND due_date <= $2
       ORDER BY due_date ASC LIMIT 10`,
      [userId, tomorrow.toISOString()]
    );

    const { rows: subscriptions } = await pool.query<PushSubscriptionRow>(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (tasks.length === 0 || subscriptions.length === 0) {
      return json({ sent: 0, reason: subscriptions.length === 0 ? "no_subscriptions" : "no_tasks_due" });
    }

    let sent = 0;
    for (const sub of subscriptions) {
      for (const task of tasks) {
        await createNotification(userId, {
          type: "due_date",
          title: "Task due soon",
          message: `${task.title} — due ${new Date(task.due_date).toLocaleString()}`,
          data: { task_id: task.id, due_date: task.due_date },
          dedupKey: `task-due:${task.id}:${new Date(task.due_date).toISOString().slice(0, 10)}`,
        });
        const res = await sendPush(sub, {
          title: "Task due soon",
          body: `${task.title} — due ${new Date(task.due_date).toLocaleString()}`,
          url: "/app/today",
          tag: `task-${task.id}`,
        });
        if (res.ok) sent++;
      }
    }

    return json({ sent });
  } catch (err) {
    console.error("send-push error:", err);
    return json({ error: "Failed to send" }, 500);
  }
}
