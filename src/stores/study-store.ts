import { create } from "zustand";
import type { StudyCard } from "@/lib/study";

/**
 * Local study-session state only — the queue position and whether the current
 * card is flipped. Card data itself is server state and lives in TanStack Query
 * or in the Server Component that seeded the session.
 */
type StudyState = {
  queue: StudyCard[];
  index: number;
  isFlipped: boolean;
  start: (queue: StudyCard[]) => void;
  flip: () => void;
  /** Optimistically advance; `back` restores position if the rating fails. */
  advance: () => void;
  back: (index: number) => void;
};

export const useStudyStore = create<StudyState>((set) => ({
  queue: [],
  index: 0,
  isFlipped: false,
  start: (queue) => set({ queue, index: 0, isFlipped: false }),
  flip: () => set((s) => ({ isFlipped: !s.isFlipped })),
  advance: () => set((s) => ({ index: s.index + 1, isFlipped: false })),
  back: (index) => set({ index, isFlipped: true }),
}));
