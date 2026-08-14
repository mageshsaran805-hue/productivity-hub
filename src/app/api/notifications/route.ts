import { requireUser, pool, json, errorResponse } from "@/lib/db";

export const runtime = "nodejs";

/** Lists the user's notifications, newest first. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const { rows } = await pool.query(
      `SELECT id, type, title, message, read, data, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    );
    return json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}