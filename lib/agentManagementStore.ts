/**
 * Agent Management Store
 * Manages AI agents/departments and their usage for each business
 */

import { getPool, hasDatabaseConfig } from "@/lib/postgres";
import { randomUUID } from "crypto";

export interface BusinessAgent {
  id: string;
  businessId: string;
  tenantId: string;
  departmentName: string;
  agentName: string;
  description?: string;
  isActive: boolean;
  isPremium: boolean; // true if this is an additional paid agent (beyond plan limit)
  monthlyAgentCost: number; // overage cost for this agent if premium
  createdAt: string;
  updatedAt: string;
}

export interface AgentUsageMetrics {
  businessId: string;
  tenantId: string;
  month: string;
  totalAgentsUsed: number;
  includedAgents: number;
  premiumAgents: number;
  agentCosts: number; // total cost for premium agents this month
}

let agentStoreInitialized = false;

async function initializeAgentSchema() {
  if (agentStoreInitialized || !hasDatabaseConfig()) {
    return;
  }

  const pool = getPool();
  if (!pool) return;

  try {
    // Create business_agents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_agents (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        department_name TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        is_premium BOOLEAN DEFAULT false,
        monthly_agent_cost INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create agent_usage_metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_usage_metrics (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        month TEXT NOT NULL,
        total_agents_used INTEGER DEFAULT 0,
        included_agents INTEGER DEFAULT 0,
        premium_agents INTEGER DEFAULT 0,
        agent_costs INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(business_id, month)
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_business_agents_business 
      ON business_agents(business_id, is_active);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_usage_business_month 
      ON agent_usage_metrics(business_id, month);
    `);

    agentStoreInitialized = true;
  } catch (error) {
    console.error("Failed to initialize agent schema:", error);
  }
}

/**
 * Create a new agent for a business
 */
export async function createAgent(
  businessId: string,
  tenantId: string,
  departmentName: string,
  agentName: string,
  description?: string,
  isPremium: boolean = false,
  monthlyAgentCost: number = 0
): Promise<BusinessAgent | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return null;

  const id = `agent_${randomUUID()}`;

  try {
    const result = await pool.query(
      `
      INSERT INTO business_agents 
      (id, business_id, tenant_id, department_name, agent_name, description, is_premium, monthly_agent_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [id, businessId, tenantId, departmentName, agentName, description || null, isPremium, monthlyAgentCost]
    );

    return result.rows.length > 0 ? mapAgentRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to create agent:", error);
    return null;
  }
}

/**
 * Get all agents for a business
 */
export async function getBusinessAgents(businessId: string, activeOnly: boolean = true): Promise<BusinessAgent[]> {
  if (!hasDatabaseConfig()) {
    return [];
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return [];

  try {
    const query = activeOnly
      ? `SELECT * FROM business_agents WHERE business_id = $1 AND is_active = true ORDER BY created_at ASC`
      : `SELECT * FROM business_agents WHERE business_id = $1 ORDER BY created_at ASC`;

    const result = await pool.query(query, [businessId]);
    return result.rows.map(mapAgentRow);
  } catch (error) {
    console.error("Failed to get business agents:", error);
    return [];
  }
}

/**
 * Get agent count for a business
 */
export async function getBusinessAgentCount(businessId: string, activeOnly: boolean = true): Promise<number> {
  if (!hasDatabaseConfig()) {
    return 0;
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return 0;

  try {
    const query = activeOnly
      ? `SELECT COUNT(*) as count FROM business_agents WHERE business_id = $1 AND is_active = true`
      : `SELECT COUNT(*) as count FROM business_agents WHERE business_id = $1`;

    const result = await pool.query(query, [businessId]);
    return parseInt(result.rows[0]?.count || "0", 10);
  } catch (error) {
    console.error("Failed to get agent count:", error);
    return 0;
  }
}

/**
 * Get premium (paid) agents count
 */
export async function getPremiumAgentCount(businessId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    return 0;
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return 0;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM business_agents WHERE business_id = $1 AND is_premium = true AND is_active = true`,
      [businessId]
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  } catch (error) {
    console.error("Failed to get premium agent count:", error);
    return 0;
  }
}

/**
 * Delete/deactivate an agent
 */
export async function deactivateAgent(agentId: string): Promise<boolean> {
  if (!hasDatabaseConfig()) {
    return false;
  }

  const pool = getPool();
  if (!pool) return false;

  try {
    await pool.query(
      `UPDATE business_agents SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [agentId]
    );
    return true;
  } catch (error) {
    console.error("Failed to deactivate agent:", error);
    return false;
  }
}

/**
 * Get or create agent usage metrics for current month
 */
export async function getOrCreateAgentMetrics(
  businessId: string,
  tenantId: string,
  month?: string
): Promise<AgentUsageMetrics | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return null;

  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const id = `agent_metrics_${businessId}_${targetMonth}`;

  try {
    const result = await pool.query(
      `
      INSERT INTO agent_usage_metrics 
      (id, business_id, tenant_id, month)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (business_id, month) DO NOTHING
      RETURNING *;
      `,
      [id, businessId, tenantId, targetMonth]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        `SELECT * FROM agent_usage_metrics WHERE business_id = $1 AND month = $2`,
        [businessId, targetMonth]
      );
      if (existing.rows.length > 0) {
        return mapAgentMetricsRow(existing.rows[0]);
      }
    }

    return result.rows.length > 0 ? mapAgentMetricsRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to create agent metrics:", error);
    return null;
  }
}

/**
 * Calculate total agent costs for current month
 */
export async function calculateMonthlyAgentCosts(businessId: string, month?: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    return 0;
  }

  await initializeAgentSchema();
  const pool = getPool();
  if (!pool) return 0;

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(monthly_agent_cost), 0) as total_cost 
       FROM business_agents 
       WHERE business_id = $1 AND is_premium = true AND is_active = true`,
      [businessId]
    );

    return parseInt(result.rows[0]?.total_cost || "0", 10) / 100; // convert from pence to pounds
  } catch (error) {
    console.error("Failed to calculate agent costs:", error);
    return 0;
  }
}

// Helper functions
function mapAgentRow(row: any): BusinessAgent {
  return {
    id: row.id,
    businessId: row.business_id,
    tenantId: row.tenant_id,
    departmentName: row.department_name,
    agentName: row.agent_name,
    description: row.description,
    isActive: row.is_active,
    isPremium: row.is_premium,
    monthlyAgentCost: (row.monthly_agent_cost || 0) / 100, // convert from pence to pounds
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAgentMetricsRow(row: any): AgentUsageMetrics {
  return {
    businessId: row.business_id,
    tenantId: row.tenant_id,
    month: row.month,
    totalAgentsUsed: row.total_agents_used || 0,
    includedAgents: row.included_agents || 0,
    premiumAgents: row.premium_agents || 0,
    agentCosts: (row.agent_costs || 0) / 100, // convert from pence to pounds
  };
}
