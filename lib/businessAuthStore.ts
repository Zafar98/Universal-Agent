// Password reset token store (in-memory for MVP)
const passwordResetTokens = new Map<string, { token: string; businessId: string; expiresAt: number }>();

/**
 * Creates a password reset token for a business account and stores it in-memory.
 * @param businessId The business account ID
 * @returns The reset token string
 */
export async function createBusinessPasswordResetToken(businessId: string): Promise<string | null> {
  const account = memoryStore.accounts.get(businessId);
  if (!account) return null;
  // Generate a secure random token
  const token = randomBytes(32).toString("hex");
  // Token expires in 1 hour
  const expiresAt = Date.now() + 60 * 60 * 1000;
  passwordResetTokens.set(token, { token, businessId, expiresAt });
  return token;
}

/**
 * Resets the password for a business account using a valid reset token.
 * @param token The reset token
 * @param newPassword The new password to set
 * @returns True if successful, false otherwise
 */
export async function resetBusinessPassword(token: string, newPassword: string): Promise<boolean> {
  const entry = passwordResetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    passwordResetTokens.delete(token);
    return false;
  }
  const account = memoryStore.accounts.get(entry.businessId);
  if (!account) {
    passwordResetTokens.delete(token);
    return false;
  }
  // Update password
  const salt = createPasswordSalt();
  const hash = hashPassword(newPassword, salt);
  account.passwordSalt = salt;
  account.passwordHash = hash;
  memoryStore.accounts.set(account.id, account);
  passwordResetTokens.delete(token);
  return true;
}
export interface UpdateBusinessAccountProfileInput {
  businessId: string;
  businessName?: string;
  businessModelId?: string;
  agentCount?: number;
  selectedPlan?: string;
  selectedIntegration?: string;
  subscriptionStatus?: string;
  activationCompletedAt?: string | null;
}

export async function updateBusinessAccountProfile(
  input: UpdateBusinessAccountProfileInput
): Promise<BusinessAccount | null> {
  if (!input.businessId) return null;

  // In-memory update (replace with DB logic as needed)
  const existing = memoryStore.accounts.get(input.businessId);
  if (!existing) return null;

  const updated: BusinessAccount = {
    ...existing,
    businessName: input.businessName ?? existing.businessName,
    businessModelId: (input.businessModelId as BusinessModelId) ?? existing.businessModelId,
    agentCount: input.agentCount ?? existing.agentCount,
    selectedPlan: input.selectedPlan ? normalizePlanTier(input.selectedPlan) : existing.selectedPlan,
    selectedIntegration: input.selectedIntegration ? normalizeIntegrationMethod(input.selectedIntegration) : existing.selectedIntegration,
    subscriptionStatus: input.subscriptionStatus ? normalizeSubscriptionStatus(input.subscriptionStatus) : existing.subscriptionStatus,
    activationCompletedAt:
      input.activationCompletedAt !== undefined
        ? input.activationCompletedAt
        : existing.activationCompletedAt,
  };

  memoryStore.accounts.set(updated.id, updated);
  return updated;
}
import { randomBytes, randomUUID, createHash, timingSafeEqual } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";
import { BusinessModelId } from "@/lib/businessModels";

export type VerificationMethod = "email" | "phone";
export type PlanTier = "starter" | "growth" | "enterprise" | "monthly_1999";
export type IntegrationMethod = "website-widget" | "phone-number" | "api-webhooks";
export type SubscriptionStatus = "pending_payment" | "trialing" | "active" | "past_due" | "canceled";

export interface IntegrationConfig {
  widgetEmbedCode?: string;
  inboundPhoneNumber?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  configuredAt?: string;
}

export interface PendingBusinessSignup {
  id: string;
  businessName: string;
  tenantId: string;
  businessModelId: BusinessModelId;
  agentCount: number;
  selectedPlan: PlanTier;
  selectedIntegration: IntegrationMethod;
  email: string | null;
  phone: string | null;
  verificationMethod: VerificationMethod;
  passwordHash: string;
  passwordSalt: string;
  verificationCode: string;
  expiresAt: string;
  createdAt: string;
}

