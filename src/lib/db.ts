import { Pool } from "pg";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiError } from "./api-errors";

// Pure helpers (no server-only deps) — re-exported so routes can keep
// importing everything from "@/lib/db".
export { ApiError, json, errorResponse, readJson } from "./api-errors";
export {
  taskCreateSchema,
  taskUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  habitCreateSchema,
  habitUpdateSchema,
  habitLogSchema,
  settingsSchema,
  calendarEventCreateSchema,
  workspaceCreateSchema,
  sendEmailSchema,
  requireUuid,
  subtaskCreateSchema,
  subtaskUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema,
  taskCommentCreateSchema,
  taskCommentUpdateSchema,
} from "./validation";
export { rateLimit } from "./rate-limit";

/**
 * Shared server-only Postgres pool.
 * Used by better-auth and all data API routes.
 * NOTE: This module is server-only. Never import it from a client component.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// ---------------------------------------------------------------------------
// Auth helper — resolves the authenticated user for API routes.
// ---------------------------------------------------------------------------

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Ownership helpers — verify a referenced row belongs to the caller.
// Prevents cross-user data mingling (e.g. referencing another user's
// workspace/project/category id).
// ---------------------------------------------------------------------------

export async function assertOwned(
  table: "workspaces" | "projects" | "habit_categories",
  id: string,
  userId: string,
  label = table.slice(0, -1)
): Promise<void> {
  const { rows } = await pool.query(
    `SELECT 1 FROM ${table} WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, userId]
  );
  if (rows.length === 0) {
    throw new ApiError(400, `${label.charAt(0).toUpperCase() + label.slice(1)} not found`);
  }
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/** Escape user-controlled strings before interpolating into HTML (email bodies). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
