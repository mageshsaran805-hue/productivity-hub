import { describe, it, expect } from "vitest";
import { dbErrorStatus } from "../../src/lib/pg-errors";

describe("dbErrorStatus", () => {
  it("returns a clean 400 for foreign key violations (23503)", () => {
    const err = { code: "23503", constraint: "tasks_workspace_id_fkey" } as unknown;
    expect(dbErrorStatus(err)).toEqual({
      status: 400,
      message: "Referenced record does not exist",
    });
  });

  it("returns 409 for unique violations (23505)", () => {
    expect(dbErrorStatus({ code: "23505" })).toEqual({
      status: 409,
      message: "A record with that value already exists",
    });
  });

  it("returns 400 for invalid text representation (22P02) — bad uuid/enum casts", () => {
    const { status, message } = dbErrorStatus({ code: "22P02" })!;
    expect(status).toBe(400);
    expect(message).toBe("Invalid value format");
  });

  it("maps common client-caused codes to 400", () => {
    for (const code of ["23502", "23514", "22001", "22007", "22003"]) {
      expect(dbErrorStatus({ code })?.status).toBe(400);
    }
  });

  it("treats server-side schema bugs as 500", () => {
    expect(dbErrorStatus({ code: "42P01" })?.status).toBe(500); // undefined table
    expect(dbErrorStatus({ code: "42703" })?.status).toBe(500); // undefined column
    expect(dbErrorStatus({ code: "42501" })?.status).toBe(500); // insufficient privilege
  });

  it("returns null for unknown errors", () => {
    expect(dbErrorStatus(new Error("boom"))).toBeNull();
    expect(dbErrorStatus({})).toBeNull();
    expect(dbErrorStatus(null)).toBeNull();
    expect(dbErrorStatus(undefined)).toBeNull();
  });

  it("never leaks the raw server message", () => {
    const result = dbErrorStatus({ code: "23503", detail: "Key (workspace_id)=(abc) still referenced" });
    expect(result?.message).not.toContain("abc");
  });
});