import { CallLog } from "@/lib/callLogStore";
import { getPool } from "@/lib/postgres";

let schemaInitialized = false;

export async function ensureCallLogSchema(): Promise<void> {
  if (schemaInitialized) {
    return;
  }

  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'developers-housing',
      tenant_name TEXT NOT NULL DEFAULT 'Developers Housing',
      session_id TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ NOT NULL,
      duration_seconds INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      urgency TEXT NOT NULL,
      business_unit TEXT NOT NULL,
      department_id TEXT NOT NULL DEFAULT 'general',
      department_name TEXT NOT NULL DEFAULT 'General Support',
      caller_name TEXT NOT NULL DEFAULT '',
      caller_phone TEXT NOT NULL DEFAULT '',
      routing_source TEXT NOT NULL DEFAULT 'front-door',
      routing_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      detected_emotion TEXT NOT NULL DEFAULT 'neutral',
      handoff_recommended BOOLEAN NOT NULL DEFAULT FALSE,
      summary TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      ticket_status TEXT NOT NULL DEFAULT 'unknown',
      workflow_status TEXT NOT NULL DEFAULT 'new',
      workflow_call_type TEXT NOT NULL DEFAULT 'General support',
      handoff_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      contractor_name TEXT NOT NULL DEFAULT '',
      contractor_eta TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      transcript_json JSONB NOT NULL,
      case_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_demo_call BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'developers-housing';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tenant_name TEXT NOT NULL DEFAULT 'Developers Housing';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS detected_emotion TEXT NOT NULL DEFAULT 'neutral';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_recommended BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS ticket_status TEXT NOT NULL DEFAULT 'unknown';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS department_id TEXT NOT NULL DEFAULT 'general';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS department_name TEXT NOT NULL DEFAULT 'General Support';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS caller_name TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS caller_phone TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routing_source TEXT NOT NULL DEFAULT 'front-door';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS routing_confidence DOUBLE PRECISION NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'new';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS workflow_call_type TEXT NOT NULL DEFAULT 'General support';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS contractor_name TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS contractor_eta TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS case_data_json JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS is_demo_call BOOLEAN NOT NULL DEFAULT FALSE;`);

  schemaInitialized = true;
}

export async function upsertCallLog(log: CallLog): Promise<void> {
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO call_logs (
        id,
        tenant_id,
        tenant_name,
        session_id,
        started_at,
        ended_at,
        duration_seconds,
        issue_type,
        urgency,
        business_unit,
        department_id,
        department_name,
        caller_name,
        caller_phone,
        routing_source,
        routing_confidence,
        detected_emotion,
        handoff_recommended,
        summary,
        ticket_id,
        ticket_status,
        workflow_status,
        workflow_call_type,
        handoff_payload_json,
        contractor_name,
        contractor_eta,
        status,
        transcript_json,
        case_data_json,
        is_demo_call
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      )
      ON CONFLICT (id)
      DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        tenant_name = EXCLUDED.tenant_name,
        session_id = EXCLUDED.session_id,
        started_at = EXCLUDED.started_at,
        ended_at = EXCLUDED.ended_at,
        duration_seconds = EXCLUDED.duration_seconds,
        issue_type = EXCLUDED.issue_type,
        urgency = EXCLUDED.urgency,
        business_unit = EXCLUDED.business_unit,
        department_id = EXCLUDED.department_id,
        department_name = EXCLUDED.department_name,
        caller_name = EXCLUDED.caller_name,
        caller_phone = EXCLUDED.caller_phone,
        routing_source = EXCLUDED.routing_source,
        routing_confidence = EXCLUDED.routing_confidence,
        detected_emotion = EXCLUDED.detected_emotion,
        handoff_recommended = EXCLUDED.handoff_recommended,
        summary = EXCLUDED.summary,
        ticket_id = EXCLUDED.ticket_id,
        ticket_status = EXCLUDED.ticket_status,
        workflow_status = EXCLUDED.workflow_status,
        workflow_call_type = EXCLUDED.workflow_call_type,
        handoff_payload_json = EXCLUDED.handoff_payload_json,
        contractor_name = EXCLUDED.contractor_name,
        contractor_eta = EXCLUDED.contractor_eta,
        status = EXCLUDED.status,
        transcript_json = EXCLUDED.transcript_json,
        case_data_json = EXCLUDED.case_data_json,
        is_demo_call = EXCLUDED.is_demo_call;
    `,
    [
      log.id,
      log.tenantId,
      log.tenantName,
      log.sessionId,
      log.startedAt,
      log.endedAt,
      log.durationSeconds,
      log.issueType,
      log.urgency,
      log.businessUnit,
      log.departmentId,
      log.departmentName,
      log.callerName,
      log.callerPhone,
      log.routingSource,
      log.routingConfidence,
      log.detectedEmotion,
      log.handoffRecommended,
      log.summary,
      log.ticketId,
      log.ticketStatus,
      log.workflowStatus,
      log.workflowCallType,
      JSON.stringify(log.handoffPayload),
      log.contractorName,
      log.contractorEta,
      log.status,
      JSON.stringify(log.transcript),
      JSON.stringify(log.caseData || {}),
      log.isDemoCall || false,
    ]
  );
}