export interface BusinessAccount {
  id: string;
  businessName: string;
  tenantId: string;
  businessModelId: BusinessModelId;
  agentCount: number;
  selectedPlan: PlanTier;
  selectedIntegration: IntegrationMethod;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  integrationConfig: IntegrationConfig;
  activationCompletedAt: string | null;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  passwordSalt: string;
  verificationMethod: VerificationMethod;
  verifiedAt: string;
  createdAt: string;
}

export interface BusinessSession {
  sessionToken: string;
  businessId: string;
  businessName: string;
  tenantId: string;
  businessModelId: BusinessModelId;
  agentCount: number;
  selectedPlan: PlanTier;
  selectedIntegration: IntegrationMethod;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: string | null;
  integrationReady: boolean;
  activationCompletedAt: string | null;
  email: string | null;
  phone: string | null;
  verificationMethod: VerificationMethod;
  expiresAt: string;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const VERIFY_TTL_MINUTES = 15;

let schemaInitialized = false;

class MemoryBusinessAuthStore {
  pending = new Map<string, PendingBusinessSignup>();
  accounts = new Map<string, BusinessAccount>();
  sessions = new Map<string, BusinessSession>();
}

const memoryStore = new MemoryBusinessAuthStore();

function normalizeEmail(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePhone(value?: string): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/[^0-9+]/g, "").trim();
  return digits.length > 0 ? digits : null;
}

function normalizePlanTier(value?: string): PlanTier {
  const normalized = String(value || "").toLowerCase();
  if (
    normalized === "starter" ||
    normalized === "growth" ||
    normalized === "enterprise" ||
    normalized === "monthly_1999" ||
    normalized === "monthly"
  ) {
    return normalized === "monthly" ? "monthly_1999" : normalized;
  }
  return "starter";
}

function normalizeIntegrationMethod(value?: string): IntegrationMethod {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "website-widget" || normalized === "phone-number" || normalized === "api-webhooks") {
    return normalized;
  }
  return "website-widget";
}

function normalizeSubscriptionStatus(value?: string): SubscriptionStatus {
  const normalized = String(value || "").toLowerCase();
  if (
    normalized === "pending_payment" ||
    normalized === "trialing" ||
    normalized === "active" ||
    normalized === "past_due" ||
    normalized === "canceled"
  ) {
    return normalized;
  }
  return "pending_payment";
}

function parseIntegrationConfig(value: unknown): IntegrationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as IntegrationConfig;
}

