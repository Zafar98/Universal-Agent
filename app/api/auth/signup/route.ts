import { NextRequest, NextResponse } from "next/server";
import { createPendingBusinessSignup } from "@/lib/businessAuthStore";
import { listBusinessModels } from "@/lib/tenantConfig";
import { BusinessModelId } from "@/lib/businessModels";
import { sendVerificationCode } from "@/lib/verificationDelivery";
import {
  calculateSignupRiskScore,
  getRecentAttemptCount,
  getRequestIp,
  isRateLimited,
  trackAttempt,
} from "@/lib/botProtection";
import {
  blockIdentity,
  getRecentRiskScoreForIp,
  isRequestIdentityBlocked,
  recordBotRiskEvent,
} from "@/lib/botAbuseStore";
import { verifyChallengeToken } from "@/lib/challengeVerification";

const CHALLENGE_THRESHOLD = 60;
const HARD_BLOCK_THRESHOLD = 120;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    const alreadyBlocked = await isRequestIdentityBlocked({ ip, userAgent });
    if (alreadyBlocked) {
      return NextResponse.json({ error: "Request blocked by security policy." }, { status: 403 });
    }

    if (isRateLimited(ip)) {
      await recordBotRiskEvent({
        ip,
        userAgent,
        route: "/api/auth/signup",
        signalType: "rate-limited",
        score: 40,
      });
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
      challengeToken,
      termsAccepted,
      privacyAccepted,
      dpaAccepted,
      subprocessorAccepted,
      aiDisclosureAccepted,
    } = body;

    trackAttempt(ip);

    const ipAttemptCount = getRecentAttemptCount(ip);
    const recentRiskScore = await getRecentRiskScoreForIp(ip);
    const risk = calculateSignupRiskScore({
      honeypot: website,
      formStartedAt: Number(formStartedAt),
      userAgent,
      email: String(email || ""),
      ipAttemptCount,
      recentRiskScore,
    });

    await recordBotRiskEvent({
      ip,
      userAgent,
      route: "/api/auth/signup",
      signalType: "signup-risk-evaluation",
      score: risk.score,
      details: {
        reasons: risk.reasons,
        ipAttemptCount,
        recentRiskScore,
      },
    });

    const requiresChallenge = risk.score >= CHALLENGE_THRESHOLD;
    if (requiresChallenge) {
      const challenge = await verifyChallengeToken(String(challengeToken || ""), ip);
      if (!challenge.success) {
        await recordBotRiskEvent({
          ip,
          userAgent,
          route: "/api/auth/signup",
          signalType: "challenge-failed",
          score: 35,
          details: { reason: challenge.reason || "failed", provider: challenge.provider },
        });

        if (risk.score >= HARD_BLOCK_THRESHOLD || risk.reasons.includes("honeypot-filled")) {
          await blockIdentity({
            identityType: "ip",
            identityValue: ip,
            reason: `Automated signup abuse detected (${risk.reasons.join(", ") || "high-risk-pattern"})`,
            severity: "high",
            source: "signup-route",
          });
          await blockIdentity({
            identityType: "user_agent",
            identityValue: userAgent,
            reason: "Associated with blocked automated signup abuse.",
            severity: "medium",
            source: "signup-route",
          });
        }

        return NextResponse.json(
          {
            error: "Additional human verification is required.",
            requiresChallenge: true,
          },
          { status: 403 }
        );
      }
    }

    if (!firstName || !surname || !email || !password) {
      return NextResponse.json(
        { error: "firstName, surname, email, and password are required" },
        { status: 400 }
      );
    }

    if (!termsAccepted || !privacyAccepted || !dpaAccepted || !subprocessorAccepted || !aiDisclosureAccepted) {
      return NextResponse.json(
        {
          error:
            "You must accept Terms, Privacy, DPA, Sub-processor acknowledgement, and AI/call recording disclosure.",
        },
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