// Demo try limit logic
export const DEMO_TRY_LIMIT = 3;
export const memDemoTries = new Map<string, number>();

export async function getDemoTryCount(identityHash: string): Promise<number> {
  // In-memory only for now; can be extended to persistent store
  return memDemoTries.get(identityHash) || 0;
}

export async function incrementDemoTryCount(identityHash: string): Promise<void> {
  const current = memDemoTries.get(identityHash) || 0;
  memDemoTries.set(identityHash, current + 1);
}
import { createHash } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

export const TRIAL_WINDOW_MS = 60_000;

type MemTrialWindow = {
  ip: string;
  startedAt: number;
  expiresAt: number;
  completedAt: number | null;
};

export interface TrialWindowStatus {
  hasStarted: boolean;
  isActive: boolean;
  isExpired: boolean;
  isBlocked: boolean;
  secondsLeft: number;
  startedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────
const memTrials = new Map<string, MemTrialWindow>();

// ─── Schema ───────────────────────────────────────────────────────────────────
let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady || !hasDatabaseConfig()) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trial_identities (
      identity_hash TEXT PRIMARY KEY,
      ip            TEXT NOT NULL,
      started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at    TIMESTAMPTZ NULL,
      completed_at  TIMESTAMPTZ NULL
    );
    ALTER TABLE trial_identities
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;
    UPDATE trial_identities
      SET expires_at = started_at + INTERVAL '60 seconds'
      WHERE expires_at IS NULL;
  `);
  schemaReady = true;
}

function createEmptyStatus(): TrialWindowStatus {
  return {
    hasStarted: false,
    isActive: false,
    isExpired: false,
    isBlocked: false,
    secondsLeft: Math.ceil(TRIAL_WINDOW_MS / 1000),
    startedAt: null,
    expiresAt: null,
    completedAt: null,
  };
}

function buildStatus(input: {
  startedAt: Date | number | string;
  expiresAt: Date | number | string;
  completedAt?: Date | number | string | null;
}): TrialWindowStatus {
  const startedMs = new Date(input.startedAt).getTime();
  const expiresMs = new Date(input.expiresAt).getTime();
  const completedMs = input.completedAt ? new Date(input.completedAt).getTime() : null;
  const now = Date.now();
  const isCompleted = completedMs !== null;
  const isActive = !isCompleted && expiresMs > now;
  const isExpired = isCompleted || expiresMs <= now;
  const secondsLeft = isActive ? Math.max(1, Math.ceil((expiresMs - now) / 1000)) : 0;

  return {
    hasStarted: true,
    isActive,
    isExpired,
    isBlocked: isExpired,
    secondsLeft,
    startedAt: new Date(startedMs).toISOString(),
    expiresAt: new Date(expiresMs).toISOString(),
    completedAt: completedMs === null ? null : new Date(completedMs).toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a stable, opaque identity hash from an IP address and an optional
 * browser fingerprint string.  Both are normalised before hashing so that minor
 * differences (e.g. IPv6 casing) are collapsed.
 */
export function buildIdentityHash(ip: string, fingerprint: string): string {
  const normIp = ip.trim().toLowerCase();
  const normFp = fingerprint.trim().slice(0, 256); // cap at 256 chars
  return createHash("sha256").update(`${normIp}|${normFp}`).digest("hex");
}

export async function getTrialWindowStatus(identityHash: string): Promise<TrialWindowStatus> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      "SELECT started_at, expires_at, completed_at FROM trial_identities WHERE identity_hash = $1",
      [identityHash]
    );
    if (result.rows.length === 0) {
      return createEmptyStatus();
    }

    const row = result.rows[0];
    return buildStatus({
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      completedAt: row.completed_at,
    });
  }

  const entry = memTrials.get(identityHash);
  if (!entry) {
    return createEmptyStatus();
  }

  return buildStatus({
    startedAt: entry.startedAt,
    expiresAt: entry.expiresAt,
    completedAt: entry.completedAt,
  });
}

/**
 * Starts a new shared demo window for this identity, or returns the existing
 * active window when one is already in progress.
 */
export async function startOrResumeTrialWindow(
  identityHash: string,
  ip: string
): Promise<TrialWindowStatus> {
  const existing = await getTrialWindowStatus(identityHash);
  if (existing.hasStarted) {
    return existing;
  }

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO trial_identities (identity_hash, ip, started_at, expires_at, completed_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '60 seconds', NULL)
       ON CONFLICT (identity_hash) DO NOTHING
       RETURNING started_at, expires_at, completed_at`,
      [identityHash, ip]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return buildStatus({
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        completedAt: row.completed_at,
      });
    }

    return getTrialWindowStatus(identityHash);
  }

  const now = Date.now();
  const entry: MemTrialWindow = {
    ip,
    startedAt: now,
    expiresAt: now + TRIAL_WINDOW_MS,
    completedAt: null,
  };
  memTrials.set(identityHash, entry);
  return buildStatus({
    startedAt: entry.startedAt,
    expiresAt: entry.expiresAt,
    completedAt: entry.completedAt,
  });
}

/**
 * Marks the shared demo window as fully consumed.
 */
export async function recordTrialCompleted(identityHash: string): Promise<void> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    await pool.query(
      `UPDATE trial_identities SET completed_at = NOW()
       WHERE identity_hash = $1 AND completed_at IS NULL`,
      [identityHash]
    );
    return;
  }

  const entry = memTrials.get(identityHash);
  if (entry) entry.completedAt = Date.now();
}

export async function isTrialBlocked(identityHash: string): Promise<boolean> {
  const status = await getTrialWindowStatus(identityHash);
  return status.isBlocked;
}
