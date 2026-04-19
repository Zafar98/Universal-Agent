import { NextRequest, NextResponse } from "next/server";
import { createPendingBusinessSignup } from "@/lib/businessAuthStore";
import { listBusinessModels } from "@/lib/tenantConfig";
import { BusinessModelId } from "@/lib/businessModels";
import { sendVerificationCode } from "@/lib/verificationDelivery";
import { getRequestIp, isLikelyBotSignup, isRateLimited, trackAttempt } from "@/lib/botProtection";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many sign up attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const {
      selectedPlan,
      selectedIntegration,
      firstName,
      surname,
      email,
      password,
      website,
      formStartedAt,
      termsAccepted,
      privacyAccepted,
    } = body;

    trackAttempt(ip);

    if (isLikelyBotSignup({ honeypot: website, formStartedAt: Number(formStartedAt) })) {
      return NextResponse.json({ error: "Sign up blocked by anti-bot policy." }, { status: 400 });
    }

    if (!firstName || !surname || !email || !password) {
      return NextResponse.json(
        { error: "firstName, surname, email, and password are required" },
        { status: 400 }
      );
    }

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: "You must accept Terms and Privacy Policy to continue." },
        { status: 400 }
      );
    }

    const supported = listBusinessModels().map((model) => model.id) as BusinessModelId[];
    const defaultBusinessModelId = supported[0];

    if (!defaultBusinessModelId) {
      return NextResponse.json({ error: "No supported business model configured" }, { status: 500 });
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedFirstName = String(firstName).trim();
    const normalizedSurname = String(surname).trim();
    const normalizedBusinessName = `${normalizedFirstName} ${normalizedSurname}`.trim();

    if (!normalizedFirstName || !normalizedSurname) {
      return NextResponse.json({ error: "First name and surname are required" }, { status: 400 });
    }

    const signup = await createPendingBusinessSignup({
      businessName: normalizedBusinessName,
      businessModelId: defaultBusinessModelId,
      agentCount: 1,
      selectedPlan: String(selectedPlan || "starter"),
      selectedIntegration: String(selectedIntegration || "website-widget"),
      verificationMethod: "email",
      email: String(email),
      password: String(password),
    });

    const baseUrl = process.env.APP_BASE_URL || request.nextUrl.origin;
    const verificationUrl = `${baseUrl}/api/auth/verify?pendingId=${encodeURIComponent(signup.pendingId)}&verificationCode=${encodeURIComponent(signup.verificationCode)}`;

    const delivery = await sendVerificationCode({
      businessName: normalizedBusinessName,
      verificationMethod: "email",
      email: String(email || "") || null,
      verificationCode: signup.verificationCode,
      verificationUrl,
    });

    return NextResponse.json({
      ok: true,
      pendingId: signup.pendingId,
      tenantId: signup.tenantId,
      delivery,
      verificationUrl: process.env.NODE_ENV === "production" ? undefined : verificationUrl,
      verificationPreviewCode: process.env.NODE_ENV === "production" ? undefined : signup.verificationCode,
    });
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}