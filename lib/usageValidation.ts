/**
 * Usage Validation Middleware
 * Enforces usage limits and prevents operations that would exceed plan limits
 */

import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getCurrentMonthUsage } from "@/lib/usageTrackingStore";
import { getPricingTier, checkUsageLimit, type UsageMetric } from "@/lib/billingConfig";

export interface UsageValidationResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  wouldExceed: boolean;
  overageCharge?: number;
}

/**
 * Validate if an action would exceed usage limits
 */
export async function validateUsage(
  tenantId: string,
  metric: UsageMetric,
  amount: number = 1
): Promise<UsageValidationResult> {
  try {
    const account = await getBusinessAccountByTenantId(tenantId);
    if (!account) {
      return {
        allowed: false,
        reason: "Account not found",
        currentUsage: 0,
        limit: 0,
        wouldExceed: true,
      };
    }

    // Check subscription status
    if (account.subscriptionStatus === "canceled" || account.subscriptionStatus === "pending_payment") {
      return {
        allowed: false,
        reason: "Subscription is not active",
        currentUsage: 0,
        limit: 0,
        wouldExceed: true,
      };
    }

    // Get current usage
    const usage = await getCurrentMonthUsage(account.id, account.tenantId);
    const currentUsageRaw = usage ? usage[metric as keyof typeof usage] || 0 : 0;
    const currentUsage = typeof currentUsageRaw === "number" ? currentUsageRaw : Number(currentUsageRaw) || 0;

    // Check limits
    const tier = getPricingTier(account.selectedPlan);
    const usageCheck = checkUsageLimit(account.selectedPlan, metric, currentUsage, amount);

    // For starter plan, no voice calls or SMS allowed
    if (account.selectedPlan === "starter") {
      if (metric === "voice_calls" || metric === "voice_minutes") {
        return {
          allowed: false,
          reason: "Starter plan does not include voice calls. Upgrade to Growth or Enterprise.",
          currentUsage,
          limit: tier.limits[metric],
          wouldExceed: true,
        };
      }
      if (metric === "sms_messages") {
        return {
          allowed: false,
          reason: "Starter plan does not include SMS. Upgrade to Growth or Enterprise.",
          currentUsage,
          limit: tier.limits[metric],
          wouldExceed: true,
        };
      }
    }

    // Check if within limit
    if (usageCheck.withinLimit) {
      return {
        allowed: true,
        currentUsage,
        limit: usageCheck.limit,
        wouldExceed: false,
      };
    }

    // Calculate overage charge if allowed to proceed
    const overageCharge =
      usageCheck.overageAmount > 0
        ? require("@/lib/billingConfig").calculateOverageCharge(
            account.selectedPlan,
            metric,
            usageCheck.overageAmount
          )
        : 0;

    return {
      allowed: true, // Allow with overage
      reason: `Overage detected. Will be charged £${overageCharge.toFixed(2)}`,
      currentUsage,
      limit: usageCheck.limit,
      wouldExceed: true,
      overageCharge,
    };
  } catch (error) {
    console.error("Usage validation error:", error);
    return {
      allowed: false,
      reason: "Unable to validate usage",
      currentUsage: 0,
      limit: 0,
      wouldExceed: true,
    };
  }
}

/**
 * Validate voice call
 */
export async function validateVoiceCall(tenantId: string): Promise<UsageValidationResult> {
  return validateUsage(tenantId, "voice_calls", 1);
}

/**
 * Validate voice minutes
 */
export async function validateVoiceMinutes(tenantId: string, minutes: number): Promise<UsageValidationResult> {
  return validateUsage(tenantId, "voice_minutes", minutes);
}

/**
 * Validate email sending
 */
export async function validateEmailSend(tenantId: string): Promise<UsageValidationResult> {
  return validateUsage(tenantId, "emails", 1);
}

/**
 * Validate SMS sending
 */
export async function validateSmsSend(tenantId: string): Promise<UsageValidationResult> {
  return validateUsage(tenantId, "sms_messages", 1);
}
