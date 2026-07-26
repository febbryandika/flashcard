import { NextRequest, NextResponse } from "next/server";
import { aiExtractInput } from "@/lib/validators";
import { getApiUser, jsonError } from "@/server/lib/api";
import { extractCards } from "@/server/lib/extract-cards";

const FAILURE_MESSAGES = {
  timeout: "Extraction timed out. Your text is preserved — try again.",
  invalid_output: "The model returned an unexpected response. Try again.",
  error: "Extraction failed. Your text is preserved — try again.",
} as const;

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return jsonError("Unauthorized", 401);

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
