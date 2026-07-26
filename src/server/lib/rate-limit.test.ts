import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/server/lib/rate-limit";

const WINDOW = 60_000;

beforeEach(() => {
  resetRateLimits();
});

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("a", 3, WINDOW, 1000).ok).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, WINDOW, 1000);

    const result = rateLimit("a", 3, WINDOW, 1000);

    expect(result.ok).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("keeps separate counters per key", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, WINDOW, 1000);

    // One caller exhausting their quota must not affect anyone else.
    expect(rateLimit("b", 3, WINDOW, 1000).ok).toBe(true);
  });

  it("lets the window slide — old hits stop counting", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, WINDOW, 1000);
    expect(rateLimit("a", 3, WINDOW, 1000).ok).toBe(false);

    // Far enough past the window that every prior hit has aged out.
    expect(rateLimit("a", 3, WINDOW, 1000 + WINDOW + 1).ok).toBe(true);
  });

  it("expires hits individually rather than all at once", () => {
    rateLimit("a", 2, WINDOW, 0);
    rateLimit("a", 2, WINDOW, 30_000);
    expect(rateLimit("a", 2, WINDOW, 30_001).ok).toBe(false);

    // The first hit has aged out but the second has not, so exactly one slot frees up.
    expect(rateLimit("a", 2, WINDOW, 60_001).ok).toBe(true);
    expect(rateLimit("a", 2, WINDOW, 60_002).ok).toBe(false);
  });

  it("reports retryAfter in whole seconds, never zero when blocked", () => {
    rateLimit("a", 1, WINDOW, 0);

    const result = rateLimit("a", 1, WINDOW, WINDOW - 1);

    expect(result.ok).toBe(false);
    expect(result.retryAfter).toBe(1);
  });
});
