import { randomUUID } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

export type AutonomyAuditEventType =
  | "execution.started"
  | "execution.lock_acquired"
  | "execution.lock_rejected"
  | "policy.risk_handoff"
  | "mode.off_handoff"
  | "mode.assisted_handoff"
  | "webhook.attempt"
  | "webhook.success"
  | "webhook.failure"
  | "retry.queued"
  | "retry.processing"
  | "retry.completed"
  | "retry.dead"
  | "fallback.internal"
  | "fallback.handoff"
  | "workflow.updated"
  | "reconciliation.sync"
  | "reconciliation.escalation";

export interface AutonomyAuditEntry {
  id: string;
  tenantId: string;
  logId: string;
  ticketId: string;
  operationId: string;
  executionKey: string;
  eventType: AutonomyAuditEventType;
  decision: string;
  reason: string;
  details: Record<string, unknown>;
  createdAt: string;
}

let schemaInitialized = false;
const memoryAudit = new Map<string, AutonomyAuditEntry>();

async function ensureAutonomyAuditSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS autonomy_audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      log_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      operation_id TEXT NOT NULL DEFAULT '',
      execution_key TEXT NOT NULL DEFAULT '',
      event_type TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT NOT NULL,
      details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS autonomy_audit_logs_tenant_created_idx ON autonomy_audit_logs(tenant_id, created_at DESC);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS autonomy_audit_logs_ticket_idx ON autonomy_audit_logs(ticket_id, created_at DESC);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS autonomy_audit_logs_operation_idx ON autonomy_audit_logs(operation_id, created_at DESC);`
  );

  schemaInitialized = true;
}

function mapRow(row: Record<string, unknown>): AutonomyAuditEntry {
  return {
    id: String(row.id || ""),
    tenantId: String(row.tenant_id || ""),
    logId: String(row.log_id || ""),
    ticketId: String(row.ticket_id || ""),
    operationId: String(row.operation_id || ""),
    executionKey: String(row.execution_key || ""),
    eventType: String(row.event_type || "execution.started") as AutonomyAuditEventType,
    decision: String(row.decision || ""),
    reason: String(row.reason || ""),
    details: (row.details_json as Record<string, unknown>) || {},
    createdAt: new Date(String(row.created_at || new Date().toISOString())).toISOString(),
  };
}

export async function appendAutonomyAuditEvent(input: {
  tenantId: string;
  logId?: string;
  ticketId?: string;
  operationId?: string;
  executionKey?: string;
  eventType: AutonomyAuditEventType;
  decision: string;
  reason: string;
  details?: Record<string, unknown>;
}): Promise<AutonomyAuditEntry> {
  const entry: AutonomyAuditEntry = {
    id: randomUUID(),
    tenantId: input.tenantId,
    logId: input.logId || "",
    ticketId: input.ticketId || "",
    operationId: input.operationId || "",
    executionKey: input.executionKey || "",
    eventType: input.eventType,
    decision: input.decision,
    reason: input.reason,
    details: input.details || {},
    createdAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryAudit.set(entry.id, entry);
    return entry;
  }

  await ensureAutonomyAuditSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO autonomy_audit_logs (
        id, tenant_id, log_id, ticket_id, operation_id, execution_key,
        event_type, decision, reason, details_json, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
    `,
    [
      entry.id,
      entry.tenantId,
      entry.logId,
      entry.ticketId,
      entry.operationId,
      entry.executionKey,
      entry.eventType,
      entry.decision,
      entry.reason,
      JSON.stringify(entry.details),
      entry.createdAt,
    ]
  );

  return entry;
}

export async function listAutonomyAuditEvents(input: {
  tenantId: string;
  logId?: string;
  ticketId?: string;
  operationId?: string;
  limit?: number;
}): Promise<AutonomyAuditEntry[]> {
  const limit = Math.max(1, Math.min(500, input.limit || 100));

  if (!hasDatabaseConfig()) {
    const events = Array.from(memoryAudit.values()).filter((entry) => {
      if (entry.tenantId !== input.tenantId) {
        return false;
      }
      if (input.logId && entry.logId !== input.logId) {
        return false;
      }
      if (input.ticketId && entry.ticketId !== input.ticketId) {
        return false;
      }
      if (input.operationId && entry.operationId !== input.operationId) {
        return false;
      }
      return true;
    });

    return events
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  await ensureAutonomyAuditSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM autonomy_audit_logs
      WHERE tenant_id = $1
        AND ($2 = '' OR log_id = $2)
        AND ($3 = '' OR ticket_id = $3)
        AND ($4 = '' OR operation_id = $4)
      ORDER BY created_at DESC
      LIMIT $5;
    `,
    [input.tenantId, input.logId || "", input.ticketId || "", input.operationId || "", limit]
  );

  return result.rows.map((row) => mapRow(row as Record<string, unknown>));
}
