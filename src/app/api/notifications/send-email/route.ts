import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let _resend: import("resend").Resend | null = null;
async function getResend() {
  if (!_resend) {
    const { Resend } = await import("resend");
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskIds } = await req.json() as { taskIds?: string[] };

    // Fetch tasks due within the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasksResult = await pool.query(
      `SELECT id, title, due_date, status FROM tasks
       WHERE user_id = $1 AND deleted_at IS NULL AND due_date IS NOT NULL
       AND due_date <= $2 AND due_date >= $3
       ${taskIds?.length ? "AND id = ANY($4)" : ""}
       ORDER BY due_date ASC`,
      taskIds?.length
        ? [session.user.id, tomorrow.toISOString(), now.toISOString(), taskIds]
        : [session.user.id, tomorrow.toISOString(), now.toISOString()]
    );

    if (tasksResult.rows.length === 0) {
      return Response.json({ sent: false, reason: "no_tasks_due" });
    }

    // Check user settings
    const settingsResult = await pool.query(
      "SELECT notifications_email FROM user_settings WHERE user_id = $1",
      [session.user.id]
    );

    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].notifications_email) {
      return Response.json({ sent: false, reason: "email_disabled" });
    }

    const { rows: tasks } = tasksResult;

    // ponytail: plain text email, upgrade to SendGrid template if open rates matter
    const resend = await getResend();
    const { error } = await resend.emails.send({
      from: "Productivity Hub <onboarding@resend.dev>",
      to: session.user.email,
      subject: `${tasks.length} task${tasks.length > 1 ? "s" : ""} due soon`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>⏰ Tasks Due Soon</h2>
        <ul>${tasks.map((t: { title: string; due_date: string }) =>
          `<li><strong>${t.title}</strong> — due ${new Date(t.due_date).toLocaleString()}</li>`
        ).join("")}</ul>
      </div>`,
    });

    if (error) throw error;

    return Response.json({ sent: true, count: tasks.length });
  } catch (err) {
    console.error("send-email error:", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
