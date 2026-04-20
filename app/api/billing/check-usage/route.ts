import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getCurrentMonthUsage } from "@/lib/usageTrackingStore";
import { checkUsageLimit, calculateOverageCharge, type UsageMetric } from "@/lib/billingConfig";

interface CheckUsageRequest {
  metric: UsageMetric;
  amount: number; // quantity to check
}

/**
 * POST /api/billing/check-usage
 * Check if usage would exceed limits and calculate any overage charges
 */
export async function POST(request: NextRequest) {
  try {
    const principal = await getAuthenticatedBusinessFromRequest(request);
    if (!principal || principal.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getBusinessAccountByTenantId(principal.tenantId);
    if (!account) {
      return NextResponse.json({ error: "Business account not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as CheckUsageRequest;
    const { metric, amount } = body;

    if (!metric || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid metric or amount" }, { status: 400 });
    }

    const usage = await getCurrentMonthUsage(account.id, account.tenantId);
    const currentUsageRaw = usage ? usage[metric as keyof typeof usage] || 0 : 0;
    const currentUsage = typeof currentUsageRaw === "number" ? currentUsageRaw : Number(currentUsageRaw) || 0;

    const usageCheck = checkUsageLimit(account.selectedPlan, metric, currentUsage, amount);

    let overageCharge = 0;
    if (!usageCheck.withinLimit) {
      overageCharge = calculateOverageCharge(account.selectedPlan, metric, usageCheck.overageAmount);
    }

    return NextResponse.json({
      ok: true,
      metric,
      amount,
      currentUsage,
      newTotal: usageCheck.newTotal,
      limit: usageCheck.limit,
      withinLimit: usageCheck.withinLimit,
      overageAmount: usageCheck.overageAmount,
      overageCharge: Math.round(overageCharge * 100) / 100,
      plan: account.selectedPlan,
      message: usageCheck.withinLimit
        ? `Usage allowed. New total: ${usageCheck.newTotal}/${usageCheck.limit}`
        : `Overage detected. Will incur charge: £${overageCharge.toFixed(2)}`,
    });
  } catch (error) {
    console.error("Failed to check usage:", error);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
