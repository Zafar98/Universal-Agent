import { NextRequest, NextResponse } from "next/server";
import {
  listBlockedIdentities,
  listRecentBotRiskEvents,
  unblockIdentity,
} from "@/lib/botAbuseStore";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [blocked, riskEvents] = await Promise.all([
    listBlockedIdentities(300),
    listRecentBotRiskEvents(300),
  ]);

  return NextResponse.json({ blocked, riskEvents });
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id || "");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const ok = await unblockIdentity(id, session.businessName || "admin");
    if (!ok) {
      return NextResponse.json({ error: "Block entry not found or already unblocked." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin unblock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
