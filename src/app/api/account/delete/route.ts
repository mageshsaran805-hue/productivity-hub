import { requireUser, pool, json, errorResponse, rateLimit, ApiError } from "@/lib/db";

export const runtime = "nodejs";

// Permanently deletes the current user's account and all associated data.
// Deleting from `users` cascades to every app table (workspaces, tasks,
// habits, calendar events, settings, subscriptions, etc.), and deleting from
// the better-auth `user` table cascades to sessions and linked accounts.
export async function DELETE() {
  try {
    const user = await requireUser();
    if (!rateLimit(`account-delete:${user.id}`, 3, 60)) {
      throw new ApiError(429, "Too many requests");
    }

    await pool.query(`DELETE FROM users WHERE id = $1`, [user.id]);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [user.id]);

    return json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
