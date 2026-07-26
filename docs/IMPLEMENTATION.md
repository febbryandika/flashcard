# Implementation summary

A section-by-section record of how the build compares to [`SPEC.md`](../SPEC.md), including every place it deliberately diverges and why. Written at the end of the final review pass.

## Compliance at a glance

| SPEC section             | Status   | Note                                                     |
| ------------------------ | -------- | -------------------------------------------------------- |
| §1 Core features         | 7 of 8   | Retention-rate stat deferred — see [Deferred](#deferred) |
| §2 Project structure     | Complete | All 18 specified paths exist                             |
| §3 FSRS algorithm        | Complete | One testability change, below                            |
| §4 Data model            | Complete | Schema matches field-for-field                           |
| §5 Server logic          | Complete | One signature change, below                              |
| §6 Routes & components   | Complete | All 5 named components built                             |
| §7 Security              | Complete |                                                          |
| §8 Development workflow  | Complete | All 10 steps                                             |
| §9 Non-functional        | Complete |                                                          |
| §10 Error & empty states | Complete |                                                          |
| §11 Testing              | Complete | 80 unit tests + Playwright E2E                           |
| §12 Observability        | Complete |                                                          |
| §13 AI reliability       | Complete |                                                          |
| §14 Deliverables         | 6 of 7   | No demo GIF; Docker Compose replaced — below             |

## Deliberate divergences

Each was a decision made with the maintainer rather than a silent departure.

**Model substitution (§5).** SPEC names `claude-3-5-haiku-latest`, which was retired in February 2026 and returns 404 — every extraction would have failed. Replaced with `claude-haiku-4-5`, the documented successor, preserving the intent of a fast, cheap model for a simple extraction.

**FSRS takes an injectable clock (§3).** `fsrs(state, rating, now = new Date())` instead of calling `Date.now()` inline, so tests can assert exact scheduling dates. Behaviour is identical.

**Server Action signatures (§5).** Create/update actions take `(prevState, formData)` rather than `(formData)`. SPEC's example calls `.parse()`, which throws and would surface a full error boundary on a validation failure; the `useActionState` shape lets errors render inline, which is what §10 asks for. Same architecture, better failure behaviour.

**Interval previews are computed server-side (§6 vs §7).** §6 wants the rating buttons to preview the next interval; §7 requires FSRS to run server-side only. Rather than ship the scheduler to the browser, the server computes all four candidate intervals and sends them as data with each card.

**Card routes beyond the structure diagram (§2).** SPEC lists no routes for card create/edit. Adding is inline on the deck page (adding 20 cards shouldn't mean 40 navigations); editing has its own page at `/decks/[id]/cards/[cardId]/edit`.

**Local setup without Docker Compose (§14).** The app talks to Postgres through Neon's HTTP driver, which needs a Neon endpoint or a WebSocket proxy — a stock compose Postgres will not work. Rather than carry a proxy container and a driver switch, setup documents the Neon path and says so plainly.

**Rate limiting is in-memory (§9).** SPEC offers "Upstash Ratelimit, sliding window — or an in-memory limiter". The in-memory option is implemented: 10 AI extractions per minute per user. Per-process and resets on restart; swapping in Upstash means replacing one function.

## Deferred

**Retention rate (§1).** The deck list shows total cards and cards due today, but not retention. True retention — the share of reviews rated Good or better — needs review history, and the §4 schema stores only current card state. Adding it means a new `review_log` table and migration. Deferred rather than fabricating a number from data that doesn't exist.

**Demo GIF (§14).** Four screenshots are committed under `docs/screenshots/`; the ~15s recording is not.

## What the tests actually cover

80 unit tests and one end-to-end study loop, concentrated on logic worth protecting rather than on coverage percentage:

- **FSRS** — each rating's stability and interval, lapse reset, stability floor, difficulty clamping at both bounds, interval ordering, and the scheduled date. Mutation-checked: changing the Hard factor from `0.8` to `0.9` turns the suite red.
- **Validation** — deck, card, rating, and CSV-batch schemas, including the regression where the importer's `example: null` was rejected by a schema expecting a string, which silently broke every import containing a blank example.
- **CSV** — row flagging, the 500-row cap, and that invalid rows don't consume the row budget, parsed through real Papa Parse.
- **AI reliability** — retry fires exactly once and only on schema mismatch, never on a transient error; timeouts report as timeouts; the abort signal is passed through.
- **Auth guards** — `requireUser` redirects on a missing session; `getApiUser` returns `null` so handlers can answer 401 JSON.
- **Rate limiting** — the window slides per-hit rather than all at once, and keys are independent.
- **E2E** — sign in, create a deck, add a card, flip, rate, session complete, then delete the deck it created.

## Bugs found by verification

Recorded because they are the phases' most useful output — each passed types, lint, and tests before being caught by exercising the running app:

| Bug                                                 | How it surfaced                                          |
| --------------------------------------------------- | -------------------------------------------------------- |
| Every CSV import with a blank example failed        | Running a real import; types and unit tests both passed  |
| Card form wiped valid input on a validation error   | Typing into the form and submitting an invalid row       |
| `"use server"` module crashed on a non-async export | Loading the page; `tsc` and ESLint were clean            |
| Study session flashed the previous session's state  | Navigating between two study sessions                    |
| `useSearchParams` broke the production build        | `pnpm build`; dev mode was fine                          |
| Deck list overflowed at 375px                       | Comparing `scrollWidth` to `clientWidth`, not eyeballing |
| E2E test leaked decks into the database             | Checking the database after a green test run             |
| A screenshot captured the wrong page                | Opening the PNG instead of trusting the passing capture  |
