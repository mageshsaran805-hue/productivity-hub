import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, setRateLimitStore, InMemoryRateLimitStore } from "../../src/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    setRateLimitStore(new InMemoryRateLimitStore());
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("user-1", 5, 60)).toBe(true);
    }
  });

  it("blocks once the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) rateLimit("user-1", 3, 60);
    expect(rateLimit("user-1", 3, 60)).toBe(false);
  });

  it("keeps keys independent", () => {
    rateLimit("user-a", 1, 60);
    expect(rateLimit("user-b", 1, 60)).toBe(true);
  });

  it("resets after the window elapses", async () => {
    rateLimit("user-1", 1, 0.05); // 50ms window
    expect(rateLimit("user-1", 1, 0.05)).toBe(false);
    await new Promise((r) => setTimeout(r, 70));
    expect(rateLimit("user-1", 1, 0.05)).toBe(true);
  });
});