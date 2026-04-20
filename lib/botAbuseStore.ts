import { createHash, randomUUID } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

export type BlockedIdentityType = "ip" | "fingerprint" | "user_agent" | "email_domain";

export type BlockedIdentity = {
  id: string;
  identityType: BlockedIdentityType;
  identityValueHash: string;
  reason: string;
  severity: "medium" | "high";
  source: string;
  blockedAt: string;
  blockedBy: string;
  unblockedAt: string | null;
  notes: string | null;
};

export type BotRiskEvent = {
  id: string;
  ip: string;
  fingerprintHash: string | null;
  userAgentHash: string | null;
  route: string;
  signalType: string;
  score: number;
  details: Record<string, unknown>;
  createdAt: string;
};

type BlockIdentityInput = {
  identityType: BlockedIdentityType;
  identityValue: string;
  reason: string;
  severity: "medium" | "high";
  source: string;
  blockedBy?: string;
  notes?: string;
};

type RiskEventInput = {
  ip: string;
  fingerprint?: string;
  userAgent?: string;
  route: string;
  signalType: string;
  score: number;
  details?: Record<string, unknown>;
};

const RISK_LOOKBACK_HOURS = 24;
let schemaReady = false;

class MemoryBotAbuseStore {
  riskEvents: BotRiskEvent[] = [];
  blocked: BlockedIdentity[] = [];
}

const memoryStore = new MemoryBotAbuseStore();

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function hashIdentity(value: string): string {
  return createHash("sha256").update(normalize(value)).digest("hex");
}

