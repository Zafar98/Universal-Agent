import { NextRequest, NextResponse } from "next/server";
import { createBusinessPasswordResetToken } from "@/lib/businessAuthStore";
import { sendPasswordResetEmail } from "@/lib/verificationDelivery";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = String(body.identifier || "").trim();
    if (!identifier) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const reset = await createBusinessPasswordResetToken({ identifier });
    if (!reset || !reset.account.email) {
      return NextResponse.json({ ok: true, message: "If an account exists, a reset email has been sent." });
    }

    const baseUrl = process.env.APP_BASE_URL || request.nextUrl.origin;
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(reset.token)}`;
    const delivery = await sendPasswordResetEmail({
      businessName: reset.account.businessName,
      email: reset.account.email,
      resetUrl,
    });

    return NextResponse.json({
      ok: true,
      message: "If an account exists, a reset email has been sent.",
      delivery,
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
