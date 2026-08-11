import { requireUser, pool, json, errorResponse, ApiError, readJson, workspaceCreateSchema, rateLimit } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100`,
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
    if (!rateLimit(`workspace-create:${user.id}`, 30, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = workspaceCreateSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO workspaces (user_id, name, description, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, input.name, input.description ?? null, input.color ?? "#6366f1"]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
