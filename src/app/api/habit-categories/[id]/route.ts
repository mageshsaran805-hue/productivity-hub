import { requireUser, pool, json, errorResponse, ApiError, readJson, requireUuid } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  color: z.string().max(50).optional(),
  icon: z.string().max(100).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);
    const body = await readJson<Record<string, unknown>>(req);
    const input = updateSchema.parse(body);

    const allowed = ["name", "color", "icon"];
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
      `UPDATE habit_categories SET ${sets.join(", ")}
       WHERE user_id = $${values.length - 1} AND id = $${values.length}
       RETURNING *`,
      values
    );
    if (rows.length === 0) throw new ApiError(404, "Category not found");
    return json(rows[0]);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = requireUuid((await params).id);

    // Deleting a category unlinks it from habits (FK is ON DELETE SET NULL).
    const result = await pool.query(
      `DELETE FROM habit_categories WHERE user_id = $1 AND id = $2 RETURNING id`,
      [user.id, id]
    );
    if (result.rowCount === 0) throw new ApiError(404, "Category not found");
    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}