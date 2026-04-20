import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getBusinessAgents, getBusinessAgentCount, getPremiumAgentCount } from "@/lib/agentManagementStore";
import { getPricingTier } from "@/lib/billingConfig";

/**
 * GET /api/agents
 * Get all agents for authenticated business
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

    const agents = await getBusinessAgents(account.id, true);
    const totalCount = await getBusinessAgentCount(account.id, true);
    const premiumCount = await getPremiumAgentCount(account.id);
    const tier = getPricingTier(account.selectedPlan);

    const includedAgents = tier.agentLimit;
    const canAddMore = totalCount < 999; // max reasonable limit

    return NextResponse.json({
      ok: true,
      agents,
      stats: {
        plan: account.selectedPlan,
        totalAgents: totalCount,
        includedAgents,
        premiumAgents: premiumCount,
        canAddMore,
        nextAgentPrice: tier.additionalAgentPrice,
        maxAllowable: 999,
      },
    });
  } catch (error) {
    console.error("Failed to get agents:", error);
    return NextResponse.json({ error: "Failed to get agents" }, { status: 500 });
  }
}
