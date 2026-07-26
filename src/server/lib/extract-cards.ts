import { generateObject, NoObjectGeneratedError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { extractedCards, type ExtractedCards } from "@/lib/validators";
import { logger } from "@/server/lib/logger";

/**
 * SPEC §5 names claude-3-5-haiku-latest, which was retired in Feb 2026 and now
 * 404s. claude-haiku-4-5 is the documented replacement and keeps the SPEC's
 * intent: a fast, cheap model for a simple structured extraction.
 */
const MODEL = "claude-haiku-4-5";

/** SPEC §13: abort extraction after 15s. Budget covers the retry too. */
export const EXTRACT_TIMEOUT_MS = 15_000;

const PROMPT_PREFIX =
  "Extract question-answer flashcard pairs from the following text. " +
  "Each card should have a clear question (front) and a concise answer (back). " +
  "Extract only the most important concepts.\n\nText:\n";

export type ExtractResult =
  | { ok: true; cards: ExtractedCards["cards"] }
  | { ok: false; reason: "timeout" | "invalid_output" | "error" };

function callModel(text: string, signal: AbortSignal) {
  return generateObject({
    model: anthropic(MODEL),
    schema: extractedCards,
    prompt: `${PROMPT_PREFIX}${text}`,
    abortSignal: signal,
    // Retries are handled explicitly below so "retry once" means exactly once.
    maxRetries: 0,
  });
}

/**
 * Runs the extraction, retrying a single time when the model returns output
 * that doesn't match the schema (SPEC §13). Both attempts share one 15s
 * deadline, so a slow first attempt can't double the wait.
 */
export async function extractCards(text: string): Promise<ExtractResult> {
  const startedAt = Date.now();
  const signal = AbortSignal.timeout(EXTRACT_TIMEOUT_MS);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await callModel(text, signal);

      logger.info(
        {
          model: MODEL,
          attempt,
          latencyMs: Date.now() - startedAt,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cards: result.object.cards.length,
        },
        "ai.extract_cards succeeded",
      );

      return { ok: true, cards: result.object.cards };
    } catch (error) {
      const timedOut = signal.aborted;
      const badOutput = NoObjectGeneratedError.isInstance(error);

      logger.warn(
        {
          model: MODEL,
          attempt,
          latencyMs: Date.now() - startedAt,
          timedOut,
          badOutput,
          err: error instanceof Error ? error.message : String(error),
        },
        "ai.extract_cards failed",
      );

      if (timedOut) return { ok: false, reason: "timeout" };
      // Only a schema mismatch is worth a second attempt, and only once.
      if (badOutput && attempt === 1) continue;
      return { ok: false, reason: badOutput ? "invalid_output" : "error" };
    }
  }

  return { ok: false, reason: "invalid_output" };
}
