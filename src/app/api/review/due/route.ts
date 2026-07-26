import { NextResponse } from "next/server";
import { getDueCards } from "@/server/db/queries";
import { getApiUser, jsonError } from "@/server/lib/api";

export async function GET() {
  const user = await getApiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const due = await getDueCards(user.id);

  return NextResponse.json({ cards: due });
}
