/**
 * HTTP integration suite for the API layer.
 *
 * Targets a running server (default http://localhost:3000, override with
 * API_BASE_URL). If no server is reachable, the whole suite is skipped with
 * a warning — run it with your Next dev server up:
 *
 *   npm run dev   (in one terminal)
 *   npm test      (in another)
 *
 * The suite creates two disposable users and deletes their data afterwards.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { Pool } from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.env.API_BASE_URL ?? "http://localhost:3000";

// ── helpers ───────────────────────────────────────────────────────────────

async function isServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`${base}/auth/login`);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function signup(prefix: string): Promise<{ cookie: string; email: string }> {
  const email = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
  const res = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, password: "password123", name: prefix }),
  });
  if (res.status !== 200) throw new Error(`signup failed: ${res.status}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { cookie, email };
}

interface ApiResult {
  status: number;
  data: Record<string, unknown>;
}

async function api(
  path: string,
  opts: { method?: string; body?: unknown; cookie?: string } = {}
): Promise<ApiResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Better-auth CSRF protection requires an Origin on state-changing
    // requests; a real browser always sends one.
    Origin: base,
  };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // non-JSON (shouldn't happen for API routes)
  }
  return { status: res.status, data };
}

function loadDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, ".env.local");
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error("DATABASE_URL not found (set env or .env.local)");
}

// ── state ─────────────────────────────────────────────────────────────────

const serverUp = await isServerUp();
if (!serverUp) {
  console.warn(`[api.integration] No server at ${base} — SKIPPING. Start it with \`npm run dev\`.`);
}

let userA: { cookie: string; email: string };
let userB: { cookie: string; email: string };
let workspaceA: string;
let taskId: string;
let pool: Pool | null = null;

describe.runIf(serverUp)("API integration (session-gated)", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: loadDbUrl(), max: 2 });
    userA = await signup("ita");
    userB = await signup("itb");
  });

  afterAll(async () => {
    // Delete disposable users + their data.
    if (pool) {
      try {
        for (const email of [userA?.email, userB?.email]) {
          if (!email) continue;
          const { rows } = await pool.query(`SELECT id FROM public.user WHERE email = $1`, [email]);
          for (const row of rows) {
            const uid = row.id as string;
            await pool.query(`DELETE FROM user_settings WHERE user_id = $1`, [uid]);
            await pool.query(`DELETE FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)`, [uid]);
            await pool.query(`DELETE FROM habits WHERE user_id = $1`, [uid]);
            await pool.query(`DELETE FROM tasks WHERE user_id = $1`, [uid]);
            await pool.query(`DELETE FROM projects WHERE user_id = $1`, [uid]);
            await pool.query(`DELETE FROM workspaces WHERE user_id = $1`, [uid]);
            await pool.query(`DELETE FROM public.user WHERE id = $1`, [uid]);
          }
        }
      } catch (e) {
        console.warn("[api.integration] cleanup failed:", e);
      } finally {
        await pool.end();
      }
    }
  });

  describe("auth gate", () => {
    it("rejects unauthenticated reads and writes", async () => {
      expect((await api("/api/tasks")).status).toBe(401);
      expect((await api("/api/tasks", { method: "POST", body: {} })).status).toBe(401);
      expect((await api("/api/user-settings")).status).toBe(401);
      expect((await api("/api/analytics")).status).toBe(401);
      expect((await api("/api/dashboard")).status).toBe(401);
    });
  });

  describe("initialize + workspaces", () => {
    it("creates a default workspace on initialize", async () => {
      const init = await api("/api/users/initialize", { method: "POST", cookie: userA.cookie });
      expect(init.status).toBe(200);
      expect(init.data.workspaceId).toBeTruthy();
      await api("/api/users/initialize", { method: "POST", cookie: userB.cookie });
      const ws = await api("/api/workspaces", { cookie: userA.cookie });
      expect(ws.status).toBe(200);
      expect(ws.data.length).toBeGreaterThanOrEqual(1);
      workspaceA = (ws.data as unknown as { id: string }[])[0].id;
    });
  });

  describe("task input validation", () => {
    it("rejects an empty body with 400", async () => {
      const res = await api("/api/tasks", { method: "POST", body: {}, cookie: userA.cookie });
      expect(res.status).toBe(400);
      expect(res.data.error).toBe("Invalid input");
    });

    it("rejects a non-UUID workspace_id with 400 (not 500)", async () => {
      const res = await api("/api/tasks", {
        method: "POST",
        body: { workspace_id: "not-a-uuid", title: "T" },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(400);
    });

    it("rejects a nonexistent (but well-formed) workspace_id with 400", async () => {
      const res = await api("/api/tasks", {
        method: "POST",
        body: { workspace_id: "00000000-0000-0000-0000-000000000000", title: "T" },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(400);
      expect(res.data.error).toBe("Workspace not found");
    });
  });

  describe("cross-user isolation", () => {
    it("rejects using another user's workspace_id", async () => {
      const res = await api("/api/tasks", {
        method: "POST",
        body: { workspace_id: workspaceA, title: "Sneaky" },
        cookie: userB.cookie,
      });
      expect(res.status).toBe(400);
      expect(res.data.error).toBe("Workspace not found");
    });
  });

  describe("task lifecycle", () => {
    it("creates a task (201)", async () => {
      const res = await api("/api/tasks", {
        method: "POST",
        body: { workspace_id: workspaceA, title: "Integration task", priority: "high" },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(201);
      expect(res.data.title).toBe("Integration task");
      taskId = res.data.id as string;
    });

    it("lists it for the owner", async () => {
      const res = await api("/api/tasks", { cookie: userA.cookie });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data) && res.data.some((t) => (t as { id?: string }).id === taskId)).toBe(true);
    });

    it("hides it from other users (404 on direct fetch)", async () => {
      const res = await api(`/api/tasks/${taskId}`, { cookie: userB.cookie });
      expect(res.status).toBe(404);
    });

    it("updates the task (PATCH)", async () => {
      const res = await api(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: { status: "completed", completed_at: new Date().toISOString() },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe("completed");
    });

    it("rejects an invalid id with 400", async () => {
      expect((await api("/api/tasks/not-a-uuid", { cookie: userA.cookie })).status).toBe(400);
    });

    it("deletes the task (soft delete)", async () => {
      const res = await api(`/api/tasks/${taskId}`, { method: "DELETE", cookie: userA.cookie });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

  describe("recurring task rollover", () => {
    it("creates the next occurrence when a recurring task is completed", async () => {
      const created = await api("/api/tasks", {
        method: "POST",
        body: {
          workspace_id: workspaceA,
          title: "Recurring smoke task",
          is_recurring: true,
          recurring_rule: "daily",
          due_date: new Date().toISOString(),
        },
        cookie: userA.cookie,
      });
      expect(created.status).toBe(201);

      const completed = await api(`/api/tasks/${created.data.id}`, {
        method: "PATCH",
        body: { status: "completed", completed_at: new Date().toISOString() },
        cookie: userA.cookie,
      });
      expect(completed.status).toBe(200);
      expect(completed.data.status).toBe("completed");

      const list = await api("/api/tasks", { cookie: userA.cookie });
      expect(list.status).toBe(200);
      const tasks = (list.data as unknown as { id: string; title: string; status: string; due_date: string }[]);
      const recurring = tasks.filter((t) => t.title === "Recurring smoke task");
      expect(recurring.length).toBe(2);
      const next = recurring.find((t) => t.status !== "completed");
      const completedDue = completed.data.due_date as string;
      expect(next).toBeTruthy();
      expect(new Date(next!.due_date).getTime()).toBeGreaterThan(new Date(completedDue).getTime());
    });
  });

  describe("habits + logs", () => {
    let habitId: string;
    it("creates a habit (201)", async () => {
      const res = await api("/api/habits", {
        method: "POST",
        body: { workspace_id: workspaceA, name: "Integration habit", frequency: "daily" },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(201);
      habitId = res.data.id as string;
    });

    it("rejects a foreign habit log for another user's habit", async () => {
      const res = await api("/api/habit-logs", {
        method: "POST",
        body: { habit_id: habitId, date: "2026-08-09", completed: true },
        cookie: userB.cookie,
      });
      expect(res.status).toBe(404); // habit not found for user B
    });

    it("logs completion for the owner", async () => {
      const res = await api("/api/habit-logs", {
        method: "POST",
        body: { habit_id: habitId, date: "2026-08-09", completed: true },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(201);
    });

    it("deletes the habit", async () => {
      const res = await api(`/api/habits/${habitId}`, { method: "DELETE", cookie: userA.cookie });
      expect(res.status).toBe(200);
    });
  });

  describe("projects", () => {
    it("creates + deletes a project", async () => {
      const created = await api("/api/projects", {
        method: "POST",
        body: { workspace_id: workspaceA, name: "Integration project" },
        cookie: userA.cookie,
      });
      expect(created.status).toBe(201);
      const deleted = await api(`/api/projects/${created.data.id}`, { method: "DELETE", cookie: userA.cookie });
      expect(deleted.status).toBe(200);
    });
  });

  describe("read-only endpoints", () => {
    it("serves dashboard, analytics, settings, calendar", async () => {
      expect((await api("/api/dashboard", { cookie: userA.cookie })).status).toBe(200);
      expect((await api("/api/analytics", { cookie: userA.cookie })).status).toBe(200);
      expect((await api("/api/user-settings", { cookie: userA.cookie })).status).toBe(200);
      expect((await api("/api/calendar-events?start=2026-08-01&end=2026-08-31", { cookie: userA.cookie })).status).toBe(200);
    });

    it("updates user settings", async () => {
      const res = await api("/api/user-settings", {
        method: "PATCH",
        body: { notifications_email: false, notifications_push: false, notifications_reminders: false },
        cookie: userA.cookie,
      });
      expect(res.status).toBe(200);
      expect(res.data.notifications_email).toBe(false);
    });
  });
});