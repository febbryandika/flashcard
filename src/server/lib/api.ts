import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/server/lib/auth";

/** Uniform failure shape for every Route Handler (SPEC §9). */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Route Handler counterpart to requireUser(): returns null instead of
 * redirecting, so handlers can answer 401 JSON rather than a 307 to /sign-in.
 */
export async function getApiUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
