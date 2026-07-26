import type { NextRequest } from "next/server";
import { logger } from "@/server/lib/logger";

type Handler<Args extends unknown[]> = (
  req: NextRequest,
  ...args: Args
) => Promise<Response>;

/**
 * Structured request + error logging for Route Handlers (SPEC §12). One line
 * per request with method, path, status and duration; errors are logged and
 * rethrown so Next still renders its own error response.
 */
export function withRequestLogging<Args extends unknown[]>(
  handler: Handler<Args>,
): Handler<Args> {
  return async (req, ...args) => {
    const startedAt = performance.now();
    const path = new URL(req.url).pathname;
    const ms = () => Math.round(performance.now() - startedAt);

    try {
      const response = await handler(req, ...args);
      logger.info(
        { method: req.method, path, status: response.status, ms: ms() },
        "request",
      );
      return response;
    } catch (error) {
      logger.error(
        {
          method: req.method,
          path,
          ms: ms(),
          err: error instanceof Error ? error.message : String(error),
        },
        "request failed",
      );
      throw error;
    }
  };
}
