# API reference

The app uses **Server Actions** for form-driven CRUD and **Route Handlers** for anything the client calls imperatively. Both resolve the session before doing any work, and both scope every read and write to the signed-in user.

---

## Route Handlers

Three handlers, all under `/api`. Every one returns `{ "error": string }` with an appropriate status on failure.

| Method | Path                    | Purpose                                          |
| ------ | ----------------------- | ------------------------------------------------ |
| `POST` | `/api/cards/:id/review` | Submit a rating → FSRS update → next review date |
| `GET`  | `/api/review/due`       | Cards due now across every deck                  |
| `POST` | `/api/ai/extract-cards` | Extract flashcards from pasted text              |

`/api/auth/[...all]` is Better Auth's catch-all and is not documented here.

### `POST /api/cards/:id/review`

Applies the FSRS scheduler to a card and persists the result. The scheduler runs **server-side only** — the client sends a rating, never a schedule.

**Request**

```json
{ "rating": 3 }
```

`rating` must be exactly `1` (Again), `2` (Hard), `3` (Good), or `4` (Easy). Anything else — `0`, `5`, `"3"`, `2.5`, missing — is rejected.

**200**

```json
{ "nextReviewAt": "2026-08-20T13:26:35.338Z", "interval": 25 }
```

| Status | When                                            |
| ------ | ----------------------------------------------- |
| `400`  | Rating not in 1–4, or a malformed JSON body     |
| `401`  | No valid session                                |
| `404`  | Card does not exist, or belongs to another user |

A card owned by someone else returns `404`, not `403` — the response is identical to a card that doesn't exist, so the endpoint never confirms that an id is real.

### `GET /api/review/due`

Every card whose `next_review_at` has passed, across all of the user's decks, oldest first.

**200**

```json
{
  "cards": [
    {
      "id": "n7860x2xqdjgncdqu1wze4h8",
      "deckId": "fmhz6aegrgsytlb9zypi4y8i",
      "deckName": "German Vocabulary",
      "front": "der Schlüssel",
      "back": "the key",
      "example": "Ich habe meinen Schlüssel verloren.",
      "previews": { "1": 1, "2": 20, "3": 25, "4": 30 }
    }
  ]
}
```

`previews` is the interval in **days** each rating would schedule, computed server-side so the rating buttons can show "Good → 25d" without the scheduler reaching the client bundle.

| Status | When             |
| ------ | ---------------- |
| `401`  | No valid session |

### `POST /api/ai/extract-cards`

Extracts question/answer pairs from pasted text using `generateObject()` (Vercel AI SDK) against `claude-haiku-4-5`.

**Request**

```json
{ "text": "Photosynthesis converts light energy into chemical energy..." }
```

`text` is trimmed and must be 1–5,000 characters.

**200**

```json
{
  "cards": [
    {
      "front": "What does photosynthesis do?",
      "back": "Converts light energy into chemical energy stored as glucose."
    }
  ]
}
```

At most **20** cards are returned — the schema caps it.

| Status | When                                                         |
| ------ | ------------------------------------------------------------ |
| `400`  | Empty text, over 5,000 characters, or a malformed JSON body  |
| `401`  | No valid session                                             |
| `502`  | The model returned output that failed the schema twice       |
| `429`  | More than 10 extractions in a minute (carries `Retry-After`) |
| `504`  | Extraction exceeded the 15-second budget                     |

**Reliability** (see [`extract-cards.ts`](../src/server/lib/extract-cards.ts)): one 15-second deadline shared across attempts, exactly one retry and only on a schema mismatch, and token usage plus latency logged per call. On any failure the client keeps the pasted text so the user can retry without re-typing.

**Rate limiting** (SPEC §9): 10 extractions per minute per user, sliding window. Exceeding it returns `429` with a `Retry-After` header. The limiter is in-memory, so it is per-process and resets on restart — sufficient for a single-instance deployment, and swappable for Upstash by replacing one function.

---

## Server Actions

Form-driven CRUD. Each action resolves the session, validates with Zod, scopes the write by `userId`, and revalidates the affected routes. Defined in [`src/server/actions/`](../src/server/actions).

### Decks — `decks.ts`

| Action       | Signature                       | Notes                                                                            |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------- |
| `createDeck` | `(prevState, formData)`         | Redirects to `/decks` on success                                                 |
| `updateDeck` | `(deckId, prevState, formData)` | Scoped by `id` **and** `userId`; returns "Deck not found." if it matches nothing |
| `deleteDeck` | `(deckId)`                      | Cards removed by the foreign-key cascade                                         |

### Cards — `cards.ts`

| Action        | Signature                       | Notes                                                                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `createCard`  | `(deckId, prevState, formData)` | Verifies deck ownership first; stays on the page so cards can be added in sequence                      |
| `updateCard`  | `(cardId, prevState, formData)` | Loads via `getUserCard` (the ownership join) before writing                                             |
| `deleteCard`  | `(cardId)`                      | Same ownership join                                                                                     |
| `importCards` | `(deckId, rows)`                | Batch insert used by **both** the CSV importer and the AI extractor; re-validates every row server-side |

The create/update actions take `(prevState, formData)` because they are driven by `useActionState`, which lets validation errors render inline instead of hitting an error boundary. They return `{ error, attempt, values? }` — `attempt` re-keys the form so typed input survives a failed submit and clears on success.

`importCards` is the single batch-insert path. The CSV importer's client-side row filtering is a **convenience, not a trust boundary**: the action re-validates every row against the same schema as manual entry and enforces the 500-row cap.

---

## Conventions

**Validation.** Every input is parsed with Zod before touching the database. Shared schemas live in [`src/lib/validators.ts`](../src/lib/validators.ts), so a card added by hand, by CSV, or by AI obeys identical rules.

**Auth.** Pages and Server Actions call `requireUser()`, which redirects to `/sign-in`. Route Handlers call `getApiUser()`, which returns `null` so the handler can answer `401` JSON — a fetch needs a status it can branch on, not a redirect to an HTML page.

**Errors.** `jsonError(message, status)` produces the uniform `{ error }` shape. Handlers are wrapped in `withRequestLogging`, which logs method, path, status, and duration for every request.
