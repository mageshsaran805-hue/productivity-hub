import { requireUser, pool, json, errorResponse, requireUuid } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const MAX_ROWS = 100;

const querySchema = z.object({
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_ROWS).optional(),
  before: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams));

    const params: unknown[] = [user.id];
    const conditions = ["user_id = $1"];
    let sql = `SELECT * FROM activity_logs WHERE ${conditions.join(" AND ")}`;

    if (q.entity_type) {
      params.push(q.entity_type);
      sql += ` AND entity_type = $${params.length}`;
    }
    if (q.entity_id) {
      const id = requireUuid(q.entity_id, "entity_id");
      params.push(id);
      sql += ` AND entity_id = $${params.length}`;
    }
    if (q.before) {
      params.push(q.before);
      sql += ` AND created_at < $${params.length}`;
    }

    params.push(q.limit ?? 50);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const { rows } = await pool.query(sql, params);
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}