/**
 * Billing Configuration
 * Defines all pricing tiers, usage limits, and overage pricing
 */

export type PlanTier = "starter" | "growth" | "enterprise" | "monthly_1999";
export type UsageMetric = "voice_calls" | "voice_minutes" | "emails" | "sms_messages";

export interface UsageLimits {
  voice_calls: number; // max calls per month
  voice_minutes: number; // max minutes per month
  emails: number; // max emails per month
  sms_messages: number; // max SMS per month
}

export interface OveragePricing {
  voice_call: number; // price per call beyond limit
  voice_minute: number; // price per minute beyond limit
  email: number; // price per email beyond limit
  sms_message: number; // price per SMS beyond limit
}

export interface PricingTier {
  name: PlanTier;
  label: string;
  monthlyPrice: number; // in pounds
  yearlyPrice?: number;
  currency: string;
  billingInterval: "monthly" | "yearly";
  limits: UsageLimits;
  overagePricing: OveragePricing;
  features: string[];
  restrictions: string[];
  integrationMethods: string[];
  maxBusinessLines?: number;
  supportLevel: "email" | "priority" | "dedicated";
  agentLimit: number; // number of agents/departments included
  additionalAgentPrice: number; // price per additional agent in pounds
  capabilities: {
    emailAutomation: boolean;
    voiceCalls: boolean;
    sms: boolean;
    apiWebhooks: boolean;
    websiteWidget: boolean;
    phoneNumber: boolean;
    multiSite: boolean;
  };
}

export const PRICING_TIERS: Record<PlanTier, PricingTier> = {
  starter: {
    name: "starter",
    label: "Starter",
    monthlyPrice: 399,
    currency: "GBP",
    billingInterval: "monthly",
    limits: {
      voice_calls: 0, // No voice calls
      voice_minutes: 0,
      emails: 500, // 500 emails per month
      sms_messages: 0, // No SMS
    },
    overagePricing: {
      voice_call: 0, // Not available
      voice_minute: 0,
      email: 0.50, // £0.50 per email over limit
      sms_message: 0,
    },
    features: [
      "✓ Email-only AI automation",
      "✓ Shared inbox monitoring and triage",
      "✓ Auto-drafted and sent responses",
      "✓ Issue resolution from email threads",
      "✓ 500 emails per month included",
      "✓ 2 AI agents/departments",
      "✓ Email support",
      "✓ Basic setup guidance",
    ],
    restrictions: [
      "✗ No voice calls or voice routing",
      "✗ No SMS sending",
      "✗ No custom API/webhook integration",
      "✗ No phone number provisioning",
      "✗ No multi-site deployment",
    ],
    integrationMethods: ["email-automation"],
    supportLevel: "email",
    agentLimit: 2,
    additionalAgentPrice: 99,
    capabilities: {
      emailAutomation: true,
      voiceCalls: false,
      sms: false,
      apiWebhooks: false,
      websiteWidget: false,
      phoneNumber: false,
      multiSite: false,
    },
  },

  growth: {
    name: "growth",
    label: "Growth",
    monthlyPrice: 599,
    currency: "GBP",
    billingInterval: "monthly",
    limits: {
      voice_calls: 300, // 300 calls per month
      voice_minutes: 1000, // 1000 minutes (16.67 hours) per month
      emails: 2000, // 2000 emails per month
      sms_messages: 0, // No SMS on Growth
    },
    overagePricing: {
      voice_call: 1.50, // £1.50 per call over limit
      voice_minute: 0.10, // £0.10 per minute over limit
      email: 0.25, // £0.25 per email over limit
      sms_message: 0,
    },
    features: [
      "✓ Everything in Starter",
      "✓ Live voice calls (300 calls/month)",
      "✓ 1,000 voice minutes per month",
      "✓ 2,000 emails per month",
      "✓ Up to 5 AI agents/departments",
      "✓ Advanced department routing",
      "✓ Website widget embedding",
      "✓ Phone number provisioning",
      "✓ Integration setup support",
      "✓ Priority response support",
    ],
    restrictions: [
      "✗ No SMS sending",
      "✗ No custom API/webhook integration",
      "✗ No multi-site deployment",
    ],
    integrationMethods: ["email-automation", "website-widget", "phone-number"],
    maxBusinessLines: 3,
    supportLevel: "priority",
    agentLimit: 5,
    additionalAgentPrice: 79,
    capabilities: {
      emailAutomation: true,
      voiceCalls: true,
      sms: false,
      apiWebhooks: false,
      websiteWidget: true,
      phoneNumber: true,
      multiSite: false,
    },
  },

  enterprise: {
    name: "enterprise",
    label: "Enterprise",
    monthlyPrice: 999,
    currency: "GBP",
    billingInterval: "monthly",
    limits: {
      voice_calls: 1000, // 1000 calls per month
      voice_minutes: 5000, // 5000 minutes (83.33 hours) per month
      emails: 10000, // 10,000 emails per month
      sms_messages: 2000, // 2000 SMS per month
    },
    overagePricing: {
      voice_call: 0.75, // £0.75 per call over limit (discounted)
      voice_minute: 0.05, // £0.05 per minute over limit (discounted)
      email: 0.10, // £0.10 per email over limit (discounted)
      sms_message: 0.08, // £0.08 per SMS over limit (discounted)
    },
    features: [
      "✓ Everything in Growth",
      "✓ Live voice calls (1,000 calls/month)",
      "✓ 5,000 voice minutes per month",
      "✓ 10,000 emails per month",
      "✓ 2,000 SMS per month",
      "✓ Unlimited AI agents/departments",
      "✓ Multi-site deployment",
      "✓ API and webhook orchestration",
      "✓ Custom integrations",
      "✓ Dedicated implementation support",
      "✓ Highest priority support",
      "✓ SLA guarantees",
      "✓ Dedicated account manager",
      "✓ Custom business rules and routing",
    ],
    restrictions: [],
    integrationMethods: ["email-automation", "website-widget", "phone-number", "api-webhooks"],
    supportLevel: "dedicated",
    agentLimit: 50,
    additionalAgentPrice: 49,
    capabilities: {
      emailAutomation: true,
      voiceCalls: true,
      sms: true,
      apiWebhooks: true,
      websiteWidget: true,
      phoneNumber: true,
      multiSite: true,
    },
  },

  monthly_1999: {
    name: "monthly_1999",
    label: "Legacy",
    monthlyPrice: 1999,
    currency: "GBP",
    billingInterval: "monthly",
    limits: {
      voice_calls: 5000,
      voice_minutes: 10000,
      emails: 50000,
      sms_messages: 5000,
    },
    overagePricing: {
      voice_call: 0.50,
      voice_minute: 0.03,
      email: 0.05,
      sms_message: 0.05,
    },
    features: [
      "✓ Everything in Enterprise",
      "✓ Unlimited dedicated support",
      "✓ Custom pricing available",
      "✓ Unlimited agents/departments",
    ],
    restrictions: [],
    integrationMethods: ["email-automation", "website-widget", "phone-number", "api-webhooks"],
    supportLevel: "dedicated",
    agentLimit: 999,
    additionalAgentPrice: 0,
    capabilities: {
      emailAutomation: true,
      voiceCalls: true,
      sms: true,
      apiWebhooks: true,
      websiteWidget: true,
      phoneNumber: true,
      multiSite: true,
    },
  },
};

