import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";

export const runtime = "nodejs";

// Authenticated trigger: sends push notifications for the current user's tasks
// that are due within the next 24h (or overdue). Used when the user visits the
// app so they get immediate feedback even if the daily cron hasn't run yet.
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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
      return Response.json({ sent: 0, reason: subscriptions.length === 0 ? "no_subscriptions" : "no_tasks_due" });
    }

    let sent = 0;
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

    return Response.json({ sent });
  } catch (err) {
    console.error("send-push error:", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
