import { NextRequest, NextResponse } from "next/server";
import { getRequestIp } from "@/lib/botProtection";
import { buildIdentityHash, recordTrialCompleted } from "@/lib/trialTrackingStore";
import { getDemoSession, markDemoUsed, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

/**
 * POST /api/demo/trial-complete
 *
 * Called by the client when the trial call ends (timer expires or user hangs up).
 * Marks the trial as fully used for this IP+fingerprint identity so that
 * returning to the page — even with a new browser session — does not grant a
 * fresh trial.
 *
 * Body: { fingerprint?: string }
 */
export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const body = await request.json().catch(() => ({}));
  const fingerprint = String(body.fingerprint || "");
  const identityHash = buildIdentityHash(ip, fingerprint);

  // Also ensure the account-level flag is set
  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  const session = token ? await getDemoSession(token) : null;
  if (session && !session.hasUsedDemo) {
    await markDemoUsed(session.userId);
  }

  await recordTrialCompleted(identityHash);

  return NextResponse.json({ ok: true, blocked: true });
}
