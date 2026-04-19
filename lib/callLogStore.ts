import { BusinessUnit, resolveDepartmentFromText } from "@/lib/tenantConfig";
import { resolveTenantConfig, TenantConfig } from "@/lib/tenantConfig";
import { RoutingSource } from "@/lib/callRouting";

export type WorkflowStatus =
  | "new"
  | "sent_to_contractor"
  | "awaiting_contractor"
  | "contractor_on_the_way"
  | "reservation_confirmed"
  | "order_dispatched"
  | "guest_service_assigned"
  | "event_quote_sent"
  | "resolved";

export type CallTranscriptEntry = {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: string;
};

export type CallLog = {
  id: string;
  tenantId: string;
  tenantName: string;
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  issueType: "repair" | "complaint" | "billing" | "reservation" | "order" | "general";
  urgency: "low" | "medium" | "high";
  businessUnit: BusinessUnit;
  departmentId: string;
  departmentName: string;
  callerName: string;
  callerPhone: string;
  routingSource: RoutingSource;
  routingConfidence: number;
  detectedEmotion: "neutral" | "frustrated" | "anxious" | "distressed";
  handoffRecommended: boolean;
  summary: string;
  ticketId: string;
  ticketStatus: "open" | "pending" | "solved" | "unknown";
  workflowStatus: WorkflowStatus;
  workflowCallType: string;
  handoffPayload: Record<string, string>;
  contractorName: string;
  contractorEta: string;
  status: "open" | "in_progress" | "closed";
  transcript: CallTranscriptEntry[];
  caseData: Record<string, string | string[] | undefined> | null;
  isDemoCall: boolean;
};

function resolveWorkflowStatus(
  tenant: TenantConfig,
  issueType: CallLog["issueType"],
  departmentName: string
): WorkflowStatus {
  if (tenant.businessModelId === "housing-association") {
    return issueType === "repair" ? "awaiting_contractor" : "new";
  }

  if (tenant.businessModelId === "restaurant") {
    if (issueType === "reservation") return "reservation_confirmed";
    if (issueType === "order") return "order_dispatched";
    return "new";
  }

  if (tenant.businessModelId === "hotel") {
    if (departmentName.toLowerCase().includes("reservation")) return "reservation_confirmed";
    if (departmentName.toLowerCase().includes("guest services")) return "guest_service_assigned";
    if (departmentName.toLowerCase().includes("events")) return "event_quote_sent";
    return "new";
  }

  if (tenant.businessModelId === "concierge") {
    return "guest_service_assigned";
  }

  return "new";
}

function resolveWorkflowFromPlaybook(
  tenant: TenantConfig,
  issueType: CallLog["issueType"],
  departmentName: string
): { callType: string; payload: Record<string, string> } {
  const defaultWorkflow = tenant.workflowPlaybook[0];

  const keywordMap: Record<CallLog["issueType"], string[]> = {
    repair: ["repair", "outage", "in-stay"],
    complaint: ["complaint", "recovery", "concern"],
    billing: ["billing", "insurance"],
    reservation: ["reservation", "booking", "room"],
    order: ["order", "delivery", "collection"],
    general: [departmentName.toLowerCase()],
  };

  const workflow =
    tenant.workflowPlaybook.find((item) => {
      const lower = item.callType.toLowerCase();
      const tokens = keywordMap[issueType] || [];
      return tokens.some((token) => token && lower.includes(token));
    }) || defaultWorkflow;

  const payload = Object.fromEntries((workflow?.handoffPayloadFields || []).map((field) => [field, ""]));
  return {
    callType: workflow?.callType || "General support",
    payload,
  };
}

function detectIssueType(text: string): CallLog["issueType"] {
  const value = text.toLowerCase();

  if (
    value.includes("leak") ||
    value.includes("heating") ||
    value.includes("boiler") ||
    value.includes("broken") ||
    value.includes("repair")
  ) {
    return "repair";
  }

  if (
    value.includes("bill") ||
    value.includes("payment") ||
    value.includes("charge") ||
    value.includes("invoice")
  ) {
    return "billing";
  }

  if (
    value.includes("book a table") ||
    value.includes("reservation") ||
    value.includes("reserve") ||
    value.includes("party of")
  ) {
    return "reservation";
  }

  if (
    value.includes("delivery") ||
    value.includes("collection") ||
    value.includes("pickup") ||
    value.includes("order food")
  ) {
    return "order";
  }

  if (
    value.includes("complaint") ||
    value.includes("poor service") ||
    value.includes("unhappy")
  ) {
    return "complaint";
  }

  return "general";
}

function detectUrgency(text: string): CallLog["urgency"] {
  const value = text.toLowerCase();

  if (
    value.includes("emergency") ||
    value.includes("flood") ||
    value.includes("no heating") ||
    value.includes("asap") ||
    value.includes("urgent")
  ) {
    return "high";
  }

  if (
    value.includes("soon") || value.includes("today") || value.includes("tomorrow")
  ) {
    return "medium";
  }

  return "low";
}

