import { NextRequest, NextResponse } from "next/server";
import { getDemoSession, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  const session = await getDemoSession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    hasUsedDemo: session.hasUsedDemo,
    subscribed: session.subscribed,
  });
}
