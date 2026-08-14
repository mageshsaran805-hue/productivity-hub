import { requireUser, pool, json, errorResponse, ApiError, readJson, taskUpdateSchema, rateLimit, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedTask(userId: string, taskId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [taskId, userId]
  );
  if (rows.length === 0) throw new ApiError(404, "Task not found");
  return rows[0];
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const task = await getOwnedTask(user.id, id);
    return json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!rateLimit(`task-update:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const id = requireUuid((await params).id);
    await getOwnedTask(user.id, id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = taskUpdateSchema.parse(body);

    const allowed = [
      "project_id",
      "parent_id",
      "title",
      "description",
      "status",
      "priority",
      "due_date",
      "start_date",
      "remind_before_minutes",
      "is_recurring",
      "recurring_rule",
      "is_favorite",
      "estimated_minutes",
      "order",
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
      `UPDATE tasks SET ${sets.join(", ")} WHERE user_id = $${values.length - 1} AND id = $${values.length} RETURNING *`,
      values
    );
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
      `UPDATE tasks SET deleted_at = now() WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Task not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
