import { NextRequest, NextResponse } from "next/server";
import { authenticateDemoUser, createDemoSession, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    const result = await authenticateDemoUser(email, password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const session = await createDemoSession(result.user);

    const response = NextResponse.json({
      email: result.user.email,
      hasUsedDemo: result.user.hasUsedDemo,
      subscribed: result.user.subscribed,
    });

    response.cookies.set(DEMO_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("[demo/login]", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
