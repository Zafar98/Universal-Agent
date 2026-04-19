import { randomUUID } from "crypto";
import { CallLog } from "@/lib/callLogStore";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";
import { BusinessWorkspace } from "@/lib/businessWorkspaceStore";
import { assignHandoffToStaff, getNextAvailableStaff } from "@/lib/staffAssignmentStore";
import { sendNotification, HandoffNotificationPayload, NotificationChannel } from "@/lib/notificationService";

export type OperationType = "ticket" | "reservation" | "order" | "appointment" | "case";
export type OperationStatus = "new" | "in_progress" | "confirmed" | "completed";
export type HandoffStatus = "open" | "assigned" | "resolved";

export interface BusinessOperationRecord {
  id: string;
  tenantId: string;
  sessionId: string;
  operationType: OperationType;
  status: OperationStatus;
  departmentId: string;
  departmentName: string;
  title: string;
  summary: string;
  externalReference: string;
  createdAt: string;
  updatedAt: string;
  reconciledAt: string | null;
}

export interface HandoffQueueItem {
  id: string;
  tenantId: string;
  sessionId: string;
  departmentId: string;
  departmentName: string;
  priority: "normal" | "urgent";
  reason: string;
  status: HandoffStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

let schemaInitialized = false;
const memoryOperations = new Map<string, BusinessOperationRecord>();
const memoryHandoffs = new Map<string, HandoffQueueItem>();

function inferOperationType(log: CallLog, workspace: BusinessWorkspace): OperationType {
  if (workspace.businessModelId === "restaurant") {
    if (log.issueType === "reservation") {
      return "reservation";
    }
    if (log.issueType === "order") {
      return "order";
    }
    return "case";
  }

  if (workspace.businessModelId === "healthcare" && log.departmentName === "Appointments") {
    return "appointment";
  }

  if (log.issueType === "repair" || log.issueType === "billing" || log.issueType === "complaint") {
    return "ticket";
  }

  return "case";
}

function buildOperationTitle(type: OperationType, log: CallLog): string {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return `${label} for ${log.departmentName}`;
}

async function ensureBusinessOperationsSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_operations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL,
      department_id TEXT NOT NULL,
      department_name TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      external_reference TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reconciled_at TIMESTAMPTZ
    );
  `);
  await pool.query(`ALTER TABLE business_operations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE business_operations ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS handoff_queue (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      department_name TEXT NOT NULL,
      priority TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  schemaInitialized = true;
}

