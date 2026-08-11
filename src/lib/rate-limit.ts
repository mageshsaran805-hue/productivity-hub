/**
 * Simple per-key rate limiter backed by a swappable store.
 *
 * Default store is in-memory (per-process) — correct for a single-instance
 * deployment. For multi-instance/serverless, swap the store for a shared
 * backend (Redis/Upstash) via setRateLimitStore() by implementing
 * RateLimitStore. Nothing else in the codebase needs to change.
 */

export interface RateLimitStore {
  /** Increment `key`; return true if within `limit` per `windowSeconds`. */
  hit(key: string, limit: number, windowSeconds: number): boolean;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  hit(key: string, limit: number, windowSeconds: number): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  /** Keep the map from growing unboundedly — sweep expired buckets. */
  sweep() {
    const now = Date.now();
    for (const [k, v] of this.buckets) {
      if (v.resetAt <= now) this.buckets.delete(k);
    }
  }
}

let store: RateLimitStore = new InMemoryRateLimitStore();

export function setRateLimitStore(next: RateLimitStore) {
  store = next;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): boolean {
  return store.hit(key, limit, windowSeconds);
}

// Sweep expired buckets every few minutes.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    if (store instanceof InMemoryRateLimitStore) store.sweep();
  }, 5 * 60 * 1000).unref?.();
}
