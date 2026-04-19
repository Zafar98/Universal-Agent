import { CallLog, WorkflowStatus, callLogStore } from "@/lib/callLogStore";
import { BusinessWorkspace } from "@/lib/businessWorkspaceStore";
import {
  createBusinessOperationFromCall,
  maybeCreateHandoffFromCall,
  BusinessOperationRecord,
} from "@/lib/businessOperationsStore";
import {
  ensureCallLogSchema,
  updateCallLogWorkflow,
} from "@/lib/callLogRepository";
import { hasDatabaseConfig } from "@/lib/postgres";
import {
  claimDueAutonomyRetryJobs,
  enqueueAutonomyRetryJob,
  resolveAutonomyRetryJob,
  tryAcquireExecutionLock,
  updateExecutionLock,
} from "@/lib/autonomyReliabilityStore";
import { buildExternalSafeCallPayload } from "@/lib/privacyRedaction";
import { appendAutonomyAuditEvent, type AutonomyAuditEventType } from "@/lib/autonomyAuditStore";

type AutonomyMode = "off" | "assisted" | "full";

type ExternalExecutionResult = {
  ok: boolean;
  workflowStatus?: WorkflowStatus;
  contractorName?: string;
  contractorEta?: string;
  externalReference?: string;
  reason?: string;
};

type ExternalExecutionPayload = {
  workflowStatus?: unknown;
  contractorName?: unknown;
  contractorEta?: unknown;
  externalReference?: unknown;
};

type AuditContext = {
  tenantId: string;
  logId?: string;
  ticketId?: string;
  operationId?: string;
  executionKey?: string;
};

export type AutonomyExecutionResult = {
  mode: AutonomyMode;
  operationId?: string;
  executed: boolean;
  fallbackToHandoff: boolean;
  reason?: string;
};

const CLOSED_WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  "resolved",
  "reservation_confirmed",
  "order_dispatched",
  "event_quote_sent",
]);

const VALID_WORKFLOW_STATUSES: Set<WorkflowStatus> = new Set<WorkflowStatus>([
  "new",
  "sent_to_contractor",
  "awaiting_contractor",
  "contractor_on_the_way",
  "reservation_confirmed",
  "order_dispatched",
  "guest_service_assigned",
  "event_quote_sent",
  "resolved",
]);

const MAX_WEBHOOK_ATTEMPTS = 3;
const MAX_DURABLE_RETRY_ATTEMPTS = 6;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_WINDOW_MS = 5 * 60 * 1000;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60 * 1000;

const circuitState = new Map<string, { failureTimestamps: number[]; openedUntil: number }>();

function getAutonomyMode(): AutonomyMode {
  const raw = String(process.env.AGENT_AUTONOMY_MODE || "full").toLowerCase();
  if (raw === "off" || raw === "assisted" || raw === "full") {
    return raw;
  }
  return "full";
}

function getExecutionWebhook(workspace: BusinessWorkspace): string | null {
  if (workspace.businessModelId === "housing-association") {
    return process.env.HOUSING_AUTONOMY_WEBHOOK_URL || process.env.DEFAULT_AUTONOMY_WEBHOOK_URL || null;
  }
  if (workspace.businessModelId === "hotel" || workspace.businessModelId === "concierge") {
    return process.env.HOTEL_AUTONOMY_WEBHOOK_URL || process.env.DEFAULT_AUTONOMY_WEBHOOK_URL || null;
  }
  if (workspace.businessModelId === "restaurant") {
    return process.env.RESTAURANT_AUTONOMY_WEBHOOK_URL || process.env.DEFAULT_AUTONOMY_WEBHOOK_URL || null;
  }
  return process.env.DEFAULT_AUTONOMY_WEBHOOK_URL || null;
}

