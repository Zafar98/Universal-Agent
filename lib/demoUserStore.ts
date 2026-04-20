import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  hasUsedDemo: boolean;
  subscribed: boolean;
  createdAt: string;
}

export interface DemoSession {
  sessionToken: string;
  userId: string;
  email: string;
  hasUsedDemo: boolean;
  subscribed: boolean;
  expiresAt: string;
}

export const DEMO_COOKIE_NAME = "demo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ─── In-memory store ──────────────────────────────────────────────────────────
const memUsers = new Map<string, DemoUser>();
const memSessions = new Map<string, DemoSession>();

// ─── Password helpers ─────────────────────────────────────────────────────────
function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return randomBytes(32).toString("hex");
}

function generateToken(): string {
  return randomBytes(48).toString("hex");
}

function generateId(): string {
  return randomBytes(16).toString("hex");
}

// ─── Schema ───────────────────────────────────────────────────────────────────
let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady || !hasDatabaseConfig()) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demo_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      has_used_demo BOOLEAN NOT NULL DEFAULT FALSE,
      subscribed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS demo_sessions (
      session_token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      has_used_demo BOOLEAN NOT NULL DEFAULT FALSE,
      subscribed BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);
  schemaReady = true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createDemoUser(
  email: string,
  password: string
): Promise<{ user: DemoUser } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "A valid email address is required." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const exists = await pool.query("SELECT id FROM demo_users WHERE email = $1", [normalizedEmail]);
    if (exists.rows.length > 0) return { error: "An account with that email already exists." };

    const id = generateId();
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO demo_users (id, email, password_hash, password_salt, has_used_demo, subscribed, created_at)
       VALUES ($1, $2, $3, $4, false, false, $5)`,
      [id, normalizedEmail, hash, salt, now]
    );

    const user: DemoUser = {
      id,
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      hasUsedDemo: false,
      subscribed: false,
      createdAt: now,
    };
    return { user };
  }

  // Memory fallback
  for (const u of memUsers.values()) {
    if (u.email === normalizedEmail) return { error: "An account with that email already exists." };
  }
  const id = generateId();
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const user: DemoUser = {
    id,
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    hasUsedDemo: false,
    subscribed: false,
    createdAt: now,
  };
  memUsers.set(id, user);
  return { user };
}

export async function authenticateDemoUser(
  email: string,
  password: string
): Promise<{ user: DemoUser } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query("SELECT * FROM demo_users WHERE email = $1", [normalizedEmail]);
    if (result.rows.length === 0) return { error: "Invalid email or password." };

    const row = result.rows[0];
    const expected = hashPassword(password, row.password_salt);
    const actual = Buffer.from(row.password_hash, "hex");
    const match = timingSafeEqual(Buffer.from(expected, "hex"), actual);
    if (!match) return { error: "Invalid email or password." };

    const user: DemoUser = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      hasUsedDemo: row.has_used_demo,
      subscribed: row.subscribed,
      createdAt: row.created_at,
    };
    return { user };
  }

  // Memory fallback
  let found: DemoUser | null = null;
  for (const u of memUsers.values()) {
    if (u.email === normalizedEmail) { found = u; break; }
  }
  if (!found) return { error: "Invalid email or password." };

  const expected = hashPassword(password, found.passwordSalt);
  const match = timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(found.passwordHash, "hex"));
  if (!match) return { error: "Invalid email or password." };

  return { user: found };
}

export async function createDemoSession(user: DemoUser): Promise<DemoSession> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const session: DemoSession = {
    sessionToken: token,
    userId: user.id,
    email: user.email,
    hasUsedDemo: user.hasUsedDemo,
    subscribed: user.subscribed,
    expiresAt,
  };

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    await pool.query(
      `INSERT INTO demo_sessions (session_token, user_id, email, has_used_demo, subscribed, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [token, user.id, user.email, user.hasUsedDemo, user.subscribed, expiresAt]
    );
    return session;
  }

  memSessions.set(token, session);
  return session;
}

export async function getDemoSession(token: string): Promise<DemoSession | null> {
  if (!token) return null;

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM demo_sessions WHERE session_token = $1 AND expires_at > NOW()",
      [token]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      sessionToken: row.session_token,
      userId: row.user_id,
      email: row.email,
      hasUsedDemo: row.has_used_demo,
      subscribed: row.subscribed,
      expiresAt: row.expires_at,
    };
  }

  const session = memSessions.get(token);
  if (!session || new Date(session.expiresAt) <= new Date()) return null;
  return session;
}

export async function deleteDemoSession(token: string): Promise<void> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    await pool.query("DELETE FROM demo_sessions WHERE session_token = $1", [token]);
    return;
  }
  memSessions.delete(token);
}

export async function markDemoUsed(userId: string): Promise<void> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    await pool.query("UPDATE demo_users SET has_used_demo = true WHERE id = $1", [userId]);
    await pool.query(
      "UPDATE demo_sessions SET has_used_demo = true WHERE user_id = $1",
      [userId]
    );
    return;
  }
  const user = memUsers.get(userId);
  if (user) user.hasUsedDemo = true;
  for (const session of memSessions.values()) {
    if (session.userId === userId) session.hasUsedDemo = true;
  }
}

export async function activateSubscription(userId: string): Promise<void> {
  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    await pool.query("UPDATE demo_users SET subscribed = true WHERE id = $1", [userId]);
    await pool.query(
      "UPDATE demo_sessions SET subscribed = true WHERE user_id = $1",
      [userId]
    );
    return;
  }
  const user = memUsers.get(userId);
  if (user) user.subscribed = true;
  for (const session of memSessions.values()) {
    if (session.userId === userId) session.subscribed = true;
  }
}

export async function demoUserExistsByEmail(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  if (hasDatabaseConfig()) {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query("SELECT 1 FROM demo_users WHERE email = $1 LIMIT 1", [
      normalizedEmail,
    ]);
    return result.rows.length > 0;
  }

  for (const user of memUsers.values()) {
    if (user.email === normalizedEmail) {
      return true;
    }
  }

  return false;
}
