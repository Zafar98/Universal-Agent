import { NextRequest, NextResponse } from "next/server";
import {
  SUPPORTED_REALTIME_VOICES,
  BusinessCallWorkflow,
  BusinessModelId,
  DepartmentProfile,
  TenantConfig,
  buildTenantConfigFromBusiness,
} from "@/lib/businessModels";
import {
  createBusinessAccountFromAdmin,
  getBusinessAccountByTenantId,
  listBusinessAccounts,
  updateBusinessAccountProfile,
} from "@/lib/businessAuthStore";
import { listBusinessModels } from "@/lib/tenantConfig";
import {
  BusinessWorkspace,
  getBusinessWorkspace,
  getEffectiveBusinessWorkspace,
  upsertBusinessWorkspace,
} from "@/lib/businessWorkspaceStore";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

function ensureAdmin(principal: Awaited<ReturnType<typeof getAuthenticatedBusinessFromRequest>>) {
  return Boolean(principal && principal.isAdmin);
}

function monthlyCostForPlan(plan: string): number {
  if (plan === "enterprise") {
    return 499;
  }
  if (plan === "growth") {
    return 149;
  }
  return 49;
}

function sanitizeDepartments(input: unknown): DepartmentProfile[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((department, index) => {
      if (!department || typeof department !== "object") {
        return null;
      }

      const value = department as Record<string, unknown>;
      return {
        id: String(value.id || `department-${index + 1}`),
        name: String(value.name || `Department ${index + 1}`),
        agentName: String(value.agentName || "Agent"),
        purpose: String(value.purpose || ""),
        queueTarget: String(value.queueTarget || value.name || `Queue ${index + 1}`),
        realtimeVoice: String(value.realtimeVoice || "ash"),
        supportedCalls: Array.isArray(value.supportedCalls)
          ? value.supportedCalls.map((item) => String(item)).filter(Boolean)
          : [],
        escalationRules: Array.isArray(value.escalationRules)
          ? value.escalationRules.map((item) => String(item)).filter(Boolean)
          : [],
      } satisfies DepartmentProfile;
    })
    .filter((department): department is DepartmentProfile => Boolean(department));
}

function sanitizeWorkflow(input: unknown): BusinessCallWorkflow[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((workflow) => {
      if (!workflow || typeof workflow !== "object") {
        return null;
      }
      const value = workflow as Record<string, unknown>;
      return {
        callType: String(value.callType || "General"),
        tasks: Array.isArray(value.tasks) ? value.tasks.map((item) => String(item)).filter(Boolean) : [],
        handoffPayloadFields: Array.isArray(value.handoffPayloadFields)
          ? value.handoffPayloadFields.map((item) => String(item)).filter(Boolean)
          : [],
      } satisfies BusinessCallWorkflow;
    })
    .filter((workflow): workflow is BusinessCallWorkflow => Boolean(workflow));
}

function normalizeWorkspacePayload(
  workspace: Partial<TenantConfig> & { openingLine?: string | null },
  fallback: BusinessWorkspace
): BusinessWorkspace {
  return {
    ...fallback,
    name: String(workspace.name || fallback.name),
    businessModelId: (workspace.businessModelId || fallback.businessModelId) as BusinessModelId,
    businessModelName: String(workspace.businessModelName || fallback.businessModelName),
    overview: String(workspace.overview || fallback.overview),
    openingLine: workspace.openingLine ? String(workspace.openingLine) : undefined,
    primaryBusinessUnit: (workspace.primaryBusinessUnit || fallback.primaryBusinessUnit) as TenantConfig["primaryBusinessUnit"],
    leadAgent: {
      ...fallback.leadAgent,
      ...(workspace.leadAgent || {}),
      name: String(workspace.leadAgent?.name || fallback.leadAgent.name),
      role: String(workspace.leadAgent?.role || fallback.leadAgent.role),
      objective: String(workspace.leadAgent?.objective || fallback.leadAgent.objective),
      voiceStyle: String(workspace.leadAgent?.voiceStyle || fallback.leadAgent.voiceStyle),
      realtimeVoice: String(workspace.leadAgent?.realtimeVoice || fallback.leadAgent.realtimeVoice),
    },
    departments:
      workspace.departments !== undefined ? sanitizeDepartments(workspace.departments) : fallback.departments,
    workflowPlaybook:
      workspace.workflowPlaybook !== undefined
        ? sanitizeWorkflow(workspace.workflowPlaybook)
        : fallback.workflowPlaybook,
    updatedAt: new Date().toISOString(),
  };
}

function serializeBusiness(account: Awaited<ReturnType<typeof listBusinessAccounts>>[number], workspace: BusinessWorkspace) {
  return {
    id: account.id,
    tenantId: account.tenantId,
    businessName: account.businessName,
    businessModelId: account.businessModelId,
    agentCount: account.agentCount,
    selectedPlan: account.selectedPlan,
    selectedIntegration: account.selectedIntegration,
    subscriptionStatus: account.subscriptionStatus,
    integrationReady: Boolean(
      (account.selectedIntegration === "website-widget" && account.integrationConfig.widgetEmbedCode) ||
        (account.selectedIntegration === "phone-number" && account.integrationConfig.inboundPhoneNumber) ||
        (account.selectedIntegration === "api-webhooks" && account.integrationConfig.webhookUrl && account.integrationConfig.webhookSecret)
    ),
    activationCompletedAt: account.activationCompletedAt,
    createdAt: account.createdAt,
    monthlyCost: monthlyCostForPlan(account.selectedPlan),
    workspace,
  };
}

