import { requireUser, pool, json, errorResponse, ApiError, readJson, taskUpdateSchema, rateLimit, requireUuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { nextOccurrence } from "@/lib/recurring";

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

async function rolloverRecurringTask(userId: string, task: Record<string, unknown>) {
  const nextDue = nextOccurrence(task as never);
  if (!nextDue) return;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (
         user_id, workspace_id, project_id, parent_id, title, description,
         status, priority, due_date, start_date, remind_before_minutes,
         is_recurring, recurring_rule, is_favorite, estimated_minutes, "order"
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'todo', $7, $8, $9, $10, true, $11, $12, $13, $14)
       RETURNING id`,
      [
        userId,
        task.workspace_id,
        task.project_id ?? null,
        task.parent_id ?? null,
        task.title,
        task.description ?? null,
        task.priority ?? "none",
        nextDue,
        task.start_date ?? null,
        task.remind_before_minutes ?? null,
        task.recurring_rule,
        task.is_favorite ?? false,
        task.estimated_minutes ?? null,
        task.order ?? 0,
      ]
    );
    await logActivity(userId, "task.created", "task", rows[0].id, {
      title: task.title,
      recurring: true,
    });
  } catch (err) {
    console.error("recurring rollover failed:", err);
  }
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
    const current = await getOwnedTask(user.id, id);

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

    // Log state transitions and generic edits.
    const updated = rows[0];
    const wasCompleted = current.status === "completed";
    const nowCompleted = updated.status === "completed";
    if (!wasCompleted && nowCompleted) {
      await logActivity(user.id, "task.completed", "task", id, { title: updated.title });
      if (updated.is_recurring && updated.recurring_rule) {
        await rolloverRecurringTask(user.id, updated);
      }
    } else if (wasCompleted && !nowCompleted) {
      await logActivity(user.id, "task.reopened", "task", id, { title: updated.title });
    } else {
      await logActivity(user.id, "task.updated", "task", id, { title: updated.title });
    }
    return json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const result = await pool.query(
      `UPDATE tasks SET deleted_at = now() WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id, title`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Task not found");
    await logActivity(user.id, "task.deleted", "task", id, { title: result.rows[0].title });
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
