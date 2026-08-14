import { requireUser, pool, json, errorResponse } from "@/lib/db";

export const runtime = "nodejs";

/** Count of "unread" notifications: tasks that are overdue or due today and
 *  not yet completed. Powers the bell badge in the top nav. */
export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM tasks
       WHERE user_id = $1
         AND status != 'completed'
         AND deleted_at IS NULL
         AND due_date IS NOT NULL
         AND due_date <= CURRENT_DATE + INTERVAL '1 day'`,
      [user.id]
    );
    return json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    return errorResponse(err);
  }
}