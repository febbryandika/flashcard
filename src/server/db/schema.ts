import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export * from "./auth-schema";

export const decks = pgTable(
  "decks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    language: text("language"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_deck_user").on(t.userId)],
);

export const cards = pgTable(
  "cards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    deckId: text("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    example: text("example"),
    stability: numeric("stability", { precision: 8, scale: 4 })
      .notNull()
      .default("2.5"),
    difficulty: numeric("difficulty", { precision: 8, scale: 4 })
      .notNull()
      .default("5.0"),
    repetitions: integer("repetitions").notNull().default(0),
    interval: integer("interval").notNull().default(0),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastReviewAt: timestamp("last_review_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_card_deck").on(t.deckId),
    index("idx_card_review").on(t.nextReviewAt),
  ],
);
