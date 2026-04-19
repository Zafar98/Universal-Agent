import { NextRequest, NextResponse } from "next/server";
import { createDemoUser, createDemoSession, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";
import { getRequestIp, isLikelyBotSignup, isRateLimited, trackAttempt } from "@/lib/botProtection";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many sign up attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const website = String(body.website || "");
    const formStartedAt = Number(body.formStartedAt || 0);

    trackAttempt(ip);

    if (isLikelyBotSignup({ honeypot: website, formStartedAt })) {
      return NextResponse.json({ error: "Sign up blocked by anti-bot policy." }, { status: 400 });
    }

    const result = await createDemoUser(email, password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
    console.error("[demo/signup]", error);
    return NextResponse.json({ error: "Sign up failed. Please try again." }, { status: 500 });
  }
}
