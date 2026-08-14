import { requireUser, pool, json, errorResponse, ApiError, readJson, rateLimit } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(300),
  color: z.string().max(50).optional(),
  icon: z.string().max(100).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(h.id)::int AS habit_count
       FROM habit_categories c
       LEFT JOIN habits h ON h.category_id = c.id AND h.deleted_at IS NULL
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.name ASC`,
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
    if (!rateLimit(`habit-category-create:${user.id}`, 60, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = createSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO habit_categories (user_id, name, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, input.name, input.color ?? "#6366f1", input.icon ?? "Star"]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}