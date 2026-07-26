/** Shape sent to the study UI. No server imports — safe on both sides. */
export type StudyCard = {
  id: string;
  deckId: string;
  deckName: string;
  front: string;
  back: string;
  example: string | null;
  /** Interval in days each rating would schedule, computed server-side. */
  previews: Record<1 | 2 | 3 | 4, number>;
};

export const RATINGS = [
  { value: 1, label: "Again" },
  { value: 2, label: "Hard" },
  { value: 3, label: "Good" },
  { value: 4, label: "Easy" },
] as const;

export function formatInterval(days: number) {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}
