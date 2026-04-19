import { callLogStore } from "@/lib/callLogStore";
import { listCallLogs } from "@/lib/callLogRepository";
import { DepartmentProfile, resolveDepartmentFromText } from "@/lib/tenantConfig";
import { BusinessWorkspace } from "@/lib/businessWorkspaceStore";
import { hasDatabaseConfig } from "@/lib/postgres";

export type RoutingSource = "front-door" | "intent" | "history" | "hint";

export interface IncomingCallIntake {
  callerName?: string;
  callerPhone?: string;
  callReason?: string;
  dialedDepartmentHint?: string;
}

export interface IncomingCallRoutingDecision {
  selectedDepartment: DepartmentProfile | null;
  suggestedDepartment: DepartmentProfile | null;
  routingSource: RoutingSource;
  confidence: number;
  rationale: string;
  shouldConnectDirectly: boolean;
}

async function listTenantCallLogs(tenantId: string) {
  if (hasDatabaseConfig()) {
    return (await listCallLogs()).filter((log) => log.tenantId === tenantId);
  }

  return callLogStore.list().filter((log) => log.tenantId === tenantId);
}

function matchDepartmentFromHint(
  workspace: BusinessWorkspace,
  hint?: string
): DepartmentProfile | null {
  const value = String(hint || "").trim().toLowerCase();
  if (!value) {
    return null;
  }

  return (
    workspace.departments.find((department) => {
      const haystack = [department.name, department.queueTarget, ...department.supportedCalls]
        .join(" ")
        .toLowerCase();
      return haystack.includes(value) || value.includes(department.name.toLowerCase());
    }) || null
  );
}

function matchDepartmentFromHistory(
  workspace: BusinessWorkspace,
  callerPhone?: string,
  logs?: Awaited<ReturnType<typeof listTenantCallLogs>>
): DepartmentProfile | null {
  const normalizedPhone = String(callerPhone || "").replace(/[^0-9+]/g, "");
  if (!normalizedPhone || !logs) {
    return null;
  }

  const previousLog = logs.find(
    (log) => String(log.callerPhone || "").replace(/[^0-9+]/g, "") === normalizedPhone
  );

  if (!previousLog) {
    return null;
  }

  return workspace.departments.find((department) => department.id === previousLog.departmentId) || null;
}

export async function routeIncomingCall(input: {
  workspace: BusinessWorkspace;
  intake: IncomingCallIntake;
}): Promise<IncomingCallRoutingDecision> {
  const hintedDepartment = matchDepartmentFromHint(input.workspace, input.intake.dialedDepartmentHint);
  if (hintedDepartment) {
    return {
      selectedDepartment: hintedDepartment,
      suggestedDepartment: hintedDepartment,
      routingSource: "hint",
      confidence: 0.97,
      rationale: `The caller selected or dialed directly into ${hintedDepartment.name}.`,
      shouldConnectDirectly: true,
    };
  }

  const tenantLogs = await listTenantCallLogs(input.workspace.id);
  const historicalDepartment = matchDepartmentFromHistory(
    input.workspace,
    input.intake.callerPhone,
    tenantLogs
  );
  if (historicalDepartment) {
    return {
      selectedDepartment: historicalDepartment,
      suggestedDepartment: historicalDepartment,
      routingSource: "history",
      confidence: 0.88,
      rationale: `This caller has previously been handled by ${historicalDepartment.name}.`,
      shouldConnectDirectly: true,
    };
  }

  const reasonDepartment = resolveDepartmentFromText(
    input.workspace,
    `${input.intake.callReason || ""} ${input.intake.dialedDepartmentHint || ""}`
  );
  if (reasonDepartment) {
    return {
      selectedDepartment: reasonDepartment,
      suggestedDepartment: reasonDepartment,
      routingSource: "intent",
      confidence: 0.76,
      rationale: `The caller's reason sounds like a ${reasonDepartment.name} enquiry.`,
      shouldConnectDirectly: true,
    };
  }

  return {
    selectedDepartment: null,
    suggestedDepartment: input.workspace.departments[0] || null,
    routingSource: "front-door",
    confidence: 0.32,
    rationale: "There was not enough caller context before answer, so the front-door agent should classify the call live.",
    shouldConnectDirectly: false,
  };
}