/**
 * Get pricing tier by plan name
 */
export function getPricingTier(planName: PlanTier | string): PricingTier {
  const normalized = String(planName || "").toLowerCase() as PlanTier;
  const tier = PRICING_TIERS[normalized];
  if (!tier) {
    return PRICING_TIERS.starter;
  }
  return tier;
}

/**
 * Check if usage would exceed limits
 */
export function checkUsageLimit(
  planTier: PlanTier,
  metric: UsageMetric,
  currentUsage: number,
  incrementBy: number
): {
  withinLimit: boolean;
  newTotal: number;
  limit: number;
  overageAmount: number;
} {
  const tier = getPricingTier(planTier);
  const limit = tier.limits[metric];
  const newTotal = currentUsage + incrementBy;

  return {
    withinLimit: newTotal <= limit,
    newTotal,
    limit,
    overageAmount: Math.max(0, newTotal - limit),
  };
}

/**
 * Calculate overage charges for a metric
 */
export function calculateOverageCharge(
  planTier: PlanTier,
  metric: UsageMetric,
  overageAmount: number
): number {
  const tier = getPricingTier(planTier);
  const priceKey = metric.replace("_messages", "_message").replace("_calls", "_call");
  const pricePerUnit = tier.overagePricing[priceKey as keyof OveragePricing];

  return overageAmount * (pricePerUnit || 0);
}

/**
 * Get estimated charges for a plan tier
 */
export function estimateMonthlyCharges(planTier: PlanTier, usage: Partial<Record<UsageMetric, number>>) {
  const tier = getPricingTier(planTier);
  let overageCharges = 0;

  for (const [metric, amount] of Object.entries(usage)) {
    if (typeof amount === "number" && amount > 0) {
      const limit = tier.limits[metric as UsageMetric];
      if (amount > limit) {
        const overage = amount - limit;
        overageCharges += calculateOverageCharge(planTier, metric as UsageMetric, overage);
      }
    }
  }

  return {
    baseCost: tier.monthlyPrice,
    overageCharges: Math.round(overageCharges * 100) / 100,
    totalCost: Math.round((tier.monthlyPrice + overageCharges) * 100) / 100,
  };
}
