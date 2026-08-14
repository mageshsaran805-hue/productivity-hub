import { requireUser, pool, json, errorResponse, ApiError, readJson, taskCommentCreateSchema, rateLimit, requireUuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

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
      `SELECT c.*, u.email, u.name FROM task_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
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
    if (!rateLimit(`task-comment-create:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const id = requireUuid((await params).id);
    await getOwnedTask(user.id, id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = taskCommentCreateSchema.parse(body);

    const { rows } = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user.id, input.content]
    );
    await logActivity(user.id, "comment.created", "comment", rows[0].id, { task_id: id });
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}