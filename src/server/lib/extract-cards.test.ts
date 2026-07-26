import { afterEach, describe, expect, it, vi } from "vitest";
import { NoObjectGeneratedError } from "ai";

const generateObject = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateObject,
}));

vi.mock("@ai-sdk/anthropic", () => ({ anthropic: () => "mock-model" }));

const { extractCards } = await import("@/server/lib/extract-cards");

/** Matches the SDK's LanguageModelUsage shape so the mock typechecks. */
const usage = (inputTokens: number, outputTokens: number) => ({
  inputTokens,
  outputTokens,
  totalTokens: inputTokens + outputTokens,
  inputTokenDetails: {
    noCacheTokens: inputTokens,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  },
  outputTokenDetails: { textTokens: outputTokens, reasoningTokens: 0 },
});

const ok = (cards: { front: string; back: string }[]) => ({
  object: { cards },
  usage: usage(100, 50),
});

const badOutput = () =>
  new NoObjectGeneratedError({
    message: "schema mismatch",
    text: "not json",
    response: { id: "r", timestamp: new Date(0), modelId: "m" },
    usage: usage(1, 1),
    finishReason: "stop",
  });

afterEach(() => {
  generateObject.mockReset();
});

describe("extractCards", () => {
  it("returns cards when the first attempt succeeds", async () => {
    generateObject.mockResolvedValueOnce(ok([{ front: "Q", back: "A" }]));

    const result = await extractCards("some text");

    expect(result).toEqual({ ok: true, cards: [{ front: "Q", back: "A" }] });
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("retries once when the model returns output that fails the schema", async () => {
    generateObject
      .mockRejectedValueOnce(badOutput())
      .mockResolvedValueOnce(ok([{ front: "Q", back: "A" }]));

    const result = await extractCards("some text");

    expect(result.ok).toBe(true);
    expect(generateObject).toHaveBeenCalledTimes(2);
  });

  it("retries at most once, then fails gracefully", async () => {
    generateObject
      .mockRejectedValueOnce(badOutput())
      .mockRejectedValueOnce(badOutput());

    const result = await extractCards("some text");

    expect(result).toEqual({ ok: false, reason: "invalid_output" });
    // SPEC §13: retry a single time — never a third attempt.
    expect(generateObject).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-schema error", async () => {
    generateObject.mockRejectedValueOnce(new Error("connection reset"));

    const result = await extractCards("some text");

    expect(result).toEqual({ ok: false, reason: "error" });
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("reports a timeout without retrying once the deadline has passed", async () => {
    generateObject.mockImplementationOnce(
      async ({ abortSignal }: { abortSignal: AbortSignal }) => {
        // Simulate the deadline elapsing mid-flight.
        Object.defineProperty(abortSignal, "aborted", { value: true });
        throw new Error("aborted");
      },
    );

    const result = await extractCards("some text");

    expect(result).toEqual({ ok: false, reason: "timeout" });
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("passes an abort signal so the request cannot hang forever", async () => {
    generateObject.mockResolvedValueOnce(ok([]));

    await extractCards("some text");

    expect(generateObject.mock.calls[0][0].abortSignal).toBeInstanceOf(
      AbortSignal,
    );
    // Retries are ours, not the SDK's.
    expect(generateObject.mock.calls[0][0].maxRetries).toBe(0);
  });
});
