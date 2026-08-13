import { requireUser, pool, json, errorResponse, ApiError, readJson, calendarEventCreateSchema, rateLimit } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = listQuerySchema.parse(Object.fromEntries(url.searchParams));

    const params: unknown[] = [user.id];
    let sql = `SELECT * FROM calendar_events WHERE user_id = $1`;
    if (q.start) {
      params.push(q.start);
      sql += ` AND start_date >= $${params.length}`;
    }
    if (q.end) {
      params.push(q.end);
      sql += ` AND start_date <= $${params.length}`;
    }
    sql += " ORDER BY start_date ASC LIMIT 1000";

    const { rows } = await pool.query(sql, params);
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`calendar-event-create:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = calendarEventCreateSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO calendar_events (user_id, title, description, start_date, end_date, is_all_day, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.id,
        input.title,
        input.description ?? null,
        input.start_date,
        input.end_date,
        input.is_all_day ?? false,
        input.color ?? "#6366f1",
      ]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
