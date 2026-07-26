import { NextResponse, type NextRequest } from "next/server";
import { withRequestLogging } from "@/server/lib/request-log";
import { getDueStudyCards } from "@/server/db/queries";
import { getApiUser, jsonError } from "@/server/lib/api";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by withRequestLogging
async function handleGET(_req: NextRequest) {
  const user = await getApiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const due = await getDueStudyCards(user.id);

  return NextResponse.json({ cards: due });
}

export const GET = withRequestLogging(handleGET);
