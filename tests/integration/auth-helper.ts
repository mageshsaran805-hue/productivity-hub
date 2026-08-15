/**
 * Test auth helper.
 *
 * The app only supports Google OAuth sign-in, so the integration suite cannot
 * create users through the public sign-up API. Instead it provisions
 * disposable users + sessions directly in the database and produces a valid
 * better-auth signed session cookie.
 *
 * Cookie format (better-auth / better-call):
 *   name  = better-auth.session_token
 *   value = encodeURIComponent(`${token}.${base64(HMAC-SHA256(secret, token))}`)
 */

import { randomBytes, randomUUID } from "crypto";
import { webcrypto } from "crypto";
import { Pool } from "pg";

export interface TestUser {
  id: string;
  cookie: string;
  email: string;
}

export async function createTestUser(
  pool: Pool,
  secret: string,
  prefix: string
): Promise<TestUser> {
  const id = randomUUID();
  const email = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
  const now = new Date();

  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, $4, $5, $5)`,
    [id, `Test ${prefix}`, email, null, now]
  );
  // App profile row (the legacy `users` table) — all app tables have an FK to
  // this, so it must exist before any workspace/task/habit can be created.
  await pool.query(
    `INSERT INTO users (id, email, name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT (id) DO NOTHING`,
    [id, email, `Test ${prefix}`, now]
  );

  const token = randomBytes(32).toString("hex");
  const sessionId = randomUUID();
  await pool.query(
    `INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
     VALUES ($1, $2, $3, $4, $4, $5)`,
    [sessionId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), token, now, id]
  );

  const signature = await hmacSha256Base64(secret, token);
  const cookieValue = encodeURIComponent(`${token}.${signature}`);
  return { id, cookie: `better-auth.session_token=${cookieValue}`, email };
}

async function hmacSha256Base64(secret: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await webcrypto.subtle.sign("HMAC", key, enc.encode(value));
  return Buffer.from(sig).toString("base64");
}

/** Deletes a user and all owned rows (mirrors the original suite's cleanup). */
export async function deleteTestUser(pool: Pool, id: string): Promise<void> {
  await pool.query(`DELETE FROM user_settings WHERE user_id = $1`, [id]);
  await pool.query(`DELETE FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)`, [id]);
  await pool.query(`DELETE FROM habits WHERE user_id = $1`, [id]);
  await pool.query(`DELETE FROM tasks WHERE user_id = $1`, [id]);
  await pool.query(`DELETE FROM projects WHERE user_id = $1`, [id]);
  await pool.query(`DELETE FROM workspaces WHERE user_id = $1`, [id]);
  await pool.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}