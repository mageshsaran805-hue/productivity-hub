import { describe, it, expect } from "vitest";
import { nextOccurrence } from "../../src/lib/recurring";

describe("nextOccurrence", () => {
  it("returns null for non-recurring tasks", () => {
    expect(nextOccurrence({ due_date: "2026-08-15T00:00:00Z", start_date: null, recurring_rule: null, is_recurring: false })).toBeNull();
  });

  it("returns null for a 'none' rule", () => {
    expect(nextOccurrence({ due_date: "2026-08-15T00:00:00Z", start_date: null, recurring_rule: "none", is_recurring: true })).toBeNull();
  });

  it("advances a daily task by one day", () => {
    const next = nextOccurrence({
      due_date: "2026-08-15T09:00:00.000Z",
      start_date: null,
      recurring_rule: "daily",
      is_recurring: true,
    });
    expect(next).toBe("2026-08-16T09:00:00.000Z");
  });

  it("advances a weekly task by seven days", () => {
    const next = nextOccurrence({
      due_date: "2026-08-15T09:00:00.000Z",
      start_date: null,
      recurring_rule: "weekly",
      is_recurring: true,
    });
    expect(next).toBe("2026-08-22T09:00:00.000Z");
  });

  it("advances a monthly task by one month", () => {
    const next = nextOccurrence({
      due_date: "2026-08-15T09:00:00.000Z",
      start_date: null,
      recurring_rule: "monthly",
      is_recurring: true,
    });
    expect(next).toBe("2026-09-15T09:00:00.000Z");
  });

  it("advances a yearly task by one year", () => {
    const next = nextOccurrence({
      due_date: "2026-08-15T09:00:00.000Z",
      start_date: null,
      recurring_rule: "yearly",
      is_recurring: true,
    });
    expect(next).toBe("2027-08-15T09:00:00.000Z");
  });

  it("honors a custom interval (3daily)", () => {
    const next = nextOccurrence({
      due_date: "2026-08-15T09:00:00.000Z",
      start_date: null,
      recurring_rule: "3daily",
      is_recurring: true,
    });
    expect(next).toBe("2026-08-18T09:00:00.000Z");
  });

  it("falls back to start_date when due_date is missing", () => {
    const next = nextOccurrence({
      due_date: null,
      start_date: "2026-08-15T09:00:00.000Z",
      recurring_rule: "weekly",
      is_recurring: true,
    });
    expect(next).toBe("2026-08-22T09:00:00.000Z");
  });

  it("returns null for an unknown rule", () => {
    expect(nextOccurrence({ due_date: "2026-08-15T00:00:00Z", start_date: null, recurring_rule: "hourly", is_recurring: true })).toBeNull();
  });
});