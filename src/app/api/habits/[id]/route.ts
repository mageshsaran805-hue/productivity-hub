import { requireUser, pool, json, errorResponse, ApiError, readJson, habitUpdateSchema, requireUuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedHabit(userId: string, habitId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [habitId, userId]
  );
  if (rows.length === 0) throw new ApiError(404, "Habit not found");
  return rows[0];
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    return json(await getOwnedHabit(user.id, id));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    await getOwnedHabit(user.id, id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = habitUpdateSchema.parse(body);

    const allowed = [
      "name",
      "description",
      "frequency",
      "frequency_times",
      "category_id",
      "color",
      "icon",
      "reminder_time",
      "reminder_days",
    ];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in input) {
        values.push((input as Record<string, unknown>)[key] ?? null);
        sets.push(`"${key}" = $${values.length}`);
      }
    }
    if (sets.length === 0) throw new ApiError(400, "No fields to update");

    values.push(user.id, id);
    const { rows } = await pool.query(
      `UPDATE habits SET ${sets.join(", ")} WHERE user_id = $${values.length - 1} AND id = $${values.length} RETURNING *`,
      values
    );
    await logActivity(user.id, "habit.updated", "habit", id, { name: rows[0].name });
    return json(rows[0]);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const result = await pool.query(
      `UPDATE habits SET deleted_at = now() WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id, name`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Habit not found");
    await logActivity(user.id, "habit.deleted", "habit", id, { name: result.rows[0].name });
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
