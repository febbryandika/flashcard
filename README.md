# Flashcards

A spaced-repetition study app. Create decks, add cards by hand, by CSV, or by pasting text and letting Claude extract them — then review what's due each day. Scheduling uses **FSRS**, the algorithm Anki adopted in 2022.

![Deck list](docs/screenshots/deck-list.png)

## Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Stack](#stack)
- [Why a single Next.js app](#why-a-single-nextjs-app)
- [Running locally](#running-locally)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Testing](#testing)
- [Known gaps](#known-gaps)

## What it does

- **Decks and cards** — full CRUD, every query scoped to the signed-in user
- **Study mode** — flip a card, rate it 1–4, and FSRS schedules the next review
- **Daily queue** — everything due today across all decks, in one place
- **CSV import** — preview every row, with invalid ones flagged and excluded before anything is written
- **AI extraction** — paste up to 5,000 characters, get back up to 20 Q&A cards, pick the ones you want

## Screenshots

**Study session** — the card is flipped, and each rating button previews the interval it would schedule. Those numbers come from the server; the scheduler never ships to the browser.

![Study session](docs/screenshots/study-session.png)

**Deck detail** — three ways to add cards: one at a time, CSV import with a validated preview, or AI extraction from pasted text.

![Deck detail](docs/screenshots/deck-detail.png)

**Daily review** — everything due across every deck.

![Daily review](docs/screenshots/daily-review.png)

## Stack

| Layer        | Choice                              |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router), React 19   |
| Language     | TypeScript (strict)                 |
| UI           | Tailwind CSS v4, shadcn/ui          |
| Server state | TanStack Query                      |
| Client state | Zustand (study-session queue only)  |
| Database     | Neon PostgreSQL, Drizzle ORM        |
| Auth         | Better Auth (email + password)      |
| AI           | Vercel AI SDK + `@ai-sdk/anthropic` |
| Validation   | Zod                                 |
| Testing      | Vitest (unit), Playwright (E2E)     |
| Logging      | pino                                |

## Why a single Next.js app

The workload is single-user CRUD, some scheduling arithmetic, and one structured AI call. There's no persistent server, no real-time sync, and no second consumer that would justify a standalone API — so Route Handlers and Server Actions cover the whole surface, and there's one thing to deploy.

The split between them is about who initiates the call: **Server Actions** for form-driven CRUD (progressive enhancement, revalidate on submit), **Route Handlers** for what client code calls imperatively and needs a status code from (review submission, due queue, AI extraction).

See [`docs/diagrams/architecture.md`](docs/diagrams/architecture.md) for the full picture.

## Running locally

**Prerequisites:** Node 20+, pnpm, a [Neon](https://neon.tech) database (free tier is fine), and an [Anthropic API key](https://console.anthropic.com).

```bash
git clone https://github.com/febbryandika/flashcard.git
cd flashcard
pnpm install
cp .env.example .env      # then fill in the values below
pnpm db:migrate           # create the tables
pnpm dev                  # http://localhost:3000
```

Open the app, create an account, and you're in.

> **On Docker Compose:** this project connects through Neon's HTTP driver (`@neondatabase/serverless`), which talks to a Neon endpoint rather than a plain Postgres socket — so a stock `docker-compose` Postgres won't work without also running Neon's WebSocket proxy. Rather than carry that extra moving part, local setup uses a Neon branch, which takes about a minute to create and matches production exactly.

## Environment variables

Copy `.env.example` to `.env`. All four are validated with Zod at startup ([`env.ts`](src/server/lib/env.ts)) — the app fails immediately with a clear message rather than at the first query.

| Variable             | Required | What it's for                                                                 |
| -------------------- | -------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`       | ✅       | Neon connection string, e.g. `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | ✅       | Session signing key, 32+ chars. Generate with `openssl rand -base64 32`       |
| `BETTER_AUTH_URL`    | —        | App origin. Defaults to `http://localhost:3000`                               |
| `ANTHROPIC_API_KEY`  | ✅       | Powers AI card extraction                                                     |

`LOG_LEVEL` is optional and overrides the default (`debug` in development, `info` otherwise).

## Scripts

| Command                     | Does                                 |
| --------------------------- | ------------------------------------ |
| `pnpm dev`                  | Development server                   |
| `pnpm build` / `pnpm start` | Production build and serve           |
| `pnpm test`                 | Vitest unit tests                    |
| `pnpm test:e2e`             | Playwright end-to-end tests          |
| `pnpm lint`                 | ESLint                               |
| `pnpm format`               | Prettier                             |
| `pnpm db:generate`          | Generate a migration from the schema |
| `pnpm db:migrate`           | Apply migrations                     |
| `pnpm db:studio`            | Browse the database                  |

## Project structure

```
src/
├── app/
│   ├── (auth)/                 sign-in, sign-up
│   ├── decks/                  deck list, detail, new, edit, cards, study
│   ├── review/                 daily due queue
│   ├── api/
│   │   ├── cards/[id]/review/  POST rating → FSRS update
│   │   ├── review/due/         GET cards due today
│   │   ├── ai/extract-cards/   POST text → extracted cards
│   │   └── auth/[...all]/      Better Auth handler
│   ├── error.tsx               error boundary with retry
│   └── not-found.tsx
├── components/                 FlashCard, RatingBar, StudySession,
│                               CsvImporter, AiExtractor, forms
├── server/
│   ├── actions/                deck + card Server Actions
│   ├── db/                     schema, client, ownership-scoped queries
│   └── lib/                    fsrs, auth, require-user, api, logger,
│                               extract-cards, request-log, query-timing
├── stores/                     Zustand study store
└── lib/                        shared Zod schemas, CSV parsing, http, types
e2e/                            Playwright study-loop test
drizzle/                        generated migrations
docs/                           API reference, database, diagrams, screenshots
```

## Documentation

- [**API reference**](docs/API.md) — Route Handlers and Server Actions, request/response shapes, error codes
- [**Database**](docs/DATABASE.md) — ERD, the ownership model, FSRS columns, indexes
- [**Architecture**](docs/diagrams/architecture.md) — how the pieces fit and which boundaries matter
- [**Implementation summary**](docs/IMPLEMENTATION.md) — section-by-section compliance with the spec, deliberate divergences, and what the tests cover

## Testing

```bash
pnpm test        # 74 unit tests
pnpm test:e2e    # full study loop in a real browser
```

Unit tests concentrate on the logic worth protecting: the FSRS scheduler (every rating, lapse reset, difficulty clamping, interval ordering), the Zod schemas, CSV row validation, AI retry and timeout behaviour, and the auth guards. The E2E test drives the loop end to end — sign in, create a deck, add a card, flip it, rate it, confirm the session completes — against a real browser and database, cleaning up the deck it created.

The FSRS suite is mutation-checked: changing the Hard stability factor from `0.8` to `0.9` turns it red.

## Known gaps

Honest list of what isn't done:

- **No retention-rate stat.** The deck list shows total cards and cards due; retention needs a review-history table the schema doesn't have yet.
- **No demo GIF.** Screenshots only, for now.
- **Rate limiting is in-memory.** 10 AI extractions per minute per user, enforced per process. It resets on restart and doesn't coordinate across instances — swap in Upstash before running more than one.
