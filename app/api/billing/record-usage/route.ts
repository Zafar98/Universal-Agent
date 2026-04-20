import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { recordUsageEvent, getCurrentMonthUsage } from "@/lib/usageTrackingStore";
import { checkUsageLimit, calculateOverageCharge, type UsageMetric } from "@/lib/billingConfig";

interface RecordUsageRequest {
  metric: UsageMetric;
  amount: number;
  eventType: "call_start" | "call_end" | "email_sent" | "sms_sent";
  metadata?: Record<string, any>;
}

/**
 * POST /api/billing/record-usage
 * Record a usage event and calculate any overage charges
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

    const body = (await request.json().catch(() => ({}))) as RecordUsageRequest;
    const { metric, amount, eventType, metadata } = body;

    if (!metric || !amount || amount <= 0 || !eventType) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // Get current usage
    const usage = await getCurrentMonthUsage(account.id, account.tenantId);
    const currentUsageRaw = usage ? usage[metric as keyof typeof usage] || 0 : 0;
    const currentUsage = typeof currentUsageRaw === "number" ? currentUsageRaw : Number(currentUsageRaw) || 0;

    // Check if this would exceed limits
    const usageCheck = checkUsageLimit(account.selectedPlan, metric, currentUsage, amount);

    let overageCharge = 0;
    if (!usageCheck.withinLimit && usageCheck.overageAmount > 0) {
      overageCharge = calculateOverageCharge(account.selectedPlan, metric, usageCheck.overageAmount);
    }

    // Record the event
    const event = await recordUsageEvent(
      account.id,
      account.tenantId,
      metric,
      amount,
      eventType,
      overageCharge,
      metadata
    );

    if (!event) {
      return NextResponse.json({ error: "Failed to record usage event" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      event: {
        id: event.id,
        metric,
        amount,
        eventType,
      },
      usage: {
        previousUsage: currentUsage,
        newUsage: usageCheck.newTotal,
        limit: usageCheck.limit,
        withinLimit: usageCheck.withinLimit,
      },
      overage: {
        amount: usageCheck.overageAmount,
        charge: Math.round(overageCharge * 100) / 100,
      },
      timestamp: event.timestamp,
    });
  } catch (error) {
    console.error("Failed to record usage:", error);
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 });
  }
}
