import { NextRequest, NextResponse } from "next/server";
import { getDemoSession, activateSubscription, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  const session = await getDemoSession(token);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await activateSubscription(session.userId);

  return NextResponse.json({ subscribed: true });
}
