/**
 * Usage Tracking Store
 * Manages metering, overage tracking, and billing calculations for subscriptions
 */

import { getPool, hasDatabaseConfig } from "@/lib/postgres";
import type { UsageMetric } from "@/lib/billingConfig";

export interface UsageRecord {
  id: string;
  businessId: string;
  tenantId: string;
  month: string; // YYYY-MM format
  voiceCalls: number; // call count
  voiceMinutes: number; // total minutes
  emailsSent: number; // emails sent
  smsSent: number; // SMS sent
  voiceCallOverages: number; // count of calls over limit
  voiceMinuteOverages: number; // minutes over limit
  emailOverages: number; // emails over limit
  smsOverages: number; // SMS over limit
  overageCharges: number; // total overage charges in pence
  createdAt: string;
  updatedAt: string;
}

export interface BillingEvent {
  id: string;
  businessId: string;
  tenantId: string;
  eventType: "call_start" | "call_end" | "email_sent" | "sms_sent";
  metric: UsageMetric;
  amount: number; // quantity (1 for call/email/sms, minutes for voice_minutes)
  overageCharge?: number; // if this caused an overage charge
  timestamp: string;
  metadata?: Record<string, any>;
}

let usageStoreInitialized = false;

async function initializeUsageSchema() {
  if (usageStoreInitialized || !hasDatabaseConfig()) {
    return;
  }

  const pool = getPool();
  if (!pool) return;

  try {
    // Create usage_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_records (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        month TEXT NOT NULL,
        voice_calls INTEGER DEFAULT 0,
        voice_minutes INTEGER DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        sms_sent INTEGER DEFAULT 0,
        voice_call_overages INTEGER DEFAULT 0,
        voice_minute_overages INTEGER DEFAULT 0,
        email_overages INTEGER DEFAULT 0,
        sms_overages INTEGER DEFAULT 0,
        overage_charges INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(business_id, month)
      );
    `);

    // Create billing_events table for audit trail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_events (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        metric TEXT NOT NULL,
        amount INTEGER NOT NULL,
        overage_charge INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_records_business_month 
      ON usage_records(business_id, month);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_billing_events_business_month 
      ON billing_events(business_id, DATE_TRUNC('month', timestamp));
    `);

    usageStoreInitialized = true;
  } catch (error) {
    console.error("Failed to initialize usage schema:", error);
  }
}

/**
 * Get or create usage record for current month
 */
export async function getOrCreateUsageRecord(
  businessId: string,
  tenantId: string,
  month?: string
): Promise<UsageRecord | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeUsageSchema();
  const pool = getPool();
  if (!pool) return null;

  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
  const id = `usage_${businessId}_${targetMonth}`;

  try {
    const result = await pool.query(
      `
      INSERT INTO usage_records 
      (id, business_id, tenant_id, month) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (business_id, month) DO NOTHING
      RETURNING *;
      `,
      [id, businessId, tenantId, targetMonth]
    );

    if (result.rows.length === 0) {
      // Already exists, fetch it
      const existing = await pool.query(
        "SELECT * FROM usage_records WHERE business_id = $1 AND month = $2",
        [businessId, targetMonth]
      );
      if (existing.rows.length > 0) {
        return mapUsageRecordRow(existing.rows[0]);
      }
    }

    return result.rows.length > 0 ? mapUsageRecordRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to get or create usage record:", error);
    return null;
  }
}

/**
 * Record a usage event
 */
