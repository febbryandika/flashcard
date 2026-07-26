import { NextRequest, NextResponse } from "next/server";
import { withRequestLogging } from "@/server/lib/request-log";
import { aiExtractInput } from "@/lib/validators";
import { getApiUser, jsonError } from "@/server/lib/api";
import { extractCards } from "@/server/lib/extract-cards";
import { rateLimit } from "@/server/lib/rate-limit";

/** SPEC §9: AI is the only paid, slow path, so it is the one worth limiting. */
const LIMIT = 10;
const WINDOW_MS = 60_000;

const FAILURE_MESSAGES = {
  timeout: "Extraction timed out. Your text is preserved — try again.",
  invalid_output: "The model returned an unexpected response. Try again.",
  error: "Extraction failed. Your text is preserved — try again.",
} as const;

async function handlePOST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return jsonError("Unauthorized", 401);

  // Keyed per user, so one account cannot exhaust everyone else's budget.
  const limit = rateLimit(`ai:${user.id}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    const response = jsonError(
      `Too many extractions. Try again in ${limit.retryAfter}s.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfter));
    return response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = aiExtractInput.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0].message, 400);
  }

  const result = await extractCards(parsed.data.text);
  if (!result.ok) {
    // 504 on timeout, 502 when the upstream model misbehaved.
    const status = result.reason === "timeout" ? 504 : 502;
    return jsonError(FAILURE_MESSAGES[result.reason], status);
  }

  return NextResponse.json({ cards: result.cards });
}

export const POST = withRequestLogging(handlePOST);
