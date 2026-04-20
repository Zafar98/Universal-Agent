import {
  TenantConfig,
  buildTenantConfigFromBusiness,
  listBusinessModelTemplates,
  resolveBusinessModelTemplate,
  normalizeRealtimeVoice,
  resolveLeadVoiceForTenant,
  resolveDepartmentVoice,
  resolveDepartmentFromText,
  buildDepartmentRoutingInstructions,
  getCallClosingLineForTenant,
  getTaskCompletionDirectiveForTenant,
} from "@/lib/businessModels";

export type CallHangupPolicy = {
  minimumCallMs: number;
  minimumUserTurns: number;
  autoEndDelayMs: number;
};

const tenantConfigs: TenantConfig[] = [
  buildTenantConfigFromBusiness({
    tenantId: "developers-housing",
    businessName: "Developers Housing",
    businessModelId: "housing-association",
  }),
  buildTenantConfigFromBusiness({
    tenantId: "city-energy",
    businessName: "City Energy",
    businessModelId: "utilities",
  }),
  buildTenantConfigFromBusiness({
    tenantId: "rivergate-borough-council",
    businessName: "Rivergate Borough Council",
    businessModelId: "borough-council",
  }),
  buildTenantConfigFromBusiness({
    tenantId: "acme-health",
    businessName: "Acme Health Services",
    businessModelId: "healthcare",
  }),
  buildTenantConfigFromBusiness({
    tenantId: "sunset-bistro",
    businessName: "Sunset Bistro",
    businessModelId: "restaurant",
  }),
  buildTenantConfigFromBusiness({
    tenantId: "grand-harbor-hotel",
    businessName: "Grand Harbor Hotel",
    businessModelId: "hotel",
  }),
];

export function listTenantConfigs(): TenantConfig[] {
  return tenantConfigs;
}

export function listBusinessModels() {
  return listBusinessModelTemplates().filter((model) => model.id !== "concierge");
}

export function resolveTenantConfig(tenantId?: string): TenantConfig {
  const defaultTenantId = process.env.DEFAULT_TENANT_ID || "developers-housing";
  const requestedId = tenantId || defaultTenantId;
  const idToUse = requestedId === "grand-harbor-concierge" ? "grand-harbor-hotel" : requestedId;

  const match = tenantConfigs.find((tenant) => tenant.id === idToUse);
  if (match) {
    return match;
  }

  return tenantConfigs[0];
}

export function getCallHangupPolicyForTenant(tenant: TenantConfig | null): CallHangupPolicy {
  if (!tenant) {
    return {
      minimumCallMs: 25000,
      minimumUserTurns: 2,
      autoEndDelayMs: 1600,
    };
  }

  if (tenant.businessModelId === "healthcare") {
    return {
      minimumCallMs: 35000,
      minimumUserTurns: 3,
      autoEndDelayMs: 1800,
    };
  }

  if (tenant.businessModelId === "borough-council") {
    return {
      minimumCallMs: 32000,
      minimumUserTurns: 3,
      autoEndDelayMs: 1700,
    };
  }

  return {
    minimumCallMs: 25000,
    minimumUserTurns: 2,
    autoEndDelayMs: 1600,
  };
}

export {
  resolveBusinessModelTemplate,
  resolveDepartmentFromText,
  buildDepartmentRoutingInstructions,
  resolveLeadVoiceForTenant,
  normalizeRealtimeVoice,
  resolveDepartmentVoice,
  buildTenantConfigFromBusiness,
  getCallClosingLineForTenant,
  getTaskCompletionDirectiveForTenant
};
export type { BusinessUnit, DepartmentProfile, TenantConfig } from "@/lib/businessModels";
