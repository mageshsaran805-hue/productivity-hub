import { requireUser, pool, json, errorResponse, ApiError, readJson, projectCreateSchema, rateLimit, assertOwned } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  due_start: z.string().optional(),
  due_end: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = listQuerySchema.parse(Object.fromEntries(url.searchParams));

    const params: unknown[] = [user.id];
    let sql = `SELECT * FROM projects WHERE user_id = $1 AND deleted_at IS NULL`;
    if (q.due_start) {
      params.push(q.due_start);
      sql += ` AND due_date >= $${params.length}`;
    }
    if (q.due_end) {
      params.push(q.due_end);
      sql += ` AND due_date <= $${params.length}`;
    }
    sql += " ORDER BY created_at DESC LIMIT 500";

    const { rows } = await pool.query(sql, params);
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`project-create:${user.id}`, 60, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = projectCreateSchema.parse(body);

    await assertOwned("workspaces", input.workspace_id, user.id, "workspace");

    const { rows } = await pool.query(
      `INSERT INTO projects (user_id, workspace_id, name, description, color, status, due_date, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user.id,
        input.workspace_id,
        input.name,
        input.description ?? null,
        input.color ?? "#6366f1",
        input.status ?? "active",
        input.due_date ?? null,
        input.progress ?? 0,
      ]
    );
    await logActivity(user.id, "project.created", "project", rows[0].id, { name: input.name });
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