async function ensureSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaReady) {
    return;
  }

  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_risk_events (
      id TEXT PRIMARY KEY,
      ip TEXT NOT NULL,
      fingerprint_hash TEXT,
      user_agent_hash TEXT,
      route TEXT NOT NULL,
      signal_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocked_identities (
      id TEXT PRIMARY KEY,
      identity_type TEXT NOT NULL,
      identity_value_hash TEXT NOT NULL,
      reason TEXT NOT NULL,
      severity TEXT NOT NULL,
      source TEXT NOT NULL,
      blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      blocked_by TEXT NOT NULL DEFAULT 'system',
      unblocked_at TIMESTAMPTZ,
      notes TEXT
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bot_risk_events_ip_created
    ON bot_risk_events (ip, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_blocked_identities_lookup
    ON blocked_identities (identity_type, identity_value_hash, blocked_at DESC);
  `);

  schemaReady = true;
}

export async function recordBotRiskEvent(input: RiskEventInput): Promise<BotRiskEvent> {
  const entry: BotRiskEvent = {
    id: randomUUID(),
    ip: String(input.ip || "unknown"),
    fingerprintHash: input.fingerprint ? hashIdentity(input.fingerprint) : null,
    userAgentHash: input.userAgent ? hashIdentity(input.userAgent) : null,
    route: input.route,
    signalType: input.signalType,
    score: Math.max(0, Math.floor(input.score || 0)),
    details: input.details || {},
    createdAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryStore.riskEvents.unshift(entry);
    memoryStore.riskEvents = memoryStore.riskEvents.slice(0, 3000);
    return entry;
  }

  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO bot_risk_events (
        id, ip, fingerprint_hash, user_agent_hash, route, signal_type, score, details_json, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
    `,
    [
      entry.id,
      entry.ip,
      entry.fingerprintHash,
      entry.userAgentHash,
      entry.route,
      entry.signalType,
      entry.score,
      JSON.stringify(entry.details),
      entry.createdAt,
    ]
  );

  return entry;
}

export async function blockIdentity(input: BlockIdentityInput): Promise<BlockedIdentity> {
  const row: BlockedIdentity = {
    id: randomUUID(),
    identityType: input.identityType,
    identityValueHash: hashIdentity(input.identityValue),
    reason: input.reason,
    severity: input.severity,
    source: input.source,
    blockedAt: new Date().toISOString(),
    blockedBy: input.blockedBy || "system",
    unblockedAt: null,
    notes: input.notes || null,
  };

  if (!hasDatabaseConfig()) {
    const existing = memoryStore.blocked.find(
      (item) =>
        item.identityType === row.identityType &&
        item.identityValueHash === row.identityValueHash &&
        item.unblockedAt === null
    );
    if (existing) {
      return existing;
    }
    memoryStore.blocked.unshift(row);
    return row;
  }

  await ensureSchema();
  const pool = getPool();

  const existing = await pool.query(
    `
      SELECT id, identity_type, identity_value_hash, reason, severity, source, blocked_at, blocked_by, unblocked_at, notes
      FROM blocked_identities
      WHERE identity_type = $1
        AND identity_value_hash = $2
        AND unblocked_at IS NULL
      ORDER BY blocked_at DESC
      LIMIT 1;
    `,
    [row.identityType, row.identityValueHash]
  );

  if (existing.rows[0]) {
    const found = existing.rows[0];
    return {
      id: found.id,
      identityType: found.identity_type,
      identityValueHash: found.identity_value_hash,
      reason: found.reason,
      severity: found.severity,
      source: found.source,
      blockedAt: found.blocked_at,
      blockedBy: found.blocked_by,
      unblockedAt: found.unblocked_at,
      notes: found.notes,
    };
  }

  await pool.query(
    `
      INSERT INTO blocked_identities (
        id, identity_type, identity_value_hash, reason, severity, source, blocked_at, blocked_by, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
    `,
    [
      row.id,
      row.identityType,
      row.identityValueHash,
      row.reason,
      row.severity,
      row.source,
      row.blockedAt,
      row.blockedBy,
      row.notes,
    ]
  );

  return row;
}

export async function unblockIdentity(id: string, actor = "admin"): Promise<boolean> {
  if (!id) {
    return false;
  }

  if (!hasDatabaseConfig()) {
    const target = memoryStore.blocked.find((row) => row.id === id && row.unblockedAt === null);
    if (!target) {
      return false;
    }
    target.unblockedAt = new Date().toISOString();
    target.notes = target.notes ? `${target.notes}\nUnblocked by ${actor}` : `Unblocked by ${actor}`;
    return true;
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE blocked_identities
      SET unblocked_at = NOW(),
          notes = COALESCE(notes || E'\n', '') || $2
      WHERE id = $1
        AND unblocked_at IS NULL;
    `,
    [id, `Unblocked by ${actor}`]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listBlockedIdentities(limit = 200): Promise<BlockedIdentity[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));

  if (!hasDatabaseConfig()) {
    return memoryStore.blocked.slice(0, safeLimit);
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, identity_type, identity_value_hash, reason, severity, source, blocked_at, blocked_by, unblocked_at, notes
      FROM blocked_identities
      ORDER BY blocked_at DESC
      LIMIT $1;
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    identityType: row.identity_type,
    identityValueHash: row.identity_value_hash,
    reason: row.reason,
    severity: row.severity,
    source: row.source,
    blockedAt: row.blocked_at,
    blockedBy: row.blocked_by,
    unblockedAt: row.unblocked_at,
    notes: row.notes,
  }));
}

export async function listRecentBotRiskEvents(limit = 300): Promise<BotRiskEvent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 1000));

  if (!hasDatabaseConfig()) {
    return memoryStore.riskEvents.slice(0, safeLimit);
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, ip, fingerprint_hash, user_agent_hash, route, signal_type, score, details_json, created_at
      FROM bot_risk_events
      ORDER BY created_at DESC
      LIMIT $1;
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ip: row.ip,
    fingerprintHash: row.fingerprint_hash,
    userAgentHash: row.user_agent_hash,
    route: row.route,
    signalType: row.signal_type,
    score: Number(row.score || 0),
    details: (row.details_json || {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

export async function getRecentRiskScoreForIp(ip: string): Promise<number> {
  const normalizedIp = String(ip || "unknown");
  const cutoff = new Date(Date.now() - RISK_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  if (!hasDatabaseConfig()) {
    return memoryStore.riskEvents
      .filter((event) => event.ip === normalizedIp && event.createdAt >= cutoff)
      .reduce((sum, event) => sum + event.score, 0);
  }

  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT COALESCE(SUM(score), 0) AS total
      FROM bot_risk_events
      WHERE ip = $1
        AND created_at >= $2;
    `,
    [normalizedIp, cutoff]
  );

  return Number(result.rows[0]?.total || 0);
}

export async function isRequestIdentityBlocked(input: {
  ip?: string;
  fingerprint?: string;
  userAgent?: string;
}): Promise<boolean> {
  const candidates: Array<{ identityType: BlockedIdentityType; valueHash: string }> = [];

  if (input.ip) {
    candidates.push({ identityType: "ip", valueHash: hashIdentity(input.ip) });
  }
  if (input.fingerprint) {
    candidates.push({ identityType: "fingerprint", valueHash: hashIdentity(input.fingerprint) });
  }
  if (input.userAgent) {
    candidates.push({ identityType: "user_agent", valueHash: hashIdentity(input.userAgent) });
  }

  if (candidates.length === 0) {
    return false;
  }

  if (!hasDatabaseConfig()) {
    return candidates.some((candidate) =>
      memoryStore.blocked.some(
        (row) =>
          row.identityType === candidate.identityType &&
          row.identityValueHash === candidate.valueHash &&
          row.unblockedAt === null
      )
    );
  }

  await ensureSchema();
  const pool = getPool();

  for (const candidate of candidates) {
    const result = await pool.query(
      `
        SELECT 1
        FROM blocked_identities
        WHERE identity_type = $1
          AND identity_value_hash = $2
          AND unblocked_at IS NULL
        LIMIT 1;
      `,
      [candidate.identityType, candidate.valueHash]
    );
    if (result.rows[0]) {
      return true;
    }
  }

  return false;
}