function deriveTargetStatus(log: CallLog): WorkflowStatus {
  if (log.issueType === "repair") {
    return "sent_to_contractor";
  }
  if (log.issueType === "reservation") {
    return "reservation_confirmed";
  }
  if (log.issueType === "order") {
    return "order_dispatched";
  }
  if (log.handoffRecommended) {
    return "awaiting_contractor";
  }
  return "resolved";
}

function deriveCallStatus(workflowStatus: WorkflowStatus): "open" | "in_progress" | "closed" {
  if (CLOSED_WORKFLOW_STATUSES.has(workflowStatus)) {
    return "closed";
  }
  return "in_progress";
}

function shouldUseInternalFallback(): boolean {
  const raw = String(process.env.ENABLE_INTERNAL_AUTONOMY_FALLBACK || "true").toLowerCase();
  return raw !== "false";
}

function shouldEnforceRiskHandoffPolicy(): boolean {
  const raw = String(process.env.ENABLE_RISK_HANDOFF_POLICY || "true").toLowerCase();
  return raw !== "false";
}

function requiresRiskHandoff(log: CallLog): boolean {
  if (!shouldEnforceRiskHandoffPolicy()) {
    return false;
  }

  if (log.detectedEmotion === "distressed") {
    return true;
  }

  if (log.urgency === "high" && log.handoffRecommended) {
    return true;
  }

  return false;
}

function buildExecutionKey(input: { tenantId: string; ticketId: string }): string {
  return `${input.tenantId}:${input.ticketId}`;
}

function calculateRetryDelayMs(attempt: number): number {
  return Math.min(5 * 60 * 1000, attempt * 30 * 1000);
}

function isCircuitOpen(webhookUrl: string): boolean {
  const state = circuitState.get(webhookUrl);
  if (!state) {
    return false;
  }

  if (state.openedUntil > Date.now()) {
    return true;
  }

  circuitState.set(webhookUrl, { ...state, openedUntil: 0 });
  return false;
}

function registerWebhookFailure(webhookUrl: string): void {
  const now = Date.now();
  const existing = circuitState.get(webhookUrl) || { failureTimestamps: [], openedUntil: 0 };
  const recent = existing.failureTimestamps.filter((ts) => now - ts <= CIRCUIT_BREAKER_WINDOW_MS);
  recent.push(now);

  const openedUntil = recent.length >= CIRCUIT_BREAKER_THRESHOLD ? now + CIRCUIT_BREAKER_COOLDOWN_MS : existing.openedUntil;
  circuitState.set(webhookUrl, { failureTimestamps: recent, openedUntil });
}

function registerWebhookSuccess(webhookUrl: string): void {
  circuitState.set(webhookUrl, { failureTimestamps: [], openedUntil: 0 });
}

function parseExternalExecutionPayload(payload: ExternalExecutionPayload): ExternalExecutionResult {
  const workflowStatus =
    typeof payload.workflowStatus === "string" && VALID_WORKFLOW_STATUSES.has(payload.workflowStatus as WorkflowStatus)
      ? (payload.workflowStatus as WorkflowStatus)
      : undefined;

  return {
    ok: true,
    workflowStatus,
    contractorName: typeof payload.contractorName === "string" ? payload.contractorName : undefined,
    contractorEta: typeof payload.contractorEta === "string" ? payload.contractorEta : undefined,
    externalReference: typeof payload.externalReference === "string" ? payload.externalReference : undefined,
  };
}

function runInternalExecutor(log: CallLog, workspace: BusinessWorkspace): ExternalExecutionResult {
  if (workspace.businessModelId === "housing-association") {
    return {
      ok: true,
      workflowStatus: "sent_to_contractor",
      contractorName: "Autonomous Dispatch Bot",
      contractorEta: log.urgency === "high" ? "30 minutes" : "2 hours",
      externalReference: `INT-${log.ticketId}`,
    };
  }

  if (workspace.businessModelId === "hotel" || workspace.businessModelId === "concierge") {
    return {
      ok: true,
      workflowStatus: log.issueType === "reservation" ? "reservation_confirmed" : "guest_service_assigned",
      externalReference: `INT-${log.ticketId}`,
    };
  }

  if (workspace.businessModelId === "restaurant") {
    return {
      ok: true,
      workflowStatus: log.issueType === "order" ? "order_dispatched" : "reservation_confirmed",
      externalReference: `INT-${log.ticketId}`,
    };
  }

  return {
    ok: true,
    workflowStatus: "resolved",
    externalReference: `INT-${log.ticketId}`,
  };
}

