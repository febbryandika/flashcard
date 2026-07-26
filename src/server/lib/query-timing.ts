import { logger } from "@/server/lib/logger";

const enabled = process.env.NODE_ENV === "development";

/**
 * Surfaces Drizzle query timing in development only (SPEC §12). In any other
 * environment this is a straight pass-through — no timers, no log lines.
 */
export function timed<T>(name: string, run: () => Promise<T>): Promise<T> {
  if (!enabled) return run();

  const startedAt = performance.now();
  return run().finally(() => {
    logger.debug(
      { query: name, ms: Math.round(performance.now() - startedAt) },
      "db query",
    );
  });
}
