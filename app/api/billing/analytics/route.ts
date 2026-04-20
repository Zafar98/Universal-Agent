import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getMonthUsage, getMonthBillingEvents } from "@/lib/usageTrackingStore";
import { getPricingTier, estimateMonthlyCharges, type UsageMetric } from "@/lib/billingConfig";

interface BillingAnalytics {
  plan: string;
  month: string;
  baseCost: number;
  currentUsage: Record<UsageMetric, number>;
  limits: Record<UsageMetric, number>;
  overageCharges: number;
  estimatedTotal: number;
  utilizationPercentage: Record<UsageMetric, number>;
  isOverLimit: boolean;
  projectedMonthlyCharge: number;
}

/**
 * GET /api/billing/analytics
 * Get comprehensive billing analytics for a business
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

    const month = request.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const usage = await getMonthUsage(account.id, month);
    const tier = getPricingTier(account.selectedPlan);

    if (!usage) {
      return NextResponse.json({
        ok: true,
        analytics: {
          plan: account.selectedPlan,
          month,
          baseCost: tier.monthlyPrice,
          currentUsage: {
            voice_calls: 0,
            voice_minutes: 0,
            emails: 0,
            sms_messages: 0,
          },
          limits: tier.limits,
          overageCharges: 0,
          estimatedTotal: tier.monthlyPrice,
          utilizationPercentage: {
            voice_calls: 0,
            voice_minutes: 0,
            emails: 0,
            sms_messages: 0,
          },
          isOverLimit: false,
          projectedMonthlyCharge: tier.monthlyPrice,
        },
      });
    }

    const currentUsage = {
      voice_calls: usage.voiceCalls,
      voice_minutes: usage.voiceMinutes,
      emails: usage.emailsSent,
      sms_messages: usage.smsSent,
    };

    const utilizationPercentage: Record<UsageMetric, number> = {
      voice_calls: tier.limits.voice_calls > 0 ? (usage.voiceCalls / tier.limits.voice_calls) * 100 : 0,
      voice_minutes: tier.limits.voice_minutes > 0 ? (usage.voiceMinutes / tier.limits.voice_minutes) * 100 : 0,
      emails: tier.limits.emails > 0 ? (usage.emailsSent / tier.limits.emails) * 100 : 0,
      sms_messages: tier.limits.sms_messages > 0 ? (usage.smsSent / tier.limits.sms_messages) * 100 : 0,
    };

    const isOverLimit = Object.values(utilizationPercentage).some((v) => v > 100);

    const analytics: BillingAnalytics = {
      plan: account.selectedPlan,
      month,
      baseCost: tier.monthlyPrice,
      currentUsage,
      limits: tier.limits,
      overageCharges: usage.overageCharges,
      estimatedTotal: tier.monthlyPrice + usage.overageCharges,
      utilizationPercentage,
      isOverLimit,
      projectedMonthlyCharge: tier.monthlyPrice + usage.overageCharges,
    };

    return NextResponse.json({ ok: true, analytics });
  } catch (error) {
    console.error("Failed to get billing analytics:", error);
    return NextResponse.json({ error: "Failed to get billing analytics" }, { status: 500 });
  }
}