async function writeAuditEvent(
  context: AuditContext,
  eventType: AutonomyAuditEventType,
  decision: string,
  reason: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await appendAutonomyAuditEvent({
      tenantId: context.tenantId,
      logId: context.logId,
      ticketId: context.ticketId,
      operationId: context.operationId,
      executionKey: context.executionKey,
      eventType,
      decision,
      reason,
      details,
    });
  } catch (error) {
    console.error("[autonomy-audit] failed to append event", error);
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeViaWebhook(input: {
  webhookUrl: string;
  log: CallLog;
  workspace: BusinessWorkspace;
  operation: BusinessOperationRecord;
  attempt: number;
}): Promise<ExternalExecutionResult> {
  const auditContext: AuditContext = {
    tenantId: input.log.tenantId,
    logId: input.log.id,
    ticketId: input.log.ticketId,
    operationId: input.operation.id,
    executionKey: buildExecutionKey({ tenantId: input.log.tenantId, ticketId: input.log.ticketId }),
  };

  await writeAuditEvent(auditContext, "webhook.attempt", "call webhook", "Attempting autonomy webhook call", {
    webhookUrl: input.webhookUrl,
    attempt: input.attempt,
  });

  if (isCircuitOpen(input.webhookUrl)) {
    await writeAuditEvent(auditContext, "webhook.failure", "skip webhook", "Circuit breaker is open", {
      webhookUrl: input.webhookUrl,
      attempt: input.attempt,
    });
    return {
      ok: false,
      reason: "Circuit breaker is open for autonomy webhook",
    };
  }

  const body = JSON.stringify({
    event: "autonomy.execute",
    idempotencyKey: input.log.id,
    attempt: input.attempt,
    workspace: {
      tenantId: input.workspace.id,
      businessName: input.workspace.name,
      businessModelId: input.workspace.businessModelId,
    },
    operation: {
      id: input.operation.id,
      type: input.operation.operationType,
      title: input.operation.title,
      summary: input.operation.summary,
      externalReference: input.operation.externalReference,
    },
    call: buildExternalSafeCallPayload(input.log, {
      businessModelId: input.workspace.businessModelId,
    }),
  });

  try {
    const response = await fetch(input.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "UniversalAgent-Autonomy/1.0",
      },
      body,
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      registerWebhookFailure(input.webhookUrl);
      await writeAuditEvent(auditContext, "webhook.failure", "webhook http failure", `Webhook returned HTTP ${response.status}`, {
        webhookUrl: input.webhookUrl,
        attempt: input.attempt,
        statusCode: response.status,
      });
      return {
        ok: false,
        reason: `Webhook returned HTTP ${response.status}`,
      };
    }

    const payload = (await response.json().catch(() => ({}))) as ExternalExecutionPayload;
    registerWebhookSuccess(input.webhookUrl);
    await writeAuditEvent(auditContext, "webhook.success", "webhook completed", "Webhook execution returned success", {
      webhookUrl: input.webhookUrl,
      attempt: input.attempt,
    });
    return parseExternalExecutionPayload(payload);
  } catch (error) {
    registerWebhookFailure(input.webhookUrl);
    await writeAuditEvent(
      auditContext,
      "webhook.failure",
      "webhook network failure",
      error instanceof Error ? error.message : "Webhook execution failed",
      {
        webhookUrl: input.webhookUrl,
        attempt: input.attempt,
      }
    );
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Webhook execution failed",
    };
  }
}