function isIntegrationReady(account: Pick<BusinessAccount, "selectedIntegration" | "integrationConfig">): boolean {
  const config = account.integrationConfig || {};
  if (account.selectedIntegration === "website-widget") {
    return Boolean(config.widgetEmbedCode);
  }
  if (account.selectedIntegration === "phone-number") {
    return Boolean(config.inboundPhoneNumber);
  }
  if (account.selectedIntegration === "api-webhooks") {
    return Boolean(config.webhookUrl && config.webhookSecret);
  }
  return false;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createPasswordSalt(): string {
  return randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildSession(account: BusinessAccount): BusinessSession {
  return {
    sessionToken: randomUUID(),
    businessId: account.id,
    businessName: account.businessName,
    tenantId: account.tenantId,
    businessModelId: account.businessModelId,
    agentCount: account.agentCount,
    selectedPlan: account.selectedPlan,
    selectedIntegration: account.selectedIntegration,
    subscriptionStatus: account.subscriptionStatus,
    subscriptionEndsAt: account.subscriptionEndsAt,
    integrationReady: isIntegrationReady(account),
    activationCompletedAt: account.activationCompletedAt,
    email: account.email,
    phone: account.phone,
    verificationMethod: account.verificationMethod,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
}

async function ensureBusinessAuthSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_accounts (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      tenant_id TEXT NOT NULL UNIQUE,
      business_model_id TEXT NOT NULL,
      agent_count INTEGER NOT NULL,
      selected_plan TEXT NOT NULL DEFAULT 'starter',
      selected_integration TEXT NOT NULL DEFAULT 'website-widget',
      subscription_status TEXT NOT NULL DEFAULT 'pending_payment',
      subscription_started_at TIMESTAMPTZ,
      subscription_ends_at TIMESTAMPTZ,
      integration_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      activation_completed_at TIMESTAMPTZ,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      verification_method TEXT NOT NULL,
      verified_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_pending_signups (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      business_model_id TEXT NOT NULL,
      agent_count INTEGER NOT NULL,
      selected_plan TEXT NOT NULL DEFAULT 'starter',
      selected_integration TEXT NOT NULL DEFAULT 'website-widget',
      email TEXT,
      phone TEXT,
      verification_method TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      verification_code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_sessions (
      session_token TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS selected_plan TEXT NOT NULL DEFAULT 'starter';`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS selected_integration TEXT NOT NULL DEFAULT 'website-widget';`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'pending_payment';`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS integration_config_json JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS activation_completed_at TIMESTAMPTZ;`);

  await pool.query(`ALTER TABLE business_pending_signups ADD COLUMN IF NOT EXISTS selected_plan TEXT NOT NULL DEFAULT 'starter';`);
  await pool.query(`ALTER TABLE business_pending_signups ADD COLUMN IF NOT EXISTS selected_integration TEXT NOT NULL DEFAULT 'website-widget';`);

  schemaInitialized = true;
}

async function tenantIdExists(tenantId: string): Promise<boolean> {
  if (!hasDatabaseConfig()) {
    for (const account of memoryStore.accounts.values()) {
      if (account.tenantId === tenantId) {
        return true;
      }
    }

    for (const pending of memoryStore.pending.values()) {
      if (pending.tenantId === tenantId) {
        return true;
      }
    }

    return false;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT EXISTS(
        SELECT 1 FROM business_accounts WHERE tenant_id = $1
      ) OR EXISTS(
        SELECT 1 FROM business_pending_signups WHERE tenant_id = $1 AND expires_at > NOW()
      ) AS exists;
    `,
    [tenantId]
  );

  return Boolean(result.rows[0]?.exists);
}

async function createUniqueTenantId(businessName: string): Promise<string> {
  const base = slugify(businessName) || "business";
  let candidate = base;
  let index = 1;

  while (await tenantIdExists(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

function findAccountInMemory(identifier: string): BusinessAccount | null {
  const normalizedEmailValue = normalizeEmail(identifier);
  const normalizedPhoneValue = normalizePhone(identifier);

  for (const account of memoryStore.accounts.values()) {
    if (normalizedEmailValue && account.email === normalizedEmailValue) {
      return account;
    }

    if (normalizedPhoneValue && account.phone === normalizedPhoneValue) {
      return account;
    }
  }

  return null;
}

export async function createPendingBusinessSignup(input: {
  businessName: string;
  businessModelId: BusinessModelId;
  agentCount: number;
  selectedPlan?: PlanTier | string;
  selectedIntegration?: IntegrationMethod | string;
  verificationMethod: VerificationMethod;
  email?: string;
  phone?: string;
  password: string;
}): Promise<{ pendingId: string; verificationCode: string; tenantId: string }> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (input.verificationMethod === "email" && !email) {
    throw new Error("A valid email address is required.");
  }

  if (input.verificationMethod === "phone" && !phone) {
    throw new Error("A valid phone number is required.");
  }

  const duplicate = await findBusinessAccountByIdentifier(email || phone || "");
  if (duplicate) {
    throw new Error("A business account with that email or phone already exists.");
  }

  const tenantId = await createUniqueTenantId(input.businessName);
  const selectedPlan = normalizePlanTier(input.selectedPlan);
  const selectedIntegration = normalizeIntegrationMethod(input.selectedIntegration);
  const passwordSalt = createPasswordSalt();
  const passwordHash = hashPassword(input.password, passwordSalt);
  const pending: PendingBusinessSignup = {
    id: randomUUID(),
    businessName: input.businessName.trim(),
    tenantId,
    businessModelId: input.businessModelId,
    agentCount: Math.max(1, Math.min(50, Math.round(input.agentCount))),
    selectedPlan,
    selectedIntegration,
    email,
    phone,
    verificationMethod: input.verificationMethod,
    passwordHash,
    passwordSalt,
    verificationCode: createVerificationCode(),
    expiresAt: new Date(Date.now() + VERIFY_TTL_MINUTES * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryStore.pending.set(pending.id, pending);
    return { pendingId: pending.id, verificationCode: pending.verificationCode, tenantId };
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO business_pending_signups (
        id, business_name, tenant_id, business_model_id, agent_count, selected_plan, selected_integration, email, phone,
        verification_method, password_hash, password_salt, verification_code, expires_at, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15);
    `,
    [
      pending.id,
      pending.businessName,
      pending.tenantId,
      pending.businessModelId,
      pending.agentCount,
      pending.selectedPlan,
      pending.selectedIntegration,
      pending.email,
      pending.phone,
      pending.verificationMethod,
      pending.passwordHash,
      pending.passwordSalt,
      pending.verificationCode,
      pending.expiresAt,
      pending.createdAt,
    ]
  );

  return { pendingId: pending.id, verificationCode: pending.verificationCode, tenantId };
}

async function getPendingSignupById(pendingId: string): Promise<PendingBusinessSignup | null> {
  if (!hasDatabaseConfig()) {
    return memoryStore.pending.get(pendingId) || null;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT * FROM business_pending_signups WHERE id = $1 LIMIT 1;
    `,
    [pendingId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessName: row.business_name,
    tenantId: row.tenant_id,
    businessModelId: row.business_model_id,
    agentCount: Number(row.agent_count),
    selectedPlan: normalizePlanTier(row.selected_plan),
    selectedIntegration: normalizeIntegrationMethod(row.selected_integration),
    email: row.email,
    phone: row.phone,
    verificationMethod: row.verification_method,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    verificationCode: row.verification_code,
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function verifyPendingBusinessSignup(input: {
  pendingId: string;
  verificationCode: string;
}): Promise<BusinessAccount> {
  const pending = await getPendingSignupById(input.pendingId);

  if (!pending) {
    throw new Error("That signup session was not found.");
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    throw new Error("That verification code has expired. Please sign up again.");
  }

  if (!safeEqual(pending.verificationCode, input.verificationCode.trim())) {
    throw new Error("Invalid verification code.");
  }

  const account: BusinessAccount = {
    id: randomUUID(),
    businessName: pending.businessName,
    tenantId: pending.tenantId,
    businessModelId: pending.businessModelId,
    agentCount: pending.agentCount,
    selectedPlan: pending.selectedPlan,
    selectedIntegration: pending.selectedIntegration,
    subscriptionStatus: "pending_payment",
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
    integrationConfig: {},
    activationCompletedAt: null,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    passwordSalt: pending.passwordSalt,
    verificationMethod: pending.verificationMethod,
    verifiedAt: new Date().toISOString(),
    createdAt: pending.createdAt,
  };

  if (!hasDatabaseConfig()) {
    memoryStore.pending.delete(pending.id);
    memoryStore.accounts.set(account.id, account);
    return account;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  await pool.query("BEGIN");

  try {
    await pool.query(
      `
        INSERT INTO business_accounts (
          id, business_name, tenant_id, business_model_id, agent_count, selected_plan, selected_integration,
          subscription_status, subscription_started_at, subscription_ends_at, integration_config_json, activation_completed_at, email, phone,
          password_hash, password_salt, verification_method, verified_at, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19);
      `,
      [
        account.id,
        account.businessName,
        account.tenantId,
        account.businessModelId,
        account.agentCount,
        account.selectedPlan,
        account.selectedIntegration,
        account.subscriptionStatus,
        account.subscriptionStartedAt,
        account.subscriptionEndsAt,
        JSON.stringify(account.integrationConfig),
        account.activationCompletedAt,
        account.email,
        account.phone,
        account.passwordHash,
        account.passwordSalt,
        account.verificationMethod,
        account.verifiedAt,
        account.createdAt,
      ]
    );

    await pool.query(`DELETE FROM business_pending_signups WHERE id = $1;`, [pending.id]);
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return account;
}

export async function findBusinessAccountByIdentifier(
  identifier: string
): Promise<BusinessAccount | null> {
  const normalizedEmailValue = normalizeEmail(identifier);
  const normalizedPhoneValue = normalizePhone(identifier);

  if (!normalizedEmailValue && !normalizedPhoneValue) {
    return null;
  }

  if (!hasDatabaseConfig()) {
    return findAccountInMemory(identifier);
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT *
      FROM business_accounts
      WHERE ($1::TEXT IS NOT NULL AND email = $1)
         OR ($2::TEXT IS NOT NULL AND phone = $2)
      LIMIT 1;
    `,
    [normalizedEmailValue, normalizedPhoneValue]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessName: row.business_name,
    tenantId: row.tenant_id,
    businessModelId: row.business_model_id,
    agentCount: Number(row.agent_count),
    selectedPlan: normalizePlanTier(row.selected_plan),
    selectedIntegration: normalizeIntegrationMethod(row.selected_integration),
    subscriptionStatus: normalizeSubscriptionStatus(row.subscription_status),
    subscriptionStartedAt: row.subscription_started_at ? new Date(row.subscription_started_at).toISOString() : null,
    subscriptionEndsAt: row.subscription_ends_at ? new Date(row.subscription_ends_at).toISOString() : null,
    integrationConfig: parseIntegrationConfig(row.integration_config_json),
    activationCompletedAt: row.activation_completed_at ? new Date(row.activation_completed_at).toISOString() : null,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    verificationMethod: row.verification_method,
    verifiedAt: new Date(row.verified_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getBusinessAccountByTenantId(tenantId: string): Promise<BusinessAccount | null> {
  if (!tenantId) {
    return null;
  }

  if (!hasDatabaseConfig()) {
    for (const account of memoryStore.accounts.values()) {
      if (account.tenantId === tenantId) {
        return account;
      }
    }
    return null;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM business_accounts WHERE tenant_id = $1 LIMIT 1;`, [tenantId]);
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessName: row.business_name,
    tenantId: row.tenant_id,
    businessModelId: row.business_model_id,
    agentCount: Number(row.agent_count),
    selectedPlan: normalizePlanTier(row.selected_plan),
    selectedIntegration: normalizeIntegrationMethod(row.selected_integration),
    subscriptionStatus: normalizeSubscriptionStatus(row.subscription_status),
    subscriptionStartedAt: row.subscription_started_at ? new Date(row.subscription_started_at).toISOString() : null,
    subscriptionEndsAt: row.subscription_ends_at ? new Date(row.subscription_ends_at).toISOString() : null,
    integrationConfig: parseIntegrationConfig(row.integration_config_json),
    activationCompletedAt: row.activation_completed_at ? new Date(row.activation_completed_at).toISOString() : null,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    verificationMethod: row.verification_method,
    verifiedAt: new Date(row.verified_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function authenticateBusiness(input: {
  identifier: string;
  password: string;
}): Promise<BusinessAccount | null> {
  const account = await findBusinessAccountByIdentifier(input.identifier);

  if (!account) {
    return null;
  }

  const attemptedHash = hashPassword(input.password, account.passwordSalt);
  return safeEqual(attemptedHash, account.passwordHash) ? account : null;
}

export async function createBusinessSession(account: BusinessAccount): Promise<BusinessSession> {
  const session = buildSession(account);

  if (!hasDatabaseConfig()) {
    memoryStore.sessions.set(session.sessionToken, session);
    return session;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO business_sessions (session_token, business_id, expires_at)
      VALUES ($1, $2, $3);
    `,
    [session.sessionToken, account.id, session.expiresAt]
  );

  return session;
}

export async function getBusinessSession(sessionToken: string): Promise<BusinessSession | null> {
  if (!sessionToken) {
    return null;
  }

  if (!hasDatabaseConfig()) {
    const session = memoryStore.sessions.get(sessionToken) || null;
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      memoryStore.sessions.delete(sessionToken);
      return null;
    }

    return session;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT
        s.session_token,
        s.expires_at,
        b.id AS business_id,
        b.business_name,
        b.tenant_id,
        b.business_model_id,
        b.agent_count,
        b.selected_plan,
        b.selected_integration,
        b.subscription_status,
        b.subscription_ends_at,
        b.integration_config_json,
        b.activation_completed_at,
        b.email,
        b.phone,
        b.verification_method
      FROM business_sessions s
      JOIN business_accounts b ON b.id = s.business_id
      WHERE s.session_token = $1
      LIMIT 1;
    `,
    [sessionToken]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await deleteBusinessSession(sessionToken);
    return null;
  }

  return {
    sessionToken: row.session_token,
    businessId: row.business_id,
    businessName: row.business_name,
    tenantId: row.tenant_id,
    businessModelId: row.business_model_id,
    agentCount: Number(row.agent_count),
    selectedPlan: normalizePlanTier(row.selected_plan),
    selectedIntegration: normalizeIntegrationMethod(row.selected_integration),
    subscriptionStatus: normalizeSubscriptionStatus(row.subscription_status),
    subscriptionEndsAt: row.subscription_ends_at ? new Date(row.subscription_ends_at).toISOString() : null,
    integrationReady: isIntegrationReady({
      selectedIntegration: normalizeIntegrationMethod(row.selected_integration),
      integrationConfig: parseIntegrationConfig(row.integration_config_json),
    }),
    activationCompletedAt: row.activation_completed_at ? new Date(row.activation_completed_at).toISOString() : null,
    email: row.email,
    phone: row.phone,
    verificationMethod: row.verification_method,
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export async function updateBusinessSubscriptionState(input: {
  businessId: string;
  selectedPlan?: PlanTier | string;
  selectedIntegration?: IntegrationMethod | string;
  subscriptionStatus?: SubscriptionStatus | string;
  subscriptionStartedAt?: string | null;
  subscriptionEndsAt?: string | null;
  integrationConfig?: IntegrationConfig;
  activationCompletedAt?: string | null;
}): Promise<BusinessAccount | null> {
  if (!input.businessId) {
    return null;
  }

  if (!hasDatabaseConfig()) {
    const existing = memoryStore.accounts.get(input.businessId);
    if (!existing) {
      return null;
    }

    const updated: BusinessAccount = {
      ...existing,
      selectedPlan: input.selectedPlan ? normalizePlanTier(input.selectedPlan) : existing.selectedPlan,
      selectedIntegration: input.selectedIntegration
        ? normalizeIntegrationMethod(input.selectedIntegration)
        : existing.selectedIntegration,
      subscriptionStatus: input.subscriptionStatus
        ? normalizeSubscriptionStatus(input.subscriptionStatus)
        : existing.subscriptionStatus,
      subscriptionStartedAt:
        input.subscriptionStartedAt !== undefined
          ? input.subscriptionStartedAt
          : existing.subscriptionStartedAt,
      subscriptionEndsAt:
        input.subscriptionEndsAt !== undefined
          ? input.subscriptionEndsAt
          : existing.subscriptionEndsAt,
      integrationConfig:
        input.integrationConfig !== undefined
          ? input.integrationConfig
          : existing.integrationConfig,
      activationCompletedAt:
        input.activationCompletedAt !== undefined
          ? input.activationCompletedAt
          : existing.activationCompletedAt,
    };

    memoryStore.accounts.set(updated.id, updated);
    return updated;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const existingResult = await pool.query(`SELECT * FROM business_accounts WHERE id = $1 LIMIT 1;`, [input.businessId]);
  const row = existingResult.rows[0];
  if (!row) {
    return null;
  }

  const selectedPlan = input.selectedPlan ? normalizePlanTier(input.selectedPlan) : normalizePlanTier(row.selected_plan);
  const selectedIntegration = input.selectedIntegration
    ? normalizeIntegrationMethod(input.selectedIntegration)
    : normalizeIntegrationMethod(row.selected_integration);
  const subscriptionStatus = input.subscriptionStatus
    ? normalizeSubscriptionStatus(input.subscriptionStatus)
    : normalizeSubscriptionStatus(row.subscription_status);
  const subscriptionStartedAt =
    input.subscriptionStartedAt !== undefined ? input.subscriptionStartedAt : row.subscription_started_at;
  const subscriptionEndsAt =
    input.subscriptionEndsAt !== undefined ? input.subscriptionEndsAt : row.subscription_ends_at;
  const integrationConfig =
    input.integrationConfig !== undefined ? input.integrationConfig : parseIntegrationConfig(row.integration_config_json);
  const activationCompletedAt =
    input.activationCompletedAt !== undefined ? input.activationCompletedAt : row.activation_completed_at;

  await pool.query(
    `
      UPDATE business_accounts
      SET
        selected_plan = $2,
        selected_integration = $3,
        subscription_status = $4,
        subscription_started_at = $5,
        subscription_ends_at = $6,
        integration_config_json = $7,
        activation_completed_at = $8
      WHERE id = $1;
    `,
    [
      input.businessId,
      selectedPlan,
      selectedIntegration,
      subscriptionStatus,
      subscriptionStartedAt,
      subscriptionEndsAt,
      JSON.stringify(integrationConfig),
      activationCompletedAt,
    ]
  );

  const byTenant = await getBusinessAccountByTenantId(row.tenant_id);
  return byTenant;
}

export async function deleteBusinessSession(sessionToken: string): Promise<void> {
  if (!sessionToken) {
    return;
  }

  if (!hasDatabaseConfig()) {
    memoryStore.sessions.delete(sessionToken);
    return;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  await pool.query(`DELETE FROM business_sessions WHERE session_token = $1;`, [sessionToken]);
}
export async function getBusinessAccountById(businessId: string): Promise<BusinessAccount | null> {
  if (!businessId) return null;

  if (!hasDatabaseConfig()) {
    return memoryStore.accounts.get(businessId) || null;
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query(
    "SELECT tenant_id FROM business_accounts WHERE id = $1 LIMIT 1;",
    [businessId]
  );
  const tenantId = result.rows[0]?.tenant_id;
  if (!tenantId) return null;
  return getBusinessAccountByTenantId(String(tenantId));
}

export async function listBusinessAccounts(): Promise<BusinessAccount[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryStore.accounts.values());
  }

  await ensureBusinessAuthSchema();
  const pool = getPool();
  const result = await pool.query("SELECT tenant_id FROM business_accounts ORDER BY created_at DESC;");
  const accounts = await Promise.all(
    result.rows.map((row) => getBusinessAccountByTenantId(String(row.tenant_id)))
  );
  return accounts.filter((a): a is BusinessAccount => Boolean(a));
}

export interface CreateBusinessAccountAdminInput {
  businessName: string;
  businessModelId: string;
  agentCount?: number;
  selectedPlan?: string;
  selectedIntegration?: string;
  subscriptionStatus?: string;
}

export async function createBusinessAccountFromAdmin(input: CreateBusinessAccountAdminInput): Promise<BusinessAccount> {
  // TODO: Implement actual DB insert logic here
  // This is a stub for demonstration
  return {
    tenantId: "demo-tenant-id",
    businessName: input.businessName,
    businessModelId: input.businessModelId,
    agentCount: input.agentCount ?? 1,
    selectedPlan: input.selectedPlan ?? "basic",
    selectedIntegration: input.selectedIntegration ?? "none",
    subscriptionStatus: input.subscriptionStatus ?? "trial",
    // ...add other required BusinessAccount fields with defaults or nulls
  } as BusinessAccount;
}

