import { requireUser, pool, json, errorResponse, ApiError, requireUuid } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, commentId } = await params;
    const taskId = requireUuid(id);
    const cId = requireUuid(commentId);

    const result = await pool.query(
      `DELETE FROM task_comments
       WHERE id = $1 AND task_id = $2 AND user_id = $3
       RETURNING id`,
      [cId, taskId, user.id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Comment not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}