function mapBusinessUnit(issueType: CallLog["issueType"], urgency: CallLog["urgency"], departmentName: string): CallLog["businessUnit"] {
  if (urgency === "high") return "Escalations";
  if (departmentName === "Reservations") return "Reservations";
  if (departmentName === "Orders") return "Orders";
  if (departmentName === "Front of House") return "Front of House";
  if (issueType === "repair") return "Repairs";
  if (issueType === "billing") return "Billing";
  if (issueType === "complaint") return "Customer Care";
  return "General Support";
}

function detectEmotion(text: string): CallLog["detectedEmotion"] {
  const value = text.toLowerCase();

  if (
    value.includes("panic") ||
    value.includes("distressed") ||
    value.includes("can't cope")
  ) {
    return "distressed";
  }

  if (
    value.includes("worried") ||
    value.includes("anxious") ||
    value.includes("concerned")
  ) {
    return "anxious";
  }

  if (
    value.includes("angry") ||
    value.includes("frustrated") ||
    value.includes("upset") ||
    value.includes("fed up")
  ) {
    return "frustrated";
  }

  return "neutral";
}

function buildSummary(transcript: CallTranscriptEntry[]): string {
  const userLines = transcript
    .filter((line) => line.speaker === "user" && line.text.trim().length > 0)
    .map((line) => line.text.trim());

  if (userLines.length === 0) {
    return "Caller connected but provided no clear issue details.";
  }

  return userLines.slice(0, 2).join(" ").slice(0, 240);
}

class CallLogStore {
  private logs: Map<string, CallLog> = new Map();
  private counter = 0;

  create(input: {
    tenantId: string;
    tenantName: string;
    tenantConfig?: TenantConfig;
    callerName?: string;
    callerPhone?: string;
    routingSource?: RoutingSource;
    routingConfidence?: number;
    sessionId: string;
    startedAt: string;
    endedAt: string;
    transcript: CallTranscriptEntry[];
    caseData?: Record<string, string | string[] | undefined> | null;
    isDemoCall?: boolean;
  }): CallLog {
    const id = `CALL-${Date.now()}-${++this.counter}`;
    const start = new Date(input.startedAt).getTime();
    const end = new Date(input.endedAt).getTime();
    const durationSeconds = Math.max(0, Math.round((end - start) / 1000));

    const fullUserText = input.transcript
      .filter((line) => line.speaker === "user")
      .map((line) => line.text)
      .join(" ");

    const tenant = input.tenantConfig || resolveTenantConfig(input.tenantId);
    const department = resolveDepartmentFromText(tenant, fullUserText) || tenant.departments[0];

    const issueType = detectIssueType(fullUserText);
    const urgency = detectUrgency(fullUserText);
    const businessUnit = mapBusinessUnit(issueType, urgency, department?.name || "");
    const detectedEmotion = detectEmotion(fullUserText);
    const handoffRecommended = urgency === "high" || detectedEmotion === "distressed";
    const summary = buildSummary(input.transcript);
    const workflowStatus = resolveWorkflowStatus(tenant, issueType, department?.name || "");
    const workflow = resolveWorkflowFromPlaybook(tenant, issueType, department?.name || "");

    const log: CallLog = {
      id,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      sessionId: input.sessionId,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationSeconds,
      issueType,
      urgency,
      businessUnit,
      departmentId: department?.id || "general",
      departmentName: department?.name || "General Support",
      callerName: String(input.callerName || ""),
      callerPhone: String(input.callerPhone || ""),
      routingSource: input.routingSource || "front-door",
      routingConfidence: Number(input.routingConfidence || 0),
      detectedEmotion,
      handoffRecommended,
      summary,
      ticketId: `TKT-${Date.now()}-${this.counter}`,
      ticketStatus: "unknown",
      workflowStatus,
      workflowCallType: workflow.callType,
      handoffPayload: workflow.payload,
      contractorName: "",
      contractorEta: "",
      status: "open",
      transcript: input.transcript,
      caseData: input.caseData || null,
      isDemoCall: input.isDemoCall || false,
    };

    this.logs.set(id, log);
    return log;
  }

  list(): CallLog[] {
    return Array.from(this.logs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  updateWorkflow(
    id: string,
    patch: Partial<Pick<CallLog, "workflowStatus" | "workflowCallType" | "handoffPayload" | "contractorName" | "contractorEta" | "status">>
  ): CallLog | null {
    const existing = this.logs.get(id);
    if (!existing) {
      return null;
    }

    const updated: CallLog = {
      ...existing,
      ...patch,
    };

    this.logs.set(id, updated);
    return updated;
  }
}

export const callLogStore = new CallLogStore();
