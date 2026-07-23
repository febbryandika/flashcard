"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={handleSignOut}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
