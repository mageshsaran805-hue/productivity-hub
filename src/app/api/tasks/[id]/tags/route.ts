import { requireUser, pool, json, errorResponse, ApiError, requireUuid } from "@/lib/db";

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
      `SELECT t.* FROM tags t
       JOIN task_tags tt ON tt.tag_id = t.id
       WHERE tt.task_id = $1 AND t.user_id = $2
       ORDER BY t.name ASC`,
      [id, user.id]
    );
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    await getOwnedTask(user.id, id);

    const body = (await req.json().catch(() => null)) as { tag_id?: string } | null;
    const tagId = requireUuid(body?.tag_id, "tag_id");

    // Verify the tag belongs to the user before assigning.
    const owns = await pool.query(
      `SELECT 1 FROM tags WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [tagId, user.id]
    );
    if (owns.rows.length === 0) throw new ApiError(404, "Tag not found");

    const { rows } = await pool.query(
      `INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [id, tagId]
    );
    return json(rows[0] ?? { task_id: id, tag_id: tagId }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}