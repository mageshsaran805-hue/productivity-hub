import { requireUser, pool, json, errorResponse, ApiError, readJson, subtaskUpdateSchema, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; subtaskId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, subtaskId } = await params;
    const taskId = requireUuid(id);
    const stId = requireUuid(subtaskId);

    const body = await readJson<Record<string, unknown>>(req);
    const input = subtaskUpdateSchema.parse(body);

    const allowed = ["title", "completed", "order"];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in input) {
        values.push((input as Record<string, unknown>)[key] ?? null);
        sets.push(`"${key}" = $${values.length}`);
      }
    }
    if (sets.length === 0) throw new ApiError(400, "No fields to update");

    values.push(user.id, taskId, stId);
    const { rows } = await pool.query(
      `UPDATE subtasks SET ${sets.join(", ")}
       WHERE id = $${values.length} AND task_id = $${values.length - 1}
         AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = subtasks.task_id AND t.user_id = $${values.length - 2} AND t.deleted_at IS NULL)
       RETURNING *`,
      values
    );
    if (rows.length === 0) throw new ApiError(404, "Subtask not found");
    return json(rows[0]);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, subtaskId } = await params;
    const taskId = requireUuid(id);
    const stId = requireUuid(subtaskId);

    const result = await pool.query(
      `DELETE FROM subtasks
       WHERE id = $1 AND task_id = $2
         AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = subtasks.task_id AND t.user_id = $3 AND t.deleted_at IS NULL)`,
      [stId, taskId, user.id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Subtask not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}