export async function GET(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!ensureAdmin(principal)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await listBusinessAccounts();
  const businesses = await Promise.all(
    accounts.map(async (account) => {
      const workspace = await getEffectiveBusinessWorkspace({
        tenantId: account.tenantId,
        businessName: account.businessName,
        businessModelId: account.businessModelId,
      });
      return serializeBusiness(account, workspace);
    })
  );

  return NextResponse.json({
    ok: true,
    businesses,
    templates: listBusinessModels(),
    voices: SUPPORTED_REALTIME_VOICES,
  });
}

export async function POST(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!ensureAdmin(principal)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode || "create");

  try {
    if (mode === "duplicate") {
      const sourceTenantId = String(body.sourceTenantId || "");
      const sourceAccount = await getBusinessAccountByTenantId(sourceTenantId);
      if (!sourceAccount) {
        return NextResponse.json({ error: "Source business not found." }, { status: 404 });
      }

      const created = await createBusinessAccountFromAdmin({
        businessName: String(body.businessName || `${sourceAccount.businessName} Copy`),
        businessModelId: sourceAccount.businessModelId,
        agentCount: sourceAccount.agentCount,
        selectedPlan: sourceAccount.selectedPlan,
        selectedIntegration: sourceAccount.selectedIntegration,
        subscriptionStatus: sourceAccount.subscriptionStatus,
      });

      const sourceWorkspace = await getEffectiveBusinessWorkspace({
        tenantId: sourceAccount.tenantId,
        businessName: sourceAccount.businessName,
        businessModelId: sourceAccount.businessModelId,
      });

      const duplicatedWorkspace: BusinessWorkspace = {
        ...sourceWorkspace,
        id: created.tenantId,
        name: created.businessName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await upsertBusinessWorkspace(duplicatedWorkspace);

      return NextResponse.json({ ok: true, business: serializeBusiness(created, duplicatedWorkspace) });
    }

    const created = await createBusinessAccountFromAdmin({
      businessName: String(body.businessName || ""),
      businessModelId: String(body.businessModelId || "housing-association") as BusinessModelId,
      agentCount: Number(body.agentCount || 1),
      selectedPlan: String(body.selectedPlan || "starter"),
      selectedIntegration: String(body.selectedIntegration || "website-widget"),
      subscriptionStatus: String(body.subscriptionStatus || "pending_payment"),
      email: body.email ? String(body.email) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
    });

    const workspace = await getEffectiveBusinessWorkspace({
      tenantId: created.tenantId,
      businessName: created.businessName,
      businessModelId: created.businessModelId,
    });

    return NextResponse.json({ ok: true, business: serializeBusiness(created, workspace) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create business." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!ensureAdmin(principal)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const businessId = String(body.businessId || "");
  const current = await getBusinessAccountByTenantId(String(body.tenantId || "")) || null;
  const currentById = current && current.id === businessId ? current : null;
  const account = currentById || null;

  if (!businessId) {
    return NextResponse.json({ error: "Business id is required." }, { status: 400 });
  }

  const existing = account || (await listBusinessAccounts()).find((item) => item.id === businessId) || null;
  if (!existing) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const businessName = String(body.businessName || existing.businessName).trim();
  const businessModelId = String(body.businessModelId || existing.businessModelId) as BusinessModelId;
  const updatedAccount = await updateBusinessAccountProfile({
    businessId,
    businessName,
    businessModelId,
    agentCount: Number(body.agentCount || existing.agentCount),
    selectedPlan: String(body.selectedPlan || existing.selectedPlan),
    selectedIntegration: String(body.selectedIntegration || existing.selectedIntegration),
    subscriptionStatus: String(body.subscriptionStatus || existing.subscriptionStatus),
    activationCompletedAt:
      body.activationCompletedAt !== undefined
        ? body.activationCompletedAt
          ? String(body.activationCompletedAt)
          : null
        : existing.activationCompletedAt,
  });

  if (!updatedAccount) {
    return NextResponse.json({ error: "Unable to update business." }, { status: 500 });
  }

  const resetFromTemplate = Boolean(body.resetFromTemplate);
  const baseWorkspace = resetFromTemplate
    ? ({
        ...buildTenantConfigFromBusiness({
          tenantId: updatedAccount.tenantId,
          businessName: updatedAccount.businessName,
          businessModelId: updatedAccount.businessModelId,
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies BusinessWorkspace)
    : await getEffectiveBusinessWorkspace({
        tenantId: updatedAccount.tenantId,
        businessName: updatedAccount.businessName,
        businessModelId: updatedAccount.businessModelId,
      });

  const workspace = normalizeWorkspacePayload(
    {
      ...(body.workspace && typeof body.workspace === "object" ? body.workspace : {}),
      name: updatedAccount.businessName,
      businessModelId: updatedAccount.businessModelId,
    },
    baseWorkspace
  );
  workspace.id = updatedAccount.tenantId;
  workspace.createdAt = baseWorkspace.createdAt;

  const savedWorkspace = await upsertBusinessWorkspace(workspace);
  return NextResponse.json({ ok: true, business: serializeBusiness(updatedAccount, savedWorkspace) });
}
