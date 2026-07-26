import pino from "pino";

/**
 * Structured logging (SPEC §12). Pretty-printed in development, JSON in
 * production so log aggregators can parse it.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});
