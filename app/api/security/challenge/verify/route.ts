import { NextRequest, NextResponse } from "next/server";
import { getRequestIp } from "@/lib/botProtection";
import { verifyChallengeToken } from "@/lib/challengeVerification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body?.token || "");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Challenge token is required." }, { status: 400 });
    }

    const ip = getRequestIp(request);
    const result = await verifyChallengeToken(token, ip);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.reason || "Challenge failed." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, provider: result.provider });
  } catch (error) {
    console.error("Challenge verification error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
