import pino from "pino";

/**
 * Structured logging (SPEC §12). Pretty-printed in development, JSON in
 * production so log aggregators can parse it.
 */
export const logger = pino({
  // debug in development so query timing is visible; info elsewhere.
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "development" ? "debug" : "info"),
  ...(process.env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});
