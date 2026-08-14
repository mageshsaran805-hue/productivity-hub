import { requireUser, pool, json, errorResponse, ApiError, readJson, subtaskCreateSchema, rateLimit, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedTask(userId: string, taskId: string) {
  const { rows } = await pool.query(
    `SELECT id FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [taskId, userId]
  );
  if (rows.length === 0) throw new ApiError(404, "Task not found");
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    await getOwnedTask(user.id, id);
    const { rows } = await pool.query(
      `SELECT * FROM subtasks WHERE task_id = $1 ORDER BY "order" ASC, created_at ASC`,
      [id]
    );
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!rateLimit(`subtask-create:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const id = requireUuid((await params).id);
    await getOwnedTask(user.id, id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = subtaskCreateSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO subtasks (task_id, title, completed, "order")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, input.title, input.completed ?? false, input.order ?? 0]
    );
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}