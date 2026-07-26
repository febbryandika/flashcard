import { describe, expect, it } from "vitest";
import { fsrs, type CardState } from "@/server/lib/fsrs";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const DAY_MS = 86_400_000;

/** Schema defaults for a card that has never been reviewed. */
const fresh: CardState = {
  stability: 2.5,
  difficulty: 5,
  repetitions: 0,
  interval: 0,
};

const daysUntil = (date: Date) => (date.getTime() - NOW.getTime()) / DAY_MS;

describe("fsrs — successful ratings", () => {
  it("Hard (2) applies the 0.8 stability factor", () => {
    const result = fsrs(fresh, 2, NOW);

    expect(result.stability).toBeCloseTo(2.5 * 0.8 * Math.exp(0.1), 6);
    expect(result.difficulty).toBeCloseTo(4.66, 6);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(20);
  });

  it("Good (3) leaves stability unscaled apart from the repetition term", () => {
    const result = fsrs(fresh, 3, NOW);

    expect(result.stability).toBeCloseTo(2.5 * Math.exp(0.1), 6);
    expect(result.difficulty).toBeCloseTo(4.94, 6);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(25);
  });

  it("Easy (4) applies the 1.2 stability factor", () => {
    const result = fsrs(fresh, 4, NOW);

    expect(result.stability).toBeCloseTo(2.5 * 1.2 * Math.exp(0.1), 6);
    expect(result.difficulty).toBeCloseTo(5.22, 6);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(30);
  });

  it("orders intervals Easy > Good > Hard for the same card", () => {
    const hard = fsrs(fresh, 2, NOW).interval;
    const good = fsrs(fresh, 3, NOW).interval;
    const easy = fsrs(fresh, 4, NOW).interval;

    expect(easy).toBeGreaterThan(good);
    expect(good).toBeGreaterThan(hard);
  });

  it("grows the interval as repetitions accumulate", () => {
    const first = fsrs(fresh, 3, NOW);
    const later = fsrs({ ...fresh, repetitions: 5 }, 3, NOW);

    expect(later.repetitions).toBe(6);
    expect(later.interval).toBeGreaterThan(first.interval);
  });

  it("schedules the next review interval days out", () => {
    const result = fsrs(fresh, 3, NOW);

    expect(daysUntil(result.nextReviewAt)).toBe(result.interval);
  });
});

describe("fsrs — lapses", () => {
  const established: CardState = {
    stability: 10,
    difficulty: 5,
    repetitions: 5,
    interval: 90,
  };

  it("Again (1) resets repetitions and collapses stability to 20%", () => {
    const result = fsrs(established, 1, NOW);

    expect(result.repetitions).toBe(0);
    expect(result.stability).toBeCloseTo(2, 6);
    expect(result.difficulty).toBeCloseTo(4.38, 6);
  });

  it("reschedules a lapsed card for tomorrow regardless of prior interval", () => {
    const result = fsrs(established, 1, NOW);

    expect(result.interval).toBe(1);
    expect(daysUntil(result.nextReviewAt)).toBe(1);
  });

  it("floors stability at 0.1 for an already-weak card", () => {
    const result = fsrs({ ...established, stability: 0.2 }, 1, NOW);

    expect(result.stability).toBe(0.1);
  });
});

describe("fsrs — difficulty bounds", () => {
  it("clamps difficulty at the 10 ceiling", () => {
    const result = fsrs({ ...fresh, difficulty: 10 }, 4, NOW);

    expect(result.difficulty).toBe(10);
  });

  it("clamps difficulty at the 1 floor", () => {
    const result = fsrs({ ...fresh, difficulty: 1 }, 1, NOW);

    expect(result.difficulty).toBe(1);
  });
});
