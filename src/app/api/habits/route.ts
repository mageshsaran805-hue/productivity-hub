import { requireUser, pool, json, errorResponse, ApiError, readJson, habitCreateSchema, rateLimit, assertOwned } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { rows } = await pool.query(
      `SELECT * FROM habits WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 500`,
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
    if (!rateLimit(`habit-create:${user.id}`, 60, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = habitCreateSchema.parse(body);

    await assertOwned("workspaces", input.workspace_id, user.id, "workspace");
    if (input.category_id) {
      await assertOwned("habit_categories", input.category_id, user.id, "category");
    }

    const { rows } = await pool.query(
      `INSERT INTO habits (user_id, workspace_id, name, description, frequency, frequency_times, category_id, color, icon, reminder_time, reminder_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        user.id,
        input.workspace_id,
        input.name,
        input.description ?? null,
        input.frequency ?? "daily",
        input.frequency_times ?? 1,
        input.category_id ?? null,
        input.color ?? "#6366f1",
        input.icon ?? "Target",
        input.reminder_time ?? null,
        input.reminder_days ?? null,
      ]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
