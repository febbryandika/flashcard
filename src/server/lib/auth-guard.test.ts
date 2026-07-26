import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    // Next's redirect() throws to unwind the render; mirror that here so a
    // guard that fails to stop execution is caught rather than silently passing.
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
);

// Mocking the auth module keeps these tests hermetic — importing the real one
// would pull in the Drizzle client and require a live DATABASE_URL.
vi.mock("@/server/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect }));

const { requireUser } = await import("@/server/lib/require-user");
const { getApiUser, jsonError } = await import("@/server/lib/api");

const user = { id: "user_1", email: "a@b.com" };

afterEach(() => {
  getSession.mockReset();
  redirect.mockClear();
});

describe("requireUser (pages and Server Actions)", () => {
  it("returns the user when the session is valid", async () => {
    getSession.mockResolvedValueOnce({ user });

    await expect(requireUser()).resolves.toEqual(user);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when there is no session", async () => {
    getSession.mockResolvedValueOnce(null);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects when the session resolves undefined", async () => {
    getSession.mockResolvedValueOnce(undefined);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
  });
});

describe("getApiUser (Route Handlers)", () => {
  it("returns the user when the session is valid", async () => {
    getSession.mockResolvedValueOnce({ user });

    await expect(getApiUser()).resolves.toEqual(user);
  });

  // Handlers must be able to answer 401 JSON — never a redirect to an HTML page.
  it.each([null, undefined, {}])(
    "returns null rather than redirecting for session %o",
    async (session) => {
      getSession.mockResolvedValueOnce(session);

      await expect(getApiUser()).resolves.toBeNull();
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});

describe("jsonError", () => {
  it("returns the documented { error } shape with the given status", async () => {
    const response = jsonError("Unauthorized", 401);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
