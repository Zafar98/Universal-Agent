import { NextRequest, NextResponse } from "next/server";
import { deleteDemoSession, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  if (token) await deleteDemoSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
