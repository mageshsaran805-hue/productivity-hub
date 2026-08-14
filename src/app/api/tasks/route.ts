import { requireUser, pool, json, errorResponse, ApiError, readJson, taskCreateSchema, rateLimit, assertOwned } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export const runtime = "nodejs";

const MAX_ROWS = 1000;

const listQuerySchema = z.object({
  project_id: z.string().optional(),
  uncategorized: z.enum(["true", "false"]).optional(),
  search: z.string().max(200).optional(),
  due_start: z.string().optional(),
  due_end: z.string().optional(),
  due_next_24h: z.enum(["true"]).optional(),
  tag_id: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = listQuerySchema.parse(Object.fromEntries(url.searchParams));

    const params: unknown[] = [user.id];
    const conditions = ["user_id = $1", "deleted_at IS NULL"];
    let sql = `SELECT t.*,
        (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id)::int AS subtask_count,
        (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.completed)::int AS subtask_completed
      FROM tasks t WHERE ${conditions.join(" AND ")}`;

    if (q.tag_id) {
      params.push(q.tag_id);
      sql += ` AND t.id IN (SELECT task_id FROM task_tags WHERE tag_id = $${params.length})`;
    }
    if (q.project_id) {
      params.push(q.project_id);
      sql += ` AND t.project_id = $${params.length}`;
    }
    if (q.uncategorized === "true") {
      sql += " AND t.project_id IS NULL";
    }
    if (q.search) {
      params.push(q.search);
      sql += ` AND t.search_vector @@ websearch_to_tsquery('english', $${params.length})`;
    }
    if (q.due_start) {
      params.push(q.due_start);
      sql += ` AND t.due_date >= $${params.length}`;
    }
    if (q.due_end) {
      params.push(q.due_end);
      sql += ` AND t.due_date <= $${params.length}`;
    }
    if (q.due_next_24h === "true") {
      params.push(new Date(Date.now()).toISOString(), new Date(Date.now() + 24 * 3600 * 1000).toISOString());
      sql += ` AND t.due_date IS NOT NULL AND t.due_date >= $${params.length - 1} AND t.due_date <= $${params.length}`;
    }

    sql += ' ORDER BY t."order" ASC, t.created_at DESC LIMIT ' + MAX_ROWS;
    const { rows } = await pool.query(sql, params);
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!rateLimit(`task-create:${user.id}`, 120, 60)) {
      throw new ApiError(429, "Too many requests");
    }
    const body = await readJson<Record<string, unknown>>(req);
    const input = taskCreateSchema.parse(body);

    // Ownership checks: the workspace and (if given) project must belong to
    // the caller, not just exist in the database.
    await assertOwned("workspaces", input.workspace_id, user.id, "workspace");
    if (input.project_id) {
      await assertOwned("projects", input.project_id, user.id, "project");
    }

    const columns = [
      "user_id",
      "workspace_id",
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
      "project_id",
      "parent_id",
    ];
    const values = [
      user.id,
      input.workspace_id,
      input.title,
      input.description ?? null,
      input.status ?? "todo",
      input.priority ?? "none",
      input.due_date ?? null,
      input.start_date ?? null,
      input.remind_before_minutes ?? null,
      input.is_recurring ?? false,
      input.recurring_rule ?? null,
      input.is_favorite ?? false,
      input.estimated_minutes ?? null,
      input.order ?? 0,
      input.project_id ?? null,
      input.parent_id ?? null,
    ];

    const { rows } = await pool.query(
      `INSERT INTO tasks (${columns.map((c) => `"${c}"`).join(", ")})
       VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")})
       RETURNING *`,
      values
    );
    await logActivity(user.id, "task.created", "task", rows[0].id, {
      title: input.title,
    });
    return json(rows[0], 201);
  } catch (err) {
    return errorResponse(err);
  }
}
