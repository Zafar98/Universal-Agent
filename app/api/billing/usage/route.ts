import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getCurrentMonthUsage, recordUsageEvent } from "@/lib/usageTrackingStore";
import { getPricingTier, checkUsageLimit, calculateOverageCharge, type UsageMetric } from "@/lib/billingConfig";

/**
 * GET /api/billing/usage
 * Get current month usage for authenticated business
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

    const usage = await getCurrentMonthUsage(account.id, account.tenantId);
    const tier = getPricingTier(account.selectedPlan);

    return NextResponse.json({
      ok: true,
      usage: {
        voiceCalls: usage?.voiceCalls || 0,
        voiceMinutes: usage?.voiceMinutes || 0,
        emailsSent: usage?.emailsSent || 0,
        smsSent: usage?.smsSent || 0,
      },
      limits: tier.limits,
      overages: {
        voiceCallOverages: usage?.voiceCallOverages || 0,
        voiceMinuteOverages: usage?.voiceMinuteOverages || 0,
        emailOverages: usage?.emailOverages || 0,
        smsOverages: usage?.smsOverages || 0,
      },
      overageCharges: usage?.overageCharges || 0,
      plan: account.selectedPlan,
      month: usage?.month || new Date().toISOString().slice(0, 7),
    });
  } catch (error) {
    console.error("Failed to get usage:", error);
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}
