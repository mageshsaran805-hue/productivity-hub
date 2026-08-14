import { requireUser, pool, json, errorResponse, ApiError, readJson, tagUpdateSchema, requireUuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);

    const body = await readJson<Record<string, unknown>>(req);
    const input = tagUpdateSchema.parse(body);

    const allowed = ["name", "color"];
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
      `UPDATE tags SET ${sets.join(", ")}
       WHERE user_id = $${values.length - 1} AND id = $${values.length}
       RETURNING *`,
      values
    );
    if (rows.length === 0) throw new ApiError(404, "Tag not found");
    await logActivity(user.id, "tag.updated", "tag", id, { name: rows[0].name });
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
      `DELETE FROM tags WHERE user_id = $1 AND id = $2 RETURNING id, name`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Tag not found");
    await logActivity(user.id, "tag.deleted", "tag", id, { name: result.rows[0].name });
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}