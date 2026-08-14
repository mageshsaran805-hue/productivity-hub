import { describe, it, expect } from "vitest";
import { computeStreaks } from "../../src/lib/streaks";

describe("computeStreaks", () => {
  it("returns zero streaks for a habit with no logs", () => {
    const map = new Map<string, Set<string>>();
    const result = computeStreaks(map, ["h1"], "2026-08-14");
    expect(result.h1).toEqual({ current_streak: 0, best_streak: 0 });
  });

  it("counts a current streak ending today", () => {
    const set = new Set(["2026-08-12", "2026-08-13", "2026-08-14"]);
    const result = computeStreaks(new Map([["h1", set]]), ["h1"], "2026-08-14");
    expect(result.h1.current_streak).toBe(3);
    expect(result.h1.best_streak).toBe(3);
  });

  it("keeps the streak alive when today is not yet completed", () => {
    // Completed through yesterday; today unfinished should not break the streak.
    const set = new Set(["2026-08-12", "2026-08-13"]);
    const result = computeStreaks(new Map([["h1", set]]), ["h1"], "2026-08-14");
    expect(result.h1.current_streak).toBe(2);
  });

  it("resets the current streak after a missed day", () => {
    // Missed 08-13, so the current streak only counts 08-14.
    const set = new Set(["2026-08-11", "2026-08-12", "2026-08-14"]);
    const result = computeStreaks(new Map([["h1", set]]), ["h1"], "2026-08-14");
    expect(result.h1.current_streak).toBe(1);
    // Best streak is the 2-day run.
    expect(result.h1.best_streak).toBe(2);
  });

  it("computes best streak across non-contiguous runs", () => {
    const set = new Set(["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-10", "2026-08-11"]);
    const result = computeStreaks(new Map([["h1", set]]), ["h1"], "2026-08-14");
    expect(result.h1.best_streak).toBe(3);
    expect(result.h1.current_streak).toBe(0);
  });

  it("handles multiple habits independently", () => {
    const setA = new Set(["2026-08-13", "2026-08-14"]);
    const setB = new Set(["2026-08-10"]);
    const result = computeStreaks(
      new Map([
        ["a", setA],
        ["b", setB],
      ]),
      ["a", "b"],
      "2026-08-14"
    );
    expect(result.a.current_streak).toBe(2);
    expect(result.b.current_streak).toBe(0);
    expect(result.b.best_streak).toBe(1);
  });
});