export async function updateCallLogWorkflow(input: {
  id: string;
  tenantId?: string;
  workflowStatus?: string;
  workflowCallType?: string;
  handoffPayload?: Record<string, string>;
  contractorName?: string;
  contractorEta?: string;
  status?: string;
}): Promise<CallLog | null> {
  const pool = getPool();
  const values: Array<string> = [];
  const updates: string[] = [];

  const pushUpdate = (column: string, value: string | undefined) => {
    if (value === undefined) {
      return;
    }
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  pushUpdate("workflow_status", input.workflowStatus);
  pushUpdate("workflow_call_type", input.workflowCallType);
  if (input.handoffPayload !== undefined) {
    values.push(JSON.stringify(input.handoffPayload));
    updates.push(`handoff_payload_json = $${values.length}`);
  }
  pushUpdate("contractor_name", input.contractorName);
  pushUpdate("contractor_eta", input.contractorEta);
  pushUpdate("status", input.status);

  if (updates.length === 0) {
    return null;
  }

  values.push(input.id);
  let whereClause = `id = $${values.length}`;

  if (input.tenantId) {
    values.push(input.tenantId);
    whereClause += ` AND tenant_id = $${values.length}`;
  }

  const result = await pool.query(
    `
      UPDATE call_logs
      SET ${updates.join(", ")}
      WHERE ${whereClause}
      RETURNING
        id,
        tenant_id,
        tenant_name,
        session_id,
        started_at,
        ended_at,
        duration_seconds,
        issue_type,
        urgency,
        business_unit,
        department_id,
        department_name,
        caller_name,
        caller_phone,
        routing_source,
        routing_confidence,
        detected_emotion,
        handoff_recommended,
        summary,
        ticket_id,
        ticket_status,
        workflow_status,
        workflow_call_type,
        handoff_payload_json,
        contractor_name,
        contractor_eta,
        status,
        transcript_json;
    `,
    values
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    sessionId: row.session_id,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: new Date(row.ended_at).toISOString(),
    durationSeconds: Number(row.duration_seconds),
    issueType: row.issue_type,
    urgency: row.urgency,
    businessUnit: row.business_unit,
    departmentId: row.department_id,
    departmentName: row.department_name,
    callerName: row.caller_name,
    callerPhone: row.caller_phone,
    routingSource: row.routing_source,
    routingConfidence: Number(row.routing_confidence),
    detectedEmotion: row.detected_emotion,
    handoffRecommended: Boolean(row.handoff_recommended),
    summary: row.summary,
    ticketId: row.ticket_id,
    ticketStatus: row.ticket_status,
    workflowStatus: row.workflow_status,
    workflowCallType: row.workflow_call_type,
    handoffPayload:
      row.handoff_payload_json && typeof row.handoff_payload_json === "object"
        ? row.handoff_payload_json
        : {},
    contractorName: row.contractor_name,
    contractorEta: row.contractor_eta,
    status: row.status,
    transcript: Array.isArray(row.transcript_json) ? row.transcript_json : [],
    caseData:
      row.case_data_json && typeof row.case_data_json === "object"
        ? row.case_data_json
        : null,
    isDemoCall: Boolean(row.is_demo_call),
  };
}

export async function listCallLogs(): Promise<CallLog[]> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT
        id,
        tenant_id,
        tenant_name,
        session_id,
        started_at,
        ended_at,
        duration_seconds,
        issue_type,
        urgency,
        business_unit,
        department_id,
        department_name,
        caller_name,
        caller_phone,
        routing_source,
        routing_confidence,
        detected_emotion,
        handoff_recommended,
        summary,
        ticket_id,
        ticket_status,
        workflow_status,
        workflow_call_type,
        handoff_payload_json,
        contractor_name,
        contractor_eta,
        status,
        transcript_json,
        case_data_json,
        is_demo_call
      FROM call_logs
      ORDER BY started_at DESC;
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    sessionId: row.session_id,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: new Date(row.ended_at).toISOString(),
    durationSeconds: Number(row.duration_seconds),
    issueType: row.issue_type,
    urgency: row.urgency,
    businessUnit: row.business_unit,
    departmentId: row.department_id,
    departmentName: row.department_name,
    callerName: row.caller_name,
    callerPhone: row.caller_phone,
    routingSource: row.routing_source,
    routingConfidence: Number(row.routing_confidence),
    detectedEmotion: row.detected_emotion,
    handoffRecommended: Boolean(row.handoff_recommended),
    summary: row.summary,
    ticketId: row.ticket_id,
    ticketStatus: row.ticket_status,
    workflowStatus: row.workflow_status,
    workflowCallType: row.workflow_call_type,
    handoffPayload:
      row.handoff_payload_json && typeof row.handoff_payload_json === "object"
        ? row.handoff_payload_json
        : {},
    contractorName: row.contractor_name,
    contractorEta: row.contractor_eta,
    status: row.status,
    transcript: Array.isArray(row.transcript_json) ? row.transcript_json : [],
    caseData:
      row.case_data_json && typeof row.case_data_json === "object"
        ? row.case_data_json
        : null,
    isDemoCall: Boolean(row.is_demo_call),
  }));
}
