import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { createAgent, getBusinessAgentCount } from "@/lib/agentManagementStore";
import { getPricingTier } from "@/lib/billingConfig";

interface AddAgentRequest {
  departmentName: string;
  agentName: string;
  description?: string;
}

/**
 * POST /api/agents/add
 * Add a new agent/department to the business
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

    const body = (await request.json().catch(() => ({}))) as AddAgentRequest;
    const { departmentName, agentName, description } = body;

    if (!departmentName || !agentName) {
      return NextResponse.json({ error: "Department and agent name required" }, { status: 400 });
    }

    const tier = getPricingTier(account.selectedPlan);
    const currentCount = await getBusinessAgentCount(account.id, true);
    const includedLimit = tier.agentLimit;

    // Determine if this is a premium agent
    const isPremium = currentCount >= includedLimit;
    const monthlyAgentCost = isPremium ? Math.round(tier.additionalAgentPrice * 100) : 0; // in pence

    // Check if they're over absolute limit
    if (currentCount >= 999) {
      return NextResponse.json(
        { error: "Maximum agents reached. Please contact support." },
        { status: 400 }
      );
    }

    // Create the agent
    const agent = await createAgent(
      account.id,
      account.tenantId,
      departmentName,
      agentName,
      description,
      isPremium,
      monthlyAgentCost
    );

    if (!agent) {
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    const newCount = currentCount + 1;

    return NextResponse.json({
      ok: true,
      agent,
      billing: {
        isPremium,
        monthlyAgentCost: isPremium ? tier.additionalAgentPrice : 0,
        message: isPremium
          ? `This agent will be charged at £${tier.additionalAgentPrice}/month (overage)`
          : `This agent is included in your ${tier.label} plan`,
      },
      stats: {
        totalAgents: newCount,
        includedAgents: includedLimit,
        premiumAgents: isPremium ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Failed to add agent:", error);
    return NextResponse.json({ error: "Failed to add agent" }, { status: 500 });
  }
}