export async function recordUsageEvent(
  businessId: string,
  tenantId: string,
  metric: UsageMetric,
  amount: number,
  eventType: BillingEvent["eventType"],
  overageCharge?: number,
  metadata?: Record<string, any>
): Promise<BillingEvent | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeUsageSchema();
  const pool = getPool();
  if (!pool) return null;

  const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // Record the event
    const result = await pool.query(
      `
      INSERT INTO billing_events 
      (id, business_id, tenant_id, event_type, metric, amount, overage_charge, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [eventId, businessId, tenantId, eventType, metric, amount, overageCharge || null, metadata || null]
    );

    // Update usage record
    const month = new Date().toISOString().slice(0, 7);
    const usageRecord = await getOrCreateUsageRecord(businessId, tenantId, month);

    if (usageRecord) {
      const columnMap: Record<UsageMetric, { main: string; overage: string }> = {
        voice_calls: { main: "voice_calls", overage: "voice_call_overages" },
        voice_minutes: { main: "voice_minutes", overage: "voice_minute_overages" },
        emails: { main: "emails_sent", overage: "email_overages" },
        sms_messages: { main: "sms_sent", overage: "sms_overages" },
      };

      const cols = columnMap[metric];
      if (cols) {
        let updateQuery = `UPDATE usage_records SET ${cols.main} = ${cols.main} + $1`;
        const params: any[] = [amount, businessId, month];

        if (overageCharge && overageCharge > 0) {
          updateQuery += `, ${cols.overage} = ${cols.overage} + $${params.length + 1}`;
          params.push(amount); // overage amount
          updateQuery += `, overage_charges = overage_charges + $${params.length + 1}`;
          params.push(Math.round(overageCharge * 100)); // convert to pence
        }

        updateQuery += ", updated_at = CURRENT_TIMESTAMP WHERE business_id = $2 AND month = $3";

        await pool.query(updateQuery, params);
      }
    }

    return result.rows.length > 0 ? mapBillingEventRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to record usage event:", error);
    return null;
  }
}

/**
 * Get usage for current month
 */
export async function getCurrentMonthUsage(
  businessId: string,
  tenantId: string
): Promise<UsageRecord | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeUsageSchema();
  const pool = getPool();
  if (!pool) return null;

  const month = new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(
      `SELECT * FROM usage_records WHERE business_id = $1 AND month = $2`,
      [businessId, month]
    );

    if (result.rows.length === 0) {
      return await getOrCreateUsageRecord(businessId, tenantId, month);
    }

    return mapUsageRecordRow(result.rows[0]);
  } catch (error) {
    console.error("Failed to get current month usage:", error);
    return null;
  }
}

/**
 * Get usage for specific month
 */
export async function getMonthUsage(
  businessId: string,
  month: string
): Promise<UsageRecord | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  await initializeUsageSchema();
  const pool = getPool();
  if (!pool) return null;

  try {
    const result = await pool.query(
      `SELECT * FROM usage_records WHERE business_id = $1 AND month = $2`,
      [businessId, month]
    );

    return result.rows.length > 0 ? mapUsageRecordRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to get month usage:", error);
    return null;
  }
}

/**
 * Get billing events for a month
 */
export async function getMonthBillingEvents(
  businessId: string,
  month: string
): Promise<BillingEvent[]> {
  if (!hasDatabaseConfig()) {
    return [];
  }

  await initializeUsageSchema();
  const pool = getPool();
  if (!pool) return [];

  try {
    const startOfMonth = `${month}-01`;
    const [year, monthNum] = month.split("-");
    const nextMonth = new Date(parseInt(year), parseInt(monthNum), 1);
    const endOfMonth = nextMonth.toISOString().slice(0, 10);

    const result = await pool.query(
      `
      SELECT * FROM billing_events 
      WHERE business_id = $1 
      AND DATE(timestamp) >= $2 
      AND DATE(timestamp) < $3
      ORDER BY timestamp DESC;
      `,
      [businessId, startOfMonth, endOfMonth]
    );

    return result.rows.map(mapBillingEventRow);
  } catch (error) {
    console.error("Failed to get billing events:", error);
    return [];
  }
}

/**
 * Reset overage charges (e.g., when new billing cycle starts)
 */
export async function resetOverageCharges(
  businessId: string,
  month: string
): Promise<void> {
  if (!hasDatabaseConfig()) {
    return;
  }

  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `
      UPDATE usage_records 
      SET overage_charges = 0,
          voice_call_overages = 0,
          voice_minute_overages = 0,
          email_overages = 0,
          sms_overages = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE business_id = $1 AND month = $2;
      `,
      [businessId, month]
    );
  } catch (error) {
    console.error("Failed to reset overage charges:", error);
  }
}

// Helper functions to map database rows to interfaces
function mapUsageRecordRow(row: any): UsageRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    tenantId: row.tenant_id,
    month: row.month,
    voiceCalls: row.voice_calls || 0,
    voiceMinutes: row.voice_minutes || 0,
    emailsSent: row.emails_sent || 0,
    smsSent: row.sms_sent || 0,
    voiceCallOverages: row.voice_call_overages || 0,
    voiceMinuteOverages: row.voice_minute_overages || 0,
    emailOverages: row.email_overages || 0,
    smsOverages: row.sms_overages || 0,
    overageCharges: (row.overage_charges || 0) / 100, // convert from pence to pounds
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBillingEventRow(row: any): BillingEvent {
  return {
    id: row.id,
    businessId: row.business_id,
    tenantId: row.tenant_id,
    eventType: row.event_type,
    metric: row.metric,
    amount: row.amount,
    overageCharge: row.overage_charge ? row.overage_charge / 100 : undefined, // convert from pence
    timestamp: row.timestamp,
    metadata: row.metadata || {},
  };
}
