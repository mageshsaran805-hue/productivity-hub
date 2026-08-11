import { describe, it, expect } from "vitest";
import { ApiError, errorResponse, json, readJson } from "../../src/lib/api-errors";
import { z } from "zod";

async function bodyOf(res: Response) {
  return { status: res.status, data: await res.json() };
}

describe("errorResponse", () => {
  it("uses ApiError status + message", async () => {
    const res = await bodyOf(errorResponse(new ApiError(404, "Task not found")));
    expect(res.status).toBe(404);
    expect(res.data).toEqual({ error: "Task not found" });
  });

  it("returns 400 with zod issues for validation failures", async () => {
    const res = await bodyOf(errorResponse(z.object({ title: z.string().min(1) }).safeParse({}).error!));
    expect(res.status).toBe(400);
    expect(res.data.error).toBe("Invalid input");
    expect(res.data.issues).toBeDefined();
    expect(res.data.issues[0].path).toEqual(["title"]);
  });

  it("maps Postgres FK errors to a clean 400", async () => {
    const pgErr = { code: "23503", table: "tasks", constraint: "tasks_workspace_id_fkey" } as unknown;
    const res = await bodyOf(errorResponse(pgErr));
    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: "Referenced record does not exist" });
  });

  it("falls back to a generic 500 for unknown errors (no details leaked)", async () => {
    const res = await bodyOf(errorResponse(new Error("connection string leaked: postgresql://user:secret@host")));
    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: "Internal server error" });
  });
});

describe("json", () => {
  it("serializes data with status code", async () => {
    const res = json({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("readJson", () => {
  it("rejects non-JSON content types with 415", async () => {
    const req = new Request("http://x", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" });
    await expect(readJson(req)).rejects.toMatchObject({ status: 415 });
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://x", { method: "POST", headers: { "content-type": "application/json" }, body: "{nope" });
    await expect(readJson(req)).rejects.toMatchObject({ status: 400 });
  });

  it("parses a valid JSON body", async () => {
    const req = new Request("http://x", { method: "POST", headers: { "content-type": "application/json" }, body: '{"a":1}' });
    await expect(readJson<{ a: number }>(req)).resolves.toEqual({ a: 1 });
  });
});