async function processPendingRetryJobs(): Promise<void> {
  const jobs = await claimDueAutonomyRetryJobs(2);

  for (const job of jobs) {
    const payload = job.payload;
    const log = payload.log as CallLog | undefined;
    const workspace = payload.workspace as BusinessWorkspace | undefined;
    const operation = payload.operation as BusinessOperationRecord | undefined;

    if (!log || !workspace || !operation) {
      await resolveAutonomyRetryJob({
        id: job.id,
        status: "dead",
        attemptCount: job.attemptCount + 1,
        lastError: "Retry payload missing required context",
      });
      continue;
    }

    const attempt = job.attemptCount + 1;
    await writeAuditEvent(
      {
        tenantId: job.tenantId,
        logId: job.logId,
        ticketId: job.ticketId,
        operationId: operation?.id || "",
        executionKey: job.executionKey,
      },
      "retry.processing",
      "process retry",
      "Processing durable retry job",
      { attempt }
    );

    const result = await executeViaWebhook({
      webhookUrl: job.webhookUrl,
      log,
      workspace,
      operation,
      attempt,
    });

    if (result.ok) {
      await applyWorkflowPatch({
        log,
        workflowStatus: result.workflowStatus || deriveTargetStatus(log),
        contractorName: result.contractorName,
        contractorEta: result.contractorEta,
      });
      await resolveAutonomyRetryJob({
        id: job.id,
        status: "completed",
        attemptCount: attempt,
      });
      await writeAuditEvent(
        {
          tenantId: job.tenantId,
          logId: job.logId,
          ticketId: job.ticketId,
          operationId: operation.id,
          executionKey: job.executionKey,
        },
        "retry.completed",
        "retry resolved",
        "Durable retry succeeded",
        { attempt }
      );
      await updateExecutionLock({
        executionKey: job.executionKey,
        status: "completed",
      });
      continue;
    }

    if (attempt >= job.maxAttempts) {
      await resolveAutonomyRetryJob({
        id: job.id,
        status: "dead",
        attemptCount: attempt,
        lastError: result.reason || "Retry execution failed",
      });
      await writeAuditEvent(
        {
          tenantId: job.tenantId,
          logId: job.logId,
          ticketId: job.ticketId,
          operationId: operation.id,
          executionKey: job.executionKey,
        },
        "retry.dead",
        "retry exhausted",
        result.reason || "Retry execution failed",
        { attempt }
      );
      await updateExecutionLock({
        executionKey: job.executionKey,
        status: "failed",
        lastError: result.reason,
      });
      continue;
    }

    const nextRetryAt = new Date(Date.now() + calculateRetryDelayMs(attempt)).toISOString();
    await resolveAutonomyRetryJob({
      id: job.id,
      status: "queued",
      attemptCount: attempt,
      nextRetryAt,
      lastError: result.reason || "Retry execution failed",
    });
  }
}

async function applyWorkflowPatch(input: {
  log: CallLog;
  workflowStatus: WorkflowStatus;
  contractorName?: string;
  contractorEta?: string;
}): Promise<void> {
  const status = deriveCallStatus(input.workflowStatus);

  if (hasDatabaseConfig()) {
    await ensureCallLogSchema();
    await updateCallLogWorkflow({
      id: input.log.id,
      workflowStatus: input.workflowStatus,
      contractorName: input.contractorName || "",
      contractorEta: input.contractorEta || "",
      status,
    });
    await writeAuditEvent(
      {
        tenantId: input.log.tenantId,
        logId: input.log.id,
        ticketId: input.log.ticketId,
      },
      "workflow.updated",
      "update workflow",
      "Persisted workflow status update",
      {
        workflowStatus: input.workflowStatus,
        contractorName: input.contractorName || "",
        contractorEta: input.contractorEta || "",
      }
    );
    return;
  }

  callLogStore.updateWorkflow(input.log.id, {
    workflowStatus: input.workflowStatus,
    contractorName: input.contractorName || "",
    contractorEta: input.contractorEta || "",
    status,
  });

  await writeAuditEvent(
    {
      tenantId: input.log.tenantId,
      logId: input.log.id,
      ticketId: input.log.ticketId,
    },
    "workflow.updated",
    "update workflow",
    "Updated workflow status in memory store",
    {
      workflowStatus: input.workflowStatus,
      contractorName: input.contractorName || "",
      contractorEta: input.contractorEta || "",
    }
  );
}

