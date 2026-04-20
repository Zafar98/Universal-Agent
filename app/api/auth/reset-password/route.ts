import { NextRequest, NextResponse } from "next/server";
import { resetBusinessPassword } from "@/lib/businessAuthStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const ok = await resetBusinessPassword({ token, password: password.trim() });
    if (!ok) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
