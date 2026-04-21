import { NextRequest, NextResponse } from "next/server";
import { memDemoTries } from "@/lib/trialTrackingStore";
import { buildIdentityHash } from "@/lib/trialTrackingStore";

// POST: Reset all demo tries
export async function POST(request: NextRequest) {
  memDemoTries.clear();
  return NextResponse.json({ success: true, message: "All demo tries reset." });
}

// GET: Reset demo tries for a specific fingerprint (pass ?fingerprint=... in query)
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "test-ip";
  const url = new URL(request.url);
  const fingerprint = url.searchParams.get("fingerprint") || "";
  if (!fingerprint) {
    return NextResponse.json({ error: "Missing fingerprint param." }, { status: 400 });
  }
  const identityHash = buildIdentityHash(ip, fingerprint);
  memDemoTries.delete(identityHash);
  return NextResponse.json({ success: true, message: "Demo tries reset for fingerprint.", fingerprint });
}