export async function createBusinessOperationFromCall(input: {
  log: CallLog;
  workspace: BusinessWorkspace;
}): Promise<BusinessOperationRecord> {
  const operationType = inferOperationType(input.log, input.workspace);
  const operation: BusinessOperationRecord = {
    id: randomUUID(),
    tenantId: input.log.tenantId,
    sessionId: input.log.sessionId,
    operationType,
    status: operationType === "reservation" || operationType === "appointment" ? "confirmed" : "new",
    departmentId: input.log.departmentId,
    departmentName: input.log.departmentName,
    title: buildOperationTitle(operationType, input.log),
    summary: input.log.summary,
    externalReference: input.log.ticketId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reconciledAt: null,
  };

  if (!hasDatabaseConfig()) {
    memoryOperations.set(operation.id, operation);
    return operation;
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO business_operations (
        id, tenant_id, session_id, operation_type, status, department_id,
        department_name, title, summary, external_reference, created_at, updated_at, reconciled_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);
    `,
    [
      operation.id,
      operation.tenantId,
      operation.sessionId,
      operation.operationType,
      operation.status,
      operation.departmentId,
      operation.departmentName,
      operation.title,
      operation.summary,
      operation.externalReference,
      operation.createdAt,
      operation.updatedAt,
      operation.reconciledAt,
    ]
  );

  return operation;
}

export async function maybeCreateHandoffFromCall(log: CallLog): Promise<HandoffQueueItem | null> {
  if (!log.handoffRecommended) {
    return null;
  }

  const item: HandoffQueueItem = {
    id: randomUUID(),
    tenantId: log.tenantId,
    sessionId: log.sessionId,
    departmentId: log.departmentId,
    departmentName: log.departmentName,
    priority: log.urgency === "high" ? "urgent" : "normal",
    reason: `${log.detectedEmotion} caller with ${log.urgency} urgency in ${log.departmentName}`,
    status: "open",
    assignedTo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryHandoffs.set(item.id, item);
  } else {
    await ensureBusinessOperationsSchema();
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO handoff_queue (
          id, tenant_id, session_id, department_id, department_name, priority,
          reason, status, assigned_to, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
      `,
      [
        item.id,
        item.tenantId,
        item.sessionId,
        item.departmentId,
        item.departmentName,
        item.priority,
        item.reason,
        item.status,
        item.assignedTo,
        item.createdAt,
        item.updatedAt,
      ]
    );
  }

  try {
    const staff = await getNextAvailableStaff(log.tenantId, log.departmentName);
    if (staff) {
      const assignment = await assignHandoffToStaff({
        handoffQueueItemId: item.id,
        tenantId: log.tenantId,
        departmentName: log.departmentName,
      });

      if (assignment) {
        item.assignedTo = staff.name;
        item.status = "assigned";

        if (!hasDatabaseConfig()) {
          memoryHandoffs.set(item.id, item);
        } else {
          const pool = getPool();
          await pool.query(
            `UPDATE handoff_queue SET assigned_to = $1, status = $2, updated_at = NOW() WHERE id = $3;`,
            [staff.name, "assigned", item.id]
          );
        }

        const notificationPayload: HandoffNotificationPayload = {
          handoffId: item.id,
          department: log.departmentName,
          priority: item.priority,
          issueType: log.issueType,
          callerName: log.callerName || "Unknown",
          callerPhone: log.callerPhone || "Unknown",
          urgency: log.urgency,
          summary: log.summary,
          dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/${log.tenantId}?handoff=${item.id}`,
        };

        const notificationChannels = (process.env.HANDOFF_NOTIFICATION_CHANNELS || "email")
          .split(",")
          .map((channel) => channel.trim())
          .filter(Boolean) as NotificationChannel[];
        void sendNotification(staff, notificationPayload, notificationChannels);
      }
    }
  } catch (error) {
    console.error("[handoff] Auto-assignment failed:", error);
  }

  return item;
}

export async function listBusinessOperations(tenantId: string): Promise<BusinessOperationRecord[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryOperations.values())
      .filter((record) => record.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM business_operations WHERE tenant_id = $1 ORDER BY created_at DESC;`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    operationType: row.operation_type,
    status: row.status,
    departmentId: row.department_id,
    departmentName: row.department_name,
    title: row.title,
    summary: row.summary,
    externalReference: row.external_reference,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    reconciledAt: row.reconciled_at ? new Date(row.reconciled_at).toISOString() : null,
  }));
}

