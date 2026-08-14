import { requireUser, pool, json, errorResponse, ApiError, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; tagId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, tagId } = await params;
    const taskId = requireUuid(id);
    const tId = requireUuid(tagId);

    const result = await pool.query(
      `DELETE FROM task_tags
       WHERE task_id = $1 AND tag_id = $2
         AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_tags.task_id AND t.user_id = $3 AND t.deleted_at IS NULL)
         AND EXISTS (SELECT 1 FROM tags g WHERE g.id = task_tags.tag_id AND g.user_id = $3)`,
      [taskId, tId, user.id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Tag assignment not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}