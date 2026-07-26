import { describe, expect, it } from "vitest";
import {
  isSafeReturnTo,
  safeReturnTo,
  signInWithReturnTo,
} from "@/lib/return-to";

describe("return-to safety", () => {
  it.each(["/decks", "/decks/abc/study", "/review"])(
    "accepts the same-origin path %s",
    (path) => {
      expect(isSafeReturnTo(path)).toBe(true);
      expect(safeReturnTo(path)).toBe(path);
    },
  );

  // A `next` value comes from the URL, so it is attacker-controlled.
  it.each([
    "//evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "/\\evil.com",
    "javascript:alert(1)",
    "decks",
    "",
    null,
    undefined,
  ])("rejects %o as an open-redirect risk", (value) => {
    expect(isSafeReturnTo(value)).toBe(false);
    expect(safeReturnTo(value)).toBe("/decks");
  });

  it("encodes the path into the sign-in URL", () => {
    expect(signInWithReturnTo("/decks/a b/study")).toBe(
      "/sign-in?next=%2Fdecks%2Fa%20b%2Fstudy",
    );
  });

  it("drops an unsafe path rather than encoding it", () => {
    expect(signInWithReturnTo("https://evil.com")).toBe("/sign-in");
  });
});
