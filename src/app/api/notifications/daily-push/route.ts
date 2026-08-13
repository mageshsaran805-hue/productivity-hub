import { pool } from "@/lib/db";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";

// Daily background check (Vercel cron). Finds all tasks due in the next 24h
// for every user and sends push notifications to their subscribed devices.
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

    if (users.length === 0) {
      return Response.json({ sent: 0, reason: "no_due_tasks" });
    }

    let sent = 0;
    for (const { user_id: userId } of users) {
      const { rows: tasks } = await pool.query(
        `SELECT id, title, due_date FROM tasks
         WHERE user_id = $1 AND deleted_at IS NULL AND status != 'completed'
         AND due_date IS NOT NULL AND due_date <= $2 AND due_date >= $3
         ORDER BY due_date ASC LIMIT 10`,
        [userId, tomorrow.toISOString(), now.toISOString()]
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
      }
    }

    return Response.json({ sent });
  } catch (err) {
    console.error("daily-push error:", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
