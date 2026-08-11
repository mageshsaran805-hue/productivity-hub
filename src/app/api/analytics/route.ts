import { requireUser, pool, json, errorResponse } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();

    // Weekly series (last 7 days) — one grouped query instead of 14 round-trips.
    const weekly = await pool.query(
      `WITH days AS (
         SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE, interval '1 day')::date AS day
       )
       SELECT d.day,
              COALESCE(t.cnt, 0)::int AS tasks,
              COALESCE(h.cnt, 0)::int AS habits
       FROM days d
       LEFT JOIN (
         SELECT date_trunc('day', completed_at)::date AS day, count(*) AS cnt
         FROM tasks WHERE user_id = $1 AND status = 'completed'
           AND completed_at >= (CURRENT_DATE - 6)
         GROUP BY 1
       ) t ON t.day = d.day
       LEFT JOIN (
         SELECT l.date AS day, count(*) AS cnt
         FROM habit_logs l JOIN habits h ON h.id = l.habit_id
         WHERE h.user_id = $1 AND l.completed = true AND l.date >= (CURRENT_DATE - 6)
         GROUP BY 1
       ) h ON h.day = d.day
       ORDER BY d.day`,
      [user.id]
    );

    // Monthly series (last 6 months) — one grouped query.
    const monthly = await pool.query(
      `WITH months AS (
         SELECT date_trunc('month', (CURRENT_DATE - (i || ' months')::interval))::date AS month
         FROM generate_series(5, 0, -1) AS i
       )
       SELECT m.month,
              COALESCE(t.cnt, 0)::int AS tasks,
              COALESCE(h.cnt, 0)::int AS habits
       FROM months m
       LEFT JOIN (
         SELECT date_trunc('month', completed_at)::date AS month, count(*) AS cnt
         FROM tasks WHERE user_id = $1 AND status = 'completed'
         GROUP BY 1
       ) t ON t.month = m.month
       LEFT JOIN (
         SELECT date_trunc('month', l.date)::date AS month, count(*) AS cnt
         FROM habit_logs l JOIN habits h ON h.id = l.habit_id
         WHERE h.user_id = $1 AND l.completed = true
         GROUP BY 1
       ) h ON h.month = m.month
       ORDER BY m.month`,
      [user.id]
    );

    const totals = await pool.query(
      `SELECT
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_tasks,
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND status = 'completed' AND deleted_at IS NULL)::int AS completed_tasks,
         (SELECT count(*) FROM habits WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_habits`,
      [user.id]
    );

    const t = totals.rows[0];
    const weeklyData = weekly.rows.map((r) => ({
      day: new Date(r.day).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      tasks: r.tasks,
      habits: r.habits,
    }));
    const monthlyData = monthly.rows.map((r) => ({
      month: new Date(r.month).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      tasks: r.tasks,
      habits: r.habits,
    }));

    return json({
      weeklyData,
      monthlyData,
      totalTasks: t.total_tasks,
      completedTasks: t.completed_tasks,
      totalHabits: t.total_habits,
      completionRate: t.total_tasks ? Math.round((t.completed_tasks / t.total_tasks) * 100) : 0,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
