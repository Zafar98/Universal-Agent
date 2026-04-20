import { getPool, hasDatabaseConfig } from "@/lib/postgres";
import { BusinessModelId, TenantConfig, buildTenantConfigFromBusiness } from "@/lib/businessModels";

export interface BusinessWorkspace extends TenantConfig {
  createdAt: string;
  updatedAt: string;
}

let schemaInitialized = false;
const memoryWorkspaces = new Map<string, BusinessWorkspace>();

async function ensureBusinessWorkspaceSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_workspaces (
      tenant_id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      business_model_id TEXT NOT NULL,
      business_model_name TEXT NOT NULL,
      overview TEXT NOT NULL,
      opening_line TEXT,
      primary_business_unit TEXT NOT NULL,
      lead_agent_json JSONB NOT NULL,
      departments_json JSONB NOT NULL,
      workflow_playbook_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE business_workspaces ADD COLUMN IF NOT EXISTS workflow_playbook_json JSONB NOT NULL DEFAULT '[]'::jsonb;`);
  await pool.query(`ALTER TABLE business_workspaces ADD COLUMN IF NOT EXISTS opening_line TEXT;`);
  schemaInitialized = true;
}

export async function getBusinessWorkspace(tenantId: string): Promise<BusinessWorkspace | null> {
  if (!tenantId) {
    return null;
  }

  if (!hasDatabaseConfig()) {
    return memoryWorkspaces.get(tenantId) || null;
  }

  await ensureBusinessWorkspaceSchema();
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM business_workspaces WHERE tenant_id = $1 LIMIT 1;`, [tenantId]);
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.tenant_id,
    name: row.business_name,
    businessModelId: row.business_model_id,
    businessModelName: row.business_model_name,
    overview: row.overview,
    openingLine: row.opening_line || undefined,
    primaryBusinessUnit: row.primary_business_unit,
    leadAgent: row.lead_agent_json,
    departments: Array.isArray(row.departments_json) ? row.departments_json : [],
    workflowPlaybook: Array.isArray(row.workflow_playbook_json) ? row.workflow_playbook_json : [],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function upsertBusinessWorkspace(workspace: BusinessWorkspace): Promise<BusinessWorkspace> {
  const normalized: BusinessWorkspace = {
    ...workspace,
    updatedAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryWorkspaces.set(normalized.id, normalized);
    return normalized;
  }

  await ensureBusinessWorkspaceSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO business_workspaces (
        tenant_id, business_name, business_model_id, business_model_name, overview,
        opening_line, primary_business_unit, lead_agent_json, departments_json, workflow_playbook_json, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_model_id = EXCLUDED.business_model_id,
        business_model_name = EXCLUDED.business_model_name,
        overview = EXCLUDED.overview,
        opening_line = EXCLUDED.opening_line,
        primary_business_unit = EXCLUDED.primary_business_unit,
        lead_agent_json = EXCLUDED.lead_agent_json,
        departments_json = EXCLUDED.departments_json,
        workflow_playbook_json = EXCLUDED.workflow_playbook_json,
        updated_at = EXCLUDED.updated_at;
    `,
    [
      normalized.id,
      normalized.name,
      normalized.businessModelId,
      normalized.businessModelName,
      normalized.overview,
      normalized.openingLine || null,
      normalized.primaryBusinessUnit,
      JSON.stringify(normalized.leadAgent),
      JSON.stringify(normalized.departments),
      JSON.stringify(normalized.workflowPlaybook),
      normalized.createdAt,
      normalized.updatedAt,
    ]
  );

  return normalized;
}

export async function getEffectiveBusinessWorkspace(input: {
  tenantId: string;
  businessName: string;
  businessModelId: BusinessModelId;
}): Promise<BusinessWorkspace> {
  const existing = await getBusinessWorkspace(input.tenantId);
  if (existing) {
    return existing;
  }

  const base = buildTenantConfigFromBusiness(input);
  const workspace: BusinessWorkspace = {
    ...base,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return upsertBusinessWorkspace(workspace);
}