import { NextRequest, NextResponse } from "next/server";
import { getRequestIp } from "@/lib/botProtection";
import { buildIdentityHash, getTrialWindowStatus } from "@/lib/trialTrackingStore";
import { getDemoSession, markDemoUsed, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

/**
 * GET /api/demo/trial-status
 *
 * Returns whether this device/IP is permitted to start a free trial.
 * Query params:
 *   fingerprint – client-computed browser fingerprint (optional but recommended)
 *
 * Response:
 *   { blocked: boolean; secondsLeft: number; hasStarted: boolean; isActive: boolean; expiresAt?: string | null }
 */
export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const fingerprint = request.nextUrl.searchParams.get("fingerprint") || "";
  const identityHash = buildIdentityHash(ip, fingerprint);

  // If the session is active and subscribed, they are never blocked
  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  const session = token ? await getDemoSession(token) : null;
  if (session?.subscribed) {
    return NextResponse.json({
      blocked: false,
      subscribed: true,
      hasStarted: false,
      isActive: false,
      secondsLeft: 0,
      expiresAt: null,
    });
  }

  const trialStatus = await getTrialWindowStatus(identityHash);

  if (trialStatus.isBlocked && session && !session.hasUsedDemo) {
    await markDemoUsed(session.userId);
  }

  if (trialStatus.isBlocked) {
    return NextResponse.json({
      blocked: true,
      reason: "This device has already used the shared 60-second demo window. Subscribe for unlimited access.",
      hasStarted: trialStatus.hasStarted,
      isActive: false,
      secondsLeft: 0,
      expiresAt: trialStatus.expiresAt,
    });
  }

  return NextResponse.json({
    blocked: false,
    hasStarted: trialStatus.hasStarted,
    isActive: trialStatus.isActive,
    secondsLeft: trialStatus.secondsLeft,
    expiresAt: trialStatus.expiresAt,
  });
}
