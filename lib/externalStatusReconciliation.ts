import {
  listOpenBusinessOperations,
  maybeCreateStalledOperationHandoff,
  OperationStatus,
  updateBusinessOperationStatus,
  type BusinessOperationRecord,
} from "@/lib/businessOperationsStore";
import { appendAutonomyAuditEvent } from "@/lib/autonomyAuditStore";

export interface ReconciliationResult {
  tenantId: string;
  checked: number;
  updated: number;
  escalated: number;
  skipped: boolean;
  reason?: string;
}

type ExternalStatusItem = {
  externalReference: string;
  status: string;
};

const lastRunByTenant = new Map<string, number>();

function getMinIntervalMs(): number {
  const seconds = Number.parseInt(process.env.EXTERNAL_RECONCILE_MIN_INTERVAL_SECONDS || "300", 10);
  if (Number.isNaN(seconds) || seconds <= 0) {
    return 300_000;
  }
  return seconds * 1000;
}

function getStuckThresholdMs(): number {
  const minutes = Number.parseInt(process.env.EXTERNAL_RECONCILE_STUCK_MINUTES || "60", 10);
  if (Number.isNaN(minutes) || minutes <= 0) {
    return 60 * 60 * 1000;
  }
  return minutes * 60 * 1000;
}

function normalizeExternalStatus(value: string): OperationStatus | null {
  const normalized = value.trim().toLowerCase();

  if (["new", "queued", "pending", "created"].includes(normalized)) {
    return "new";
  }

  if (["in_progress", "in-progress", "processing", "active", "assigned"].includes(normalized)) {
    return "in_progress";
  }

  if (["confirmed", "scheduled", "accepted"].includes(normalized)) {
    return "confirmed";
  }

  if (["completed", "resolved", "closed", "done", "fulfilled"].includes(normalized)) {
    return "completed";
  }

  return null;
}

async function fetchExternalStatuses(
  tenantId: string,
  operations: BusinessOperationRecord[]
): Promise<Map<string, OperationStatus>> {
  const reconcileUrl = process.env.EXTERNAL_STATUS_RECONCILIATION_URL || "";
  if (!reconcileUrl) {
    return new Map();
  }

  const references = operations
    .map((operation) => operation.externalReference)
    .filter((value) => value && value.trim().length > 0);

  if (references.length === 0) {
    return new Map();
  }

  const response = await fetch(reconcileUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.EXTERNAL_STATUS_RECONCILIATION_KEY
        ? { Authorization: `Bearer ${process.env.EXTERNAL_STATUS_RECONCILIATION_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      tenantId,
      references,
    }),
  });

  if (!response.ok) {
    throw new Error(`External reconcile API failed: ${response.status}`);
  }

  const payload = (await response.json()) as { items?: ExternalStatusItem[] };
  const updates = new Map<string, OperationStatus>();

  for (const item of payload.items || []) {
    const normalized = normalizeExternalStatus(item.status);
    if (!normalized) {
      continue;
    }
    updates.set(item.externalReference, normalized);
  }

  return updates;
}

function shouldEscalateStalledOperation(operation: BusinessOperationRecord): boolean {
  if (operation.status === "completed") {
    return false;
  }

  const referenceTime = operation.reconciledAt || operation.updatedAt || operation.createdAt;
  const ageMs = Date.now() - new Date(referenceTime).getTime();
  return ageMs >= getStuckThresholdMs();
}

export async function reconcileExternalStatusesForTenant(input: {
  tenantId: string;
  force?: boolean;
}): Promise<ReconciliationResult> {
  const { tenantId, force = false } = input;
  const reconcileUrl = process.env.EXTERNAL_STATUS_RECONCILIATION_URL || "";

  if (!reconcileUrl) {
    return {
      tenantId,
      checked: 0,
      updated: 0,
      escalated: 0,
      skipped: true,
      reason: "EXTERNAL_STATUS_RECONCILIATION_URL not set",
    };
  }

  const now = Date.now();
  const lastRun = lastRunByTenant.get(tenantId) || 0;
  if (!force && now - lastRun < getMinIntervalMs()) {
    return {
      tenantId,
      checked: 0,
      updated: 0,
      escalated: 0,
      skipped: true,
      reason: "min interval not reached",
    };
  }

  const openOperations = await listOpenBusinessOperations(tenantId);
  if (openOperations.length === 0) {
    lastRunByTenant.set(tenantId, now);
    return {
      tenantId,
      checked: 0,
      updated: 0,
      escalated: 0,
      skipped: false,
    };
  }

  const externalStatuses = await fetchExternalStatuses(tenantId, openOperations);
  let updated = 0;
  let escalated = 0;

  for (const operation of openOperations) {
    const externalStatus = externalStatuses.get(operation.externalReference);
    if (externalStatus && externalStatus !== operation.status) {
      const previousStatus = operation.status;
      const result = await updateBusinessOperationStatus({
        id: operation.id,
        tenantId: operation.tenantId,
        status: externalStatus,
      });
      if (result) {
        updated += 1;
        operation.status = result.status;
        operation.updatedAt = result.updatedAt;
        operation.reconciledAt = result.reconciledAt;
        await appendAutonomyAuditEvent({
          tenantId: operation.tenantId,
          logId: "",
          ticketId: operation.externalReference,
          operationId: operation.id,
          executionKey: `${operation.tenantId}:${operation.externalReference}`,
          eventType: "reconciliation.sync",
          decision: "update status",
          reason: "External status differed from local status",
          details: {
            fromStatus: previousStatus,
            toStatus: result.status,
          },
        }).catch(() => undefined);
      }
    }

    if (shouldEscalateStalledOperation(operation)) {
      const handoff = await maybeCreateStalledOperationHandoff({
        operation,
        reason: "External operation status appears stalled and requires manual follow-up.",
      });
      if (handoff) {
        escalated += 1;
        await appendAutonomyAuditEvent({
          tenantId: operation.tenantId,
          logId: "",
          ticketId: operation.externalReference,
          operationId: operation.id,
          executionKey: `${operation.tenantId}:${operation.externalReference}`,
          eventType: "reconciliation.escalation",
          decision: "create handoff",
          reason: "Operation appears stalled beyond configured threshold",
          details: {
            handoffId: handoff.id,
          },
        }).catch(() => undefined);
      }
    }
  }

  lastRunByTenant.set(tenantId, now);
  return {
    tenantId,
    checked: openOperations.length,
    updated,
    escalated,
    skipped: false,
  };
}
