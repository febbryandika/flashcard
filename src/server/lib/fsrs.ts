export type Rating = 1 | 2 | 3 | 4; // Again=1, Hard=2, Good=3, Easy=4

export interface CardState {
  stability: number;
  difficulty: number;
  repetitions: number;
  interval: number;
}

export interface ScheduledCard extends CardState {
  nextReviewAt: Date;
}

export type IntervalPreview = Record<Rating, number>;

const D_MIN = 1;
const D_MAX = 10;
const DAY_MS = 86_400_000;

/**
 * Simplified FSRS-4.5 core update (SPEC §3). Pure and server-side only —
 * the client submits a rating and never computes scheduling itself.
 */
export function fsrs(
  state: CardState,
  rating: Rating,
  now: Date = new Date(),
): ScheduledCard {
  const { stability: s, difficulty: d, repetitions: r } = state;

  const newDifficulty = Math.min(
    D_MAX,
    Math.max(D_MIN, d - 0.8 + 0.28 * rating - 0.02 * d),
  );

  let newStability: number;
  let newRepetitions: number;

  if (rating === 1) {
    // Lapse — reset
    newStability = Math.max(0.1, s * 0.2);
    newRepetitions = 0;
  } else {
    const rFactor = rating === 2 ? 0.8 : rating === 3 ? 1.0 : 1.2;
    newStability = s * rFactor * Math.exp(0.1 * (r + 1));
    newRepetitions = r + 1;
  }

  const interval = newRepetitions === 0 ? 1 : Math.round(newStability * 9);
  const nextReviewAt = new Date(now.getTime() + interval * DAY_MS);

  return {
    stability: newStability,
    difficulty: newDifficulty,
    repetitions: newRepetitions,
    interval,
    nextReviewAt,
  };
}

/**
 * Interval each rating would produce, so the rating buttons can preview
 * "Good → 25d" without the scheduler ever reaching the client bundle.
 */
export function previewIntervals(state: CardState): IntervalPreview {
  return {
    1: fsrs(state, 1).interval,
    2: fsrs(state, 2).interval,
    3: fsrs(state, 3).interval,
    4: fsrs(state, 4).interval,
  };
}
