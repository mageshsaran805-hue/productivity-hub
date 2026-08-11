import { requireUser, pool, json, errorResponse } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();

    const { rows } = await pool.query(
      `SELECT
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND status = 'completed'
            AND completed_at >= CURRENT_DATE)::int AS tasks_today,
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_tasks,
         (SELECT count(*) FROM habit_logs l JOIN habits h ON h.id = l.habit_id
            WHERE h.user_id = $1 AND l.completed = true AND l.date = CURRENT_DATE)::int AS habits_done,
         (SELECT count(*) FROM habits WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_habits`,
      [user.id]
    );

    return json({
      tasksToday: rows[0].tasks_today,
      totalTasks: rows[0].total_tasks,
      habitsDone: rows[0].habits_done,
      totalHabits: rows[0].total_habits,
      today: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