export async function runAutonomousExecution(input: {
  log: CallLog;
  workspace: BusinessWorkspace;
}): Promise<AutonomyExecutionResult> {
  await processPendingRetryJobs();

  const mode = getAutonomyMode();
  const operation = await createBusinessOperationFromCall({
    log: input.log,
    workspace: input.workspace,
  });

  const executionKey = buildExecutionKey({
    tenantId: input.log.tenantId,
    ticketId: input.log.ticketId,
  });

  const auditContext: AuditContext = {
    tenantId: input.log.tenantId,
    logId: input.log.id,
    ticketId: input.log.ticketId,
    operationId: operation.id,
    executionKey,
  };

  await writeAuditEvent(auditContext, "execution.started", "start execution", "Autonomy execution started", {
    mode,
    businessModelId: input.workspace.businessModelId,
  });

  const acquired = await tryAcquireExecutionLock({
    executionKey,
    tenantId: input.log.tenantId,
    logId: input.log.id,
    ticketId: input.log.ticketId,
    operationId: operation.id,
  });

  if (!acquired) {
    await writeAuditEvent(auditContext, "execution.lock_rejected", "skip duplicate", "Execution lock already held");
    return {
      mode,
      operationId: operation.id,
      executed: false,
      fallbackToHandoff: false,
      reason: "Execution already processed for this ticket",
    };
  }

  await writeAuditEvent(auditContext, "execution.lock_acquired", "acquire lock", "Execution lock acquired");

  if (requiresRiskHandoff(input.log)) {
    await maybeCreateHandoffFromCall(input.log);
    await applyWorkflowPatch({
      log: input.log,
      workflowStatus: "awaiting_contractor",
    });
    await updateExecutionLock({
      executionKey,
      status: "failed",
      lastError: "Risk policy routed call to handoff",
    });
    await writeAuditEvent(auditContext, "policy.risk_handoff", "route to handoff", "Risk policy routed call to human handoff");

    return {
      mode,
      operationId: operation.id,
      executed: false,
      fallbackToHandoff: true,
      reason: "Risk policy routed call to handoff",
    };
  }

  if (mode === "off") {
    await maybeCreateHandoffFromCall(input.log);
    await updateExecutionLock({
      executionKey,
      status: "failed",
      lastError: "Autonomy mode is off",
    });
    await writeAuditEvent(auditContext, "mode.off_handoff", "route to handoff", "Autonomy mode is off");
    return {
      mode,
      operationId: operation.id,
      executed: false,
      fallbackToHandoff: true,
      reason: "Autonomy mode is off",
    };
  }

  if (mode === "assisted") {
    await maybeCreateHandoffFromCall(input.log);
    await updateExecutionLock({
      executionKey,
      status: "failed",
      lastError: "Assisted mode requires human handoff",
    });
    await writeAuditEvent(auditContext, "mode.assisted_handoff", "route to handoff", "Assisted mode requires human handoff");
    return {
      mode,
      operationId: operation.id,
      executed: false,
      fallbackToHandoff: true,
      reason: "Assisted mode requires human handoff",
    };
  }

  const webhookUrl = getExecutionWebhook(input.workspace);
  if (!webhookUrl) {
    if (!shouldUseInternalFallback()) {
      await maybeCreateHandoffFromCall(input.log);
      await updateExecutionLock({
        executionKey,
        status: "failed",
        lastError: "No autonomy webhook configured",
      });
      await writeAuditEvent(auditContext, "fallback.handoff", "handoff fallback", "No autonomy webhook configured");
      return {
        mode,
        operationId: operation.id,
        executed: false,
        fallbackToHandoff: true,
        reason: "No autonomy webhook configured",
      };
    }

    const internal = runInternalExecutor(input.log, input.workspace);
    await applyWorkflowPatch({
      log: input.log,
      workflowStatus: (internal.workflowStatus || deriveTargetStatus(input.log)) as WorkflowStatus,
      contractorName: internal.contractorName,
      contractorEta: internal.contractorEta,
    });
    await updateExecutionLock({ executionKey, status: "completed" });
    await writeAuditEvent(auditContext, "fallback.internal", "internal executor", "Executed via internal fallback due to missing webhook");

    return {
      mode,
      operationId: operation.id,
      executed: true,
      fallbackToHandoff: false,
      reason: "Executed via internal autonomy fallback",
    };
  }

  const maxAttempts = MAX_WEBHOOK_ATTEMPTS;
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await executeViaWebhook({
      webhookUrl,
      log: input.log,
      workspace: input.workspace,
      operation,
      attempt,
    });

    if (result.ok) {
      const targetStatus =
        result.workflowStatus && typeof result.workflowStatus === "string"
          ? result.workflowStatus
          : deriveTargetStatus(input.log);

      await applyWorkflowPatch({
        log: input.log,
        workflowStatus: targetStatus,
        contractorName: result.contractorName,
        contractorEta: result.contractorEta,
      });
      await updateExecutionLock({ executionKey, status: "completed" });

      return {
        mode,
        operationId: operation.id,
        executed: true,
        fallbackToHandoff: false,
      };
    }

    lastError = result.reason || "Execution failed";
    if (attempt < maxAttempts) {
      await delay(attempt * 1000);
    }
  }

  await enqueueAutonomyRetryJob({
    executionKey,
    tenantId: input.log.tenantId,
    logId: input.log.id,
    ticketId: input.log.ticketId,
    webhookUrl,
    payload: {
      log: input.log,
      workspace: input.workspace,
      operation,
    },
    lastError: lastError || "All execution attempts failed",
    currentAttempt: maxAttempts,
    maxAttempts: MAX_DURABLE_RETRY_ATTEMPTS,
    nextRetryAt: new Date(Date.now() + calculateRetryDelayMs(maxAttempts)).toISOString(),
  });
  await writeAuditEvent(auditContext, "retry.queued", "queue durable retry", lastError || "All execution attempts failed", {
    webhookUrl,
    maxAttempts: MAX_DURABLE_RETRY_ATTEMPTS,
  });

  if (shouldUseInternalFallback()) {
    const internal = runInternalExecutor(input.log, input.workspace);
    await applyWorkflowPatch({
      log: input.log,
      workflowStatus: (internal.workflowStatus || deriveTargetStatus(input.log)) as WorkflowStatus,
      contractorName: internal.contractorName,
      contractorEta: internal.contractorEta,
    });
    await updateExecutionLock({
      executionKey,
      status: "completed",
      lastError,
    });
    await writeAuditEvent(auditContext, "fallback.internal", "internal fallback", "Webhook failed; internal fallback applied", {
      error: lastError,
    });

    return {
      mode,
      operationId: operation.id,
      executed: true,
      fallbackToHandoff: false,
      reason: "Webhook failed, executed via internal fallback",
    };
  }

  await maybeCreateHandoffFromCall(input.log);
  await applyWorkflowPatch({
    log: input.log,
    workflowStatus: "awaiting_contractor",
  });
  await updateExecutionLock({
    executionKey,
    status: "failed",
    lastError: lastError || "All execution attempts failed",
  });
  await writeAuditEvent(auditContext, "fallback.handoff", "handoff fallback", lastError || "All execution attempts failed");

  return {
    mode,
    operationId: operation.id,
    executed: false,
    fallbackToHandoff: true,
    reason: lastError || "All execution attempts failed",
  };
}
