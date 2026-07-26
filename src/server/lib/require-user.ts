import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";

/**
 * Resolves the Better Auth session. Redirects to /sign-in when absent.
 * Use in Server Components and Server Actions guarding authenticated pages.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session.user;
}
