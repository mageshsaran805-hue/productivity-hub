import { requireUser, pool, json, errorResponse } from "@/lib/db";

export const runtime = "nodejs";

/**
 * A habit is "due today" when:
 *  - it is daily, OR
 *  - it has a weekday schedule (reminder_days) that includes today, OR
 *  - it has no weekday schedule defined (treat as daily so it stays in the plan)
 */
const DUE_TODAY = `(
  h.frequency = 'daily'
  OR h.reminder_days IS NULL
  OR array_length(h.reminder_days, 1) IS NULL
  OR array_length(h.reminder_days, 1) = 0
  OR EXTRACT(DOW FROM CURRENT_DATE)::int = ANY(h.reminder_days)
)`;

export async function GET() {
  try {
    const user = await requireUser();

    const { rows } = await pool.query(
      `SELECT
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND status = 'completed'
            AND completed_at >= CURRENT_DATE)::int AS tasks_today,
         (SELECT count(*) FROM tasks WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_tasks,
         (SELECT count(*) FROM habit_logs l JOIN habits h ON h.id = l.habit_id
            WHERE h.user_id = $1 AND h.deleted_at IS NULL
              AND l.completed = true AND l.date = CURRENT_DATE
              AND ${DUE_TODAY})::int AS habits_done,
         (SELECT count(*) FROM habits h
            WHERE h.user_id = $1 AND h.deleted_at IS NULL
              AND ${DUE_TODAY})::int AS habits_planned,
         (SELECT count(*) FROM habits WHERE user_id = $1 AND deleted_at IS NULL)::int AS total_habits`,
      [user.id]
    );

    return json({
      tasksToday: rows[0].tasks_today,
      totalTasks: rows[0].total_tasks,
      habitsDone: rows[0].habits_done,
      habitsPlanned: rows[0].habits_planned,
      totalHabits: rows[0].total_habits,
      today: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
