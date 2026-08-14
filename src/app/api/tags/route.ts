import { requireUser, pool, json, errorResponse, ApiError, readJson, tagCreateSchema, rateLimit } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT t.*, COUNT(tt.task_id)::int AS task_count
       FROM tags t
       LEFT JOIN task_tags tt ON tt.tag_id = t.id
       WHERE t.user_id = $1
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [user.id]
    );
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`tag-create:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = tagCreateSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO tags (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, input.name, input.color ?? "#6366f1"]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}