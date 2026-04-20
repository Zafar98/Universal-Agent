import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getMonthBillingEvents, getMonthUsage } from "@/lib/usageTrackingStore";

interface BillingHistoryQuery {
  month?: string; // YYYY-MM format
}

/**
 * GET /api/billing/history
 * Get billing history and events for a specific month
 */
export async function GET(request: NextRequest) {
  try {
    const principal = await getAuthenticatedBusinessFromRequest(request);
    if (!principal || principal.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getBusinessAccountByTenantId(principal.tenantId);
    if (!account) {
      return NextResponse.json({ error: "Business account not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
    }

    const usage = await getMonthUsage(account.id, month);
    const events = await getMonthBillingEvents(account.id, month);

    return NextResponse.json({
      ok: true,
      month,
      usage: usage || {
        voiceCalls: 0,
        voiceMinutes: 0,
        emailsSent: 0,
        smsSent: 0,
        voiceCallOverages: 0,
        voiceMinuteOverages: 0,
        emailOverages: 0,
        smsOverages: 0,
        overageCharges: 0,
      },
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        metric: e.metric,
        amount: e.amount,
        overageCharge: e.overageCharge || 0,
        timestamp: e.timestamp,
      })),
      eventCount: events.length,
    });
  } catch (error) {
    console.error("Failed to get billing history:", error);
    return NextResponse.json({ error: "Failed to get billing history" }, { status: 500 });
  }
}
