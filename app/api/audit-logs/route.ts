import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { listAutonomyAuditEvents } from "@/lib/autonomyAuditStore";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantIdParam = request.nextUrl.searchParams.get("tenantId") || "";
  const tenantId = session.isAdmin ? tenantIdParam : session.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const logId = request.nextUrl.searchParams.get("logId") || "";
  const ticketId = request.nextUrl.searchParams.get("ticketId") || "";
  const operationId = request.nextUrl.searchParams.get("operationId") || "";
  const limitRaw = Number.parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

  try {
    const events = await listAutonomyAuditEvents({
      tenantId,
      logId: logId || undefined,
      ticketId: ticketId || undefined,
      operationId: operationId || undefined,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Audit log GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
