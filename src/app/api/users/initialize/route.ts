import { requireUser, pool, json, errorResponse, rateLimit, ApiError } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Creates the user's profile row + default workspace + settings if missing.
 * Mirrors the previous client-side initializeUser, now server-side and
 * keyed off the authenticated better-auth session (no trust in client input).
 */
export async function POST() {
  try {
    const user = await requireUser();
    if (!rateLimit(`user-init:${user.id}`, 5, 60)) {
      throw new ApiError(429, "Too many requests");
    }

    // 1. Profile row (only if missing)
    await pool.query(
      `INSERT INTO users (id, email, name) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
      [user.id, user.email ?? "", user.name ?? user.email?.split("@")[0] ?? "User"]
    );

    // 2. Default workspace (only if the user has none)
    const existing = await pool.query(
      `SELECT id FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [user.id]
    );

    const workspace = existing.rows[0] ?? null;
    let workspaceId: string;
    if (workspace) {
      workspaceId = workspace.id as string;
    } else {
      const created = await pool.query(
        `INSERT INTO workspaces (user_id, name, description, color)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [user.id, "Personal", "Your personal workspace", "#6366f1"]
      );
      workspaceId = created.rows[0].id as string;
    }

    // 3. Settings (defaults, only if missing)
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    return json({ workspaceId });
  } catch (err) {
    return errorResponse(err);
  }
}