export async function listHandoffQueueItems(tenantId: string): Promise<HandoffQueueItem[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryHandoffs.values())
      .filter((item) => item.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM handoff_queue WHERE tenant_id = $1 ORDER BY created_at DESC;`, [tenantId]);

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    priority: row.priority,
    reason: row.reason,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function updateHandoffQueueItem(input: {
  id: string;
  tenantId: string;
  status: HandoffStatus;
  assignedTo: string;
}): Promise<HandoffQueueItem | null> {
  if (!hasDatabaseConfig()) {
    const existing = memoryHandoffs.get(input.id);
    if (!existing || existing.tenantId !== input.tenantId) {
      return null;
    }

    const updated = {
      ...existing,
      status: input.status,
      assignedTo: input.assignedTo,
      updatedAt: new Date().toISOString(),
    };
    memoryHandoffs.set(input.id, updated);
    return updated;
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE handoff_queue
      SET status = $3, assigned_to = $4, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `,
    [input.id, input.tenantId, input.status, input.assignedTo]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    priority: row.priority,
    reason: row.reason,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function maybeCreateStalledOperationHandoff(input: {
  operation: BusinessOperationRecord;
  reason: string;
}): Promise<HandoffQueueItem | null> {
  const { operation, reason } = input;
  const dedupeTag = `[ext:${operation.externalReference}]`;

  if (!hasDatabaseConfig()) {
    const existing = Array.from(memoryHandoffs.values()).find(
      (item) =>
        item.tenantId === operation.tenantId &&
        item.sessionId === operation.sessionId &&
        item.status !== "resolved" &&
        item.reason.includes(dedupeTag)
    );

    if (existing) {
      return existing;
    }
  } else {
    await ensureBusinessOperationsSchema();
    const pool = getPool();
    const existing = await pool.query(
      `
        SELECT *
        FROM handoff_queue
        WHERE tenant_id = $1
          AND session_id = $2
          AND status <> 'resolved'
          AND reason LIKE $3
        ORDER BY created_at DESC
        LIMIT 1;
      `,
      [operation.tenantId, operation.sessionId, `%${dedupeTag}%`]
    );

    if (existing.rows[0]) {
      const row = existing.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        sessionId: row.session_id,
        departmentId: row.department_id,
        departmentName: row.department_name,
        priority: row.priority,
        reason: row.reason,
        status: row.status,
        assignedTo: row.assigned_to,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    }
  }

  const item: HandoffQueueItem = {
    id: randomUUID(),
    tenantId: operation.tenantId,
    sessionId: operation.sessionId,
    departmentId: operation.departmentId,
    departmentName: operation.departmentName,
    priority: "urgent",
    reason: `${reason} ${dedupeTag}`,
    status: "open",
    assignedTo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryHandoffs.set(item.id, item);
  } else {
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO handoff_queue (
          id, tenant_id, session_id, department_id, department_name, priority,
          reason, status, assigned_to, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
      `,
      [
        item.id,
        item.tenantId,
        item.sessionId,
        item.departmentId,
        item.departmentName,
        item.priority,
        item.reason,
        item.status,
        item.assignedTo,
        item.createdAt,
        item.updatedAt,
      ]
    );
  }

  try {
    const staff = await getNextAvailableStaff(operation.tenantId, operation.departmentName);
    if (staff) {
      const assignment = await assignHandoffToStaff({
        handoffQueueItemId: item.id,
        tenantId: operation.tenantId,
        departmentName: operation.departmentName,
      });

      if (assignment) {
        item.assignedTo = staff.name;
        item.status = "assigned";

        if (!hasDatabaseConfig()) {
          memoryHandoffs.set(item.id, item);
        } else {
          const pool = getPool();
          await pool.query(
            `UPDATE handoff_queue SET assigned_to = $1, status = $2, updated_at = NOW() WHERE id = $3;`,
            [staff.name, "assigned", item.id]
          );
        }

        const notificationPayload: HandoffNotificationPayload = {
          handoffId: item.id,
          department: operation.departmentName,
          priority: item.priority,
          issueType: operation.operationType,
          callerName: "System Reconciliation",
          callerPhone: "N/A",
          urgency: "high",
          summary: `${operation.title}: ${operation.summary}`,
          dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/${operation.tenantId}?handoff=${item.id}`,
        };

        const notificationChannels = (process.env.HANDOFF_NOTIFICATION_CHANNELS || "email")
          .split(",")
          .map((channel) => channel.trim())
          .filter(Boolean) as NotificationChannel[];
        void sendNotification(staff, notificationPayload, notificationChannels);
      }
    }
  } catch (error) {
    console.error("[handoff] Stalled-operation escalation failed:", error);
  }

  return item;
}

export async function listAllBusinessOperations(): Promise<BusinessOperationRecord[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryOperations.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM business_operations ORDER BY created_at DESC;`);

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    operationType: row.operation_type,
    status: row.status,
    departmentId: row.department_id,
    departmentName: row.department_name,
    title: row.title,
    summary: row.summary,
    externalReference: row.external_reference,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    reconciledAt: row.reconciled_at ? new Date(row.reconciled_at).toISOString() : null,
  }));
}

export async function listOpenBusinessOperations(tenantId: string): Promise<BusinessOperationRecord[]> {
  const operations = await listBusinessOperations(tenantId);
  return operations.filter((operation) => operation.status !== "completed");
}

export async function updateBusinessOperationStatus(input: {
  id: string;
  tenantId: string;
  status: OperationStatus;
  reconciledAt?: string;
}): Promise<BusinessOperationRecord | null> {
  const reconciliationTime = input.reconciledAt || new Date().toISOString();

  if (!hasDatabaseConfig()) {
    const existing = memoryOperations.get(input.id);
    if (!existing || existing.tenantId !== input.tenantId) {
      return null;
    }

    const updated: BusinessOperationRecord = {
      ...existing,
      status: input.status,
      updatedAt: new Date().toISOString(),
      reconciledAt: reconciliationTime,
    };
    memoryOperations.set(input.id, updated);
    return updated;
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE business_operations
      SET status = $3, updated_at = NOW(), reconciled_at = $4
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `,
    [input.id, input.tenantId, input.status, reconciliationTime]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    operationType: row.operation_type,
    status: row.status,
    departmentId: row.department_id,
    departmentName: row.department_name,
    title: row.title,
    summary: row.summary,
    externalReference: row.external_reference,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    reconciledAt: row.reconciled_at ? new Date(row.reconciled_at).toISOString() : null,
  };
}

export async function listAllHandoffQueueItems(): Promise<HandoffQueueItem[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryHandoffs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  await ensureBusinessOperationsSchema();
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM handoff_queue ORDER BY created_at DESC;`);

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    sessionId: row.session_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    priority: row.priority,
    reason: row.reason,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}