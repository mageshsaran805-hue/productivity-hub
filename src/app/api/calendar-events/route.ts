import { requireUser, pool, json, errorResponse } from "@/lib/db";
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
