import { describe, it, expect } from "vitest";
import { requireUuid, taskCreateSchema, habitLogSchema, settingsSchema, sendEmailSchema } from "../../src/lib/validation";
import { ApiError } from "../../src/lib/api-errors";

const VALID_UUID = "a928c6ac-1032-4132-9175-5a3c954ad130";

describe("requireUuid", () => {
  it("accepts a valid UUID", () => {
    expect(requireUuid(VALID_UUID)).toBe(VALID_UUID);
  });

  it("accepts uppercase UUIDs", () => {
    expect(requireUuid(VALID_UUID.toUpperCase())).toBe(VALID_UUID.toUpperCase());
  });

  it("rejects non-UUID strings with a 400 ApiError", () => {
    for (const bad of ["x", "12345", "not-a-uuid", "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", ""]) {
      expect(() => requireUuid(bad)).toThrowError(ApiError);
      try {
        requireUuid(bad);
      } catch (e) {
        expect((e as ApiError).status).toBe(400);
      }
    }
  });

  it("rejects undefined/missing values", () => {
    expect(() => requireUuid(undefined)).toThrowError(ApiError);
    expect(() => requireUuid(undefined, "habit_id")).toThrow(/habit_id/);
  });
});

describe("taskCreateSchema", () => {
  const base = { workspace_id: VALID_UUID, title: "Ship the thing" };

  it("accepts a minimal valid task", () => {
    expect(taskCreateSchema.parse(base)).toMatchObject({ title: "Ship the thing" });
  });

  it("rejects a missing title", () => {
    const result = taskCreateSchema.safeParse({ workspace_id: VALID_UUID });
    expect(result.success).toBe(false);
  });

  it("rejects a blank title", () => {
    expect(taskCreateSchema.safeParse({ ...base, title: "   " }).success).toBe(false);
  });

  it("rejects an over-long title (max 500)", () => {
    expect(taskCreateSchema.safeParse({ ...base, title: "a".repeat(501) }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ ...base, title: "a".repeat(500) }).success).toBe(true);
  });

  it("rejects an invalid priority enum", () => {
    expect(taskCreateSchema.safeParse({ ...base, priority: "critical" }).success).toBe(false);
  });

  it("accepts nullable project_id and due_date", () => {
    expect(taskCreateSchema.safeParse({ ...base, project_id: null, due_date: null }).success).toBe(true);
  });

  it("requires workspace_id", () => {
    expect(taskCreateSchema.safeParse({ title: "x" }).success).toBe(false);
  });
});

describe("habitLogSchema", () => {
  it("requires YYYY-MM-DD dates", () => {
    expect(habitLogSchema.safeParse({ habit_id: VALID_UUID, date: "2026-08-09", completed: true }).success).toBe(true);
    expect(habitLogSchema.safeParse({ habit_id: VALID_UUID, date: "09/08/2026", completed: true }).success).toBe(false);
    expect(habitLogSchema.safeParse({ habit_id: VALID_UUID, date: "2026-13-09", completed: true }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts partial updates", () => {
    expect(settingsSchema.parse({ notifications_email: false })).toEqual({ notifications_email: false });
    expect(settingsSchema.parse({ week_starts_on: 6 })).toEqual({ week_starts_on: 6 });
  });

  it("rejects out-of-range week_starts_on", () => {
    expect(settingsSchema.safeParse({ week_starts_on: 7 }).success).toBe(false);
  });

  it("rejects a non-boolean notification flag", () => {
    expect(settingsSchema.safeParse({ notifications_email: "yes" }).success).toBe(false);
  });
});

describe("sendEmailSchema", () => {
  it("accepts up to 100 task ids", () => {
    expect(sendEmailSchema.safeParse({ taskIds: Array.from({ length: 100 }, (_, i) => `id-${i}`) }).success).toBe(true);
  });

  it("rejects more than 100 task ids", () => {
    expect(sendEmailSchema.safeParse({ taskIds: Array.from({ length: 101 }, (_, i) => `id-${i}`) }).success).toBe(false);
  });
});