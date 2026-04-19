import { NextRequest, NextResponse } from "next/server";
import { createBusinessSession, verifyPendingBusinessSignup } from "@/lib/businessAuthStore";
import { buildDashboardSessionCookie } from "@/lib/sessionAuth";
import { getEffectiveBusinessWorkspace } from "@/lib/businessWorkspaceStore";

export async function GET(request: NextRequest) {
  try {
    const pendingId = request.nextUrl.searchParams.get("pendingId") || "";
    const verificationCode = request.nextUrl.searchParams.get("verificationCode") || "";

    if (!pendingId || !verificationCode) {
      return NextResponse.redirect(new URL("/signup?verification=missing", request.url));
    }

    const account = await verifyPendingBusinessSignup({
      pendingId,
      verificationCode,
    });

    await getEffectiveBusinessWorkspace({
      tenantId: account.tenantId,
      businessName: account.businessName,
      businessModelId: account.businessModelId,
    });

    const session = await createBusinessSession(account);
    const response = NextResponse.redirect(new URL("/dashboard/setup?verified=1", request.url));
    response.cookies.set(buildDashboardSessionCookie(session.sessionToken));
    return response;
  } catch (error) {
    console.error("Verify link API error:", error);
    return NextResponse.redirect(new URL("/signup?verification=failed", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingId, verificationCode } = body;

    if (!pendingId || !verificationCode) {
      return NextResponse.json(
        { error: "pendingId and verificationCode are required" },
        { status: 400 }
      );
    }

    const account = await verifyPendingBusinessSignup({
      pendingId: String(pendingId),
      verificationCode: String(verificationCode),
    });
    await getEffectiveBusinessWorkspace({
      tenantId: account.tenantId,
      businessName: account.businessName,
      businessModelId: account.businessModelId,
    });
    const session = await createBusinessSession(account);

    const response = NextResponse.json({ ok: true, tenantId: account.tenantId });
    response.cookies.set(buildDashboardSessionCookie(session.sessionToken));
    return response;
  } catch (error) {
    console.error("Verify signup API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 400 }
    );
  }
}