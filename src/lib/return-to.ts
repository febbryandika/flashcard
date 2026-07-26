export const RETURN_TO_PARAM = "next";

const FALLBACK = "/decks";

/** Sign-in URL that remembers where the user was (SPEC §10). */
export function signInWithReturnTo(pathname: string) {
  if (!isSafeReturnTo(pathname)) return "/sign-in";
  return `/sign-in?${RETURN_TO_PARAM}=${encodeURIComponent(pathname)}`;
}

/**
 * Only same-origin, absolute paths may be returned to — a raw `next` value is
 * attacker-controlled, so anything protocol-relative or off-site is discarded
 * rather than becoming an open redirect.
 */
export function isSafeReturnTo(value: string | null | undefined) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}

export function safeReturnTo(value: string | null | undefined) {
  return isSafeReturnTo(value) ? value! : FALLBACK;
}
