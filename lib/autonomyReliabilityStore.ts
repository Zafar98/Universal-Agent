import { randomUUID } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

type ExecutionStatus = "in_progress" | "completed" | "failed";
type RetryJobStatus = "queued" | "processing" | "completed" | "dead";

export type AutonomyRetryJob = {
  id: string;
  executionKey: string;
  tenantId: string;
  logId: string;
  ticketId: string;
  webhookUrl: string;
  payload: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
  status: RetryJobStatus;
  nextRetryAt: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
};

const memoryExecutionLocks = new Map<
  string,
  {
    tenantId: string;
    logId: string;
    ticketId: string;
    operationId: string;
    status: ExecutionStatus;
    lastError: string;
    createdAt: string;
    updatedAt: string;
  }
>();

const memoryRetryJobs = new Map<string, AutonomyRetryJob>();

let schemaInitialized = false;

function mapRetryRow(row: Record<string, unknown>): AutonomyRetryJob {
  return {
    id: String(row.id),
    executionKey: String(row.execution_key),
    tenantId: String(row.tenant_id),
    logId: String(row.log_id),
    ticketId: String(row.ticket_id),
    webhookUrl: String(row.webhook_url),
    payload:
      row.payload_json && typeof row.payload_json === "object"
        ? (row.payload_json as Record<string, unknown>)
        : {},
    attemptCount: Number(row.attempt_count || 0),
    maxAttempts: Number(row.max_attempts || 0),
    status: String(row.status) as RetryJobStatus,
    nextRetryAt: new Date(String(row.next_retry_at)).toISOString(),
    lastError: String(row.last_error || ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function ensureAutonomyReliabilitySchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS autonomy_execution_locks (
      execution_key TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      log_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      operation_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'in_progress',
      last_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS autonomy_retry_jobs (
      id TEXT PRIMARY KEY,
      execution_key TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      log_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      payload_json JSONB NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 6,
      status TEXT NOT NULL DEFAULT 'queued',
      next_retry_at TIMESTAMPTZ NOT NULL,
      last_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS autonomy_retry_jobs_status_next_retry_idx ON autonomy_retry_jobs(status, next_retry_at);`
  );

  schemaInitialized = true;
}

export async function tryAcquireExecutionLock(input: {
  executionKey: string;
  tenantId: string;
  logId: string;
  ticketId: string;
  operationId: string;
}): Promise<boolean> {
  const now = new Date().toISOString();

  if (!hasDatabaseConfig()) {
    if (memoryExecutionLocks.has(input.executionKey)) {
      return false;
    }

    memoryExecutionLocks.set(input.executionKey, {
      tenantId: input.tenantId,
      logId: input.logId,
      ticketId: input.ticketId,
      operationId: input.operationId,
      status: "in_progress",
      lastError: "",
      createdAt: now,
      updatedAt: now,
    });

    return true;
  }

  await ensureAutonomyReliabilitySchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO autonomy_execution_locks (
        execution_key, tenant_id, log_id, ticket_id, operation_id, status, last_error
      ) VALUES ($1,$2,$3,$4,$5,'in_progress','')
      ON CONFLICT (execution_key) DO NOTHING
      RETURNING execution_key;
    `,
    [input.executionKey, input.tenantId, input.logId, input.ticketId, input.operationId]
  );

  return Boolean(result.rows[0]);
}

export async function updateExecutionLock(input: {
  executionKey: string;
  status: ExecutionStatus;
  lastError?: string;
}): Promise<void> {
  const now = new Date().toISOString();

  if (!hasDatabaseConfig()) {
    const existing = memoryExecutionLocks.get(input.executionKey);
    if (!existing) {
      return;
    }

    memoryExecutionLocks.set(input.executionKey, {
      ...existing,
      status: input.status,
      lastError: input.lastError || "",
      updatedAt: now,
    });

    return;
  }

  await ensureAutonomyReliabilitySchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE autonomy_execution_locks
      SET status = $2, last_error = $3, updated_at = NOW()
      WHERE execution_key = $1;
    `,
    [input.executionKey, input.status, input.lastError || ""]
  );
}

export async function enqueueAutonomyRetryJob(input: {
  executionKey: string;
  tenantId: string;
  logId: string;
  ticketId: string;
  webhookUrl: string;
  payload: Record<string, unknown>;
  lastError: string;
  currentAttempt: number;
  maxAttempts: number;
  nextRetryAt: string;
}): Promise<void> {
  const now = new Date().toISOString();

  if (!hasDatabaseConfig()) {
    const id = randomUUID();
    memoryRetryJobs.set(id, {
      id,
      executionKey: input.executionKey,
      tenantId: input.tenantId,
      logId: input.logId,
      ticketId: input.ticketId,
      webhookUrl: input.webhookUrl,
      payload: input.payload,
      attemptCount: input.currentAttempt,
      maxAttempts: input.maxAttempts,
      status: "queued",
      nextRetryAt: input.nextRetryAt,
      lastError: input.lastError,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await ensureAutonomyReliabilitySchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO autonomy_retry_jobs (
        id, execution_key, tenant_id, log_id, ticket_id, webhook_url,
        payload_json, attempt_count, max_attempts, status, next_retry_at, last_error
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'queued',$10,$11);
    `,
    [
      randomUUID(),
      input.executionKey,
      input.tenantId,
      input.logId,
      input.ticketId,
      input.webhookUrl,
      JSON.stringify(input.payload),
      input.currentAttempt,
      input.maxAttempts,
      input.nextRetryAt,
      input.lastError,
    ]
  );
}

export async function claimDueAutonomyRetryJobs(limit = 3): Promise<AutonomyRetryJob[]> {
  const nowMs = Date.now();

  if (!hasDatabaseConfig()) {
    const due = Array.from(memoryRetryJobs.values())
      .filter((job) => job.status === "queued" && new Date(job.nextRetryAt).getTime() <= nowMs)
      .sort((a, b) => new Date(a.nextRetryAt).getTime() - new Date(b.nextRetryAt).getTime())
      .slice(0, Math.max(limit, 1));

    due.forEach((job) => {
      memoryRetryJobs.set(job.id, { ...job, status: "processing", updatedAt: new Date().toISOString() });
    });

    return due.map((job) => ({ ...job, status: "processing" }));
  }

  await ensureAutonomyReliabilitySchema();
  const pool = getPool();
  const result = await pool.query(
    `
      WITH due AS (
        SELECT id
        FROM autonomy_retry_jobs
        WHERE status = 'queued' AND next_retry_at <= NOW()
        ORDER BY next_retry_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE autonomy_retry_jobs jobs
      SET status = 'processing', updated_at = NOW()
      FROM due
      WHERE jobs.id = due.id
      RETURNING jobs.*;
    `,
    [Math.max(limit, 1)]
  );

  return result.rows.map((row) => mapRetryRow(row));
}

export async function resolveAutonomyRetryJob(input: {
  id: string;
  status: "completed" | "queued" | "dead";
  attemptCount: number;
  nextRetryAt?: string;
  lastError?: string;
}): Promise<void> {
  const now = new Date().toISOString();

  if (!hasDatabaseConfig()) {
    const existing = memoryRetryJobs.get(input.id);
    if (!existing) {
      return;
    }

    memoryRetryJobs.set(input.id, {
      ...existing,
      status: input.status,
      attemptCount: input.attemptCount,
      nextRetryAt: input.nextRetryAt || existing.nextRetryAt,
      lastError: input.lastError || "",
      updatedAt: now,
    });

    return;
  }

  await ensureAutonomyReliabilitySchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE autonomy_retry_jobs
      SET
        status = $2,
        attempt_count = $3,
        next_retry_at = COALESCE($4::timestamptz, next_retry_at),
        last_error = $5,
        updated_at = NOW()
      WHERE id = $1;
    `,
    [input.id, input.status, input.attemptCount, input.nextRetryAt || null, input.lastError || ""]
  );
}
