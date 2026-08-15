import { requireUser, pool, json, errorResponse, ApiError, readJson, habitLogSchema, rateLimit } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  habit_id: z.string().min(1).optional(),
  habit_ids: z.string().optional(), // comma-separated
  start: z.string().optional(),
  end: z.string().optional(),
});

async function assertOwnsHabit(userId: string, habitId: string) {
  const { rows } = await pool.query(
    `SELECT id FROM habits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [habitId, userId]
  );
  if (rows.length === 0) throw new ApiError(404, "Habit not found");
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = listQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (!q.habit_id && !q.habit_ids) {
      throw new ApiError(400, "habit_id or habit_ids is required");
    }

    // Validate ownership of every requested habit (guards cross-user reads).
    const habitIds = q.habit_id ? [q.habit_id] : q.habit_ids!.split(",").map((s) => s.trim()).filter(Boolean);
    for (const hid of habitIds) {
      await assertOwnsHabit(user.id, hid);
    }

    const params: unknown[] = [user.id, habitIds];
    let sql = `SELECT l.id, l.habit_id, l.date::text AS date, l.completed, l.value, l.note, l.created_at
               FROM habit_logs l JOIN habits h ON h.id = l.habit_id
               WHERE h.user_id = $1 AND l.habit_id = ANY($2)`;
    if (q.start) {
      params.push(q.start);
      sql += ` AND l.date >= $${params.length}`;
    }
    if (q.end) {
      params.push(q.end);
      sql += ` AND l.date <= $${params.length}`;
    }
    sql += " ORDER BY l.date ASC LIMIT 1000";

    const { rows } = await pool.query(sql, params);
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<Record<string, unknown>>(req);
    const input = habitLogSchema.parse(body);

    await assertOwnsHabit(user.id, input.habit_id);
    if (!rateLimit(`habit-log:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }

    const { rows } = await pool.query(
      `INSERT INTO habit_logs (habit_id, date, completed, value, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (habit_id, date) DO UPDATE SET completed = EXCLUDED.completed, value = EXCLUDED.value, note = EXCLUDED.note
       RETURNING id, habit_id, date::text AS date, completed, value, note, created_at`,
      [input.habit_id, input.date, input.completed, input.value ?? null, input.note ?? null]
    );
    if (input.completed) {
      await logActivity(user.id, "habit.logged", "habit", input.habit_id, { date: input.date });
    }
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
