/**
 * Sliding-window rate limiter (SPEC §9), in-memory by design.
 *
 * State is per-process and resets on restart. That is the documented trade-off:
 * SPEC calls for "Upstash Ratelimit, sliding window — or an in-memory limiter",
 * and for a single-instance app this closes the abuse hole on the only paid
 * path without adding a dependency or a service to provision. Swapping in
 * Upstash later means replacing this one function.
 */
type Hit = number[];

const windows = new Map<string, Hit>();

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the caller may retry. Only meaningful when `ok` is false. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((at) => at > cutoff);

  if (hits.length >= limit) {
    windows.set(key, hits);
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  hits.push(now);
  windows.set(key, hits);

  // Opportunistic sweep so abandoned keys don't accumulate forever.
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((at) => at <= cutoff)) windows.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}

/** Exposed for tests — resets the module-level window state. */
export function resetRateLimits() {
  windows.clear();
}
