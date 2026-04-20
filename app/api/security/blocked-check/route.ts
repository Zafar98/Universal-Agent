import { NextRequest, NextResponse } from "next/server";
import { getRequestIp } from "@/lib/botProtection";
import { isRequestIdentityBlocked } from "@/lib/botAbuseStore";

export async function GET(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("x-original-user-agent") || request.headers.get("user-agent") || "";
    const fingerprint = request.headers.get("x-client-fingerprint") || "";

    const blocked = await isRequestIdentityBlocked({
      ip,
      userAgent,
      fingerprint,
    });

    return NextResponse.json({ blocked });
  } catch (error) {
    console.error("Blocked check failed:", error);
    return NextResponse.json({ blocked: false });
  }
}
