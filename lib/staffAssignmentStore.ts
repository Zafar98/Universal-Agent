import { randomUUID } from "crypto";
import { getPool, hasDatabaseConfig } from "@/lib/postgres";

export type StaffMember = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: "support" | "specialist" | "manager";
  departments: string[];
  maxOpenItems: number;
  isActive: boolean;
  createdAt: string;
};

export type HandoffAssignment = {
  id: string;
  handoffQueueItemId: string;
  assignedToStaffId: string;
  tenantId: string;
  assignedAt: string;
  completedAt?: string;
  notes: string;
};

const memoryStaff = new Map<string, StaffMember>();
const memoryAssignments = new Map<string, HandoffAssignment>();

let schemaInitialized = false;

async function ensureStaffSchema(): Promise<void> {
  if (!hasDatabaseConfig() || schemaInitialized) {
    return;
  }

  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      departments TEXT[] NOT NULL DEFAULT '{}',
      max_open_items INTEGER NOT NULL DEFAULT 10,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(tenant_id, email)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS handoff_assignments (
      id TEXT PRIMARY KEY,
      handoff_queue_item_id TEXT NOT NULL,
      assigned_to_staff_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      notes TEXT NOT NULL DEFAULT '',
      REFERENCES staff_members(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS handoff_assignments_staff_id_idx ON handoff_assignments(assigned_to_staff_id, completed_at);
  `);

  schemaInitialized = true;
}

export async function createStaffMember(input: {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: "support" | "specialist" | "manager";
  departments: string[];
  maxOpenItems?: number;
}): Promise<StaffMember> {
  const member: StaffMember = {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    departments: input.departments,
    maxOpenItems: input.maxOpenItems || 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  if (!hasDatabaseConfig()) {
    memoryStaff.set(member.id, member);
    return member;
  }

  await ensureStaffSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO staff_members (
        id, tenant_id, name, email, phone, role, departments, max_open_items, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
      ON CONFLICT (tenant_id, email) DO NOTHING;
    `,
    [member.id, input.tenantId, input.name, input.email, input.phone || "", input.role, input.departments, input.maxOpenItems || 10, member.createdAt]
  );

  return member;
}

export async function listStaffByTenant(tenantId: string, departmentFilter?: string): Promise<StaffMember[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryStaff.values())
      .filter((s) => s.tenantId === tenantId && s.isActive)
      .filter((s) => (departmentFilter ? s.departments.includes(departmentFilter) : true));
  }

  await ensureStaffSchema();
  const pool = getPool();
  const query = departmentFilter
    ? `SELECT * FROM staff_members WHERE tenant_id = $1 AND is_active = TRUE AND $2 = ANY(departments);`
    : `SELECT * FROM staff_members WHERE tenant_id = $1 AND is_active = TRUE;`;

  const result = await pool.query(query, departmentFilter ? [tenantId, departmentFilter] : [tenantId]);

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    departments: row.departments || [],
    maxOpenItems: row.max_open_items,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

async function countOpenAssignmentsForStaff(staffId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryAssignments.values()).filter((a) => a.assignedToStaffId === staffId && !a.completedAt).length;
  }

  const pool = getPool();
  const result = await pool.query(`SELECT COUNT(*) as count FROM handoff_assignments WHERE assigned_to_staff_id = $1 AND completed_at IS NULL;`, [staffId]);

  return Number(result.rows[0]?.count || 0);
}

export async function getNextAvailableStaff(
  tenantId: string,
  departmentName?: string
): Promise<StaffMember | null> {
  const candidates = await listStaffByTenant(tenantId, departmentName);

  if (candidates.length === 0) {
    return null;
  }

  let best: StaffMember | null = null;
  let bestOpenCount = Infinity;

  for (const candidate of candidates) {
    const openCount = await countOpenAssignmentsForStaff(candidate.id);
    if (openCount < candidate.maxOpenItems && openCount < bestOpenCount) {
      best = candidate;
      bestOpenCount = openCount;
    }
  }

  return best;
}

export async function assignHandoffToStaff(input: {
  handoffQueueItemId: string;
  tenantId: string;
  departmentName?: string;
}): Promise<HandoffAssignment | null> {
  const staff = await getNextAvailableStaff(input.tenantId, input.departmentName);

  if (!staff) {
    return null;
  }

  const assignment: HandoffAssignment = {
    id: randomUUID(),
    handoffQueueItemId: input.handoffQueueItemId,
    assignedToStaffId: staff.id,
    tenantId: input.tenantId,
    assignedAt: new Date().toISOString(),
    notes: "",
  };

  if (!hasDatabaseConfig()) {
    memoryAssignments.set(assignment.id, assignment);
    return assignment;
  }

  await ensureStaffSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO handoff_assignments (
        id, handoff_queue_item_id, assigned_to_staff_id, tenant_id, assigned_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `,
    [assignment.id, input.handoffQueueItemId, staff.id, input.tenantId, assignment.assignedAt, ""]
  );

  return assignment;
}

export async function completeAssignment(input: { assignmentId: string; notes?: string }): Promise<HandoffAssignment | null> {
  const now = new Date().toISOString();

  if (!hasDatabaseConfig()) {
    const existing = memoryAssignments.get(input.assignmentId);
    if (!existing) return null;

    const updated = {
      ...existing,
      completedAt: now,
      notes: input.notes || existing.notes,
    };
    memoryAssignments.set(input.assignmentId, updated);
    return updated;
  }

  await ensureStaffSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE handoff_assignments
      SET completed_at = $2, notes = $3
      WHERE id = $1
      RETURNING *;
    `,
    [input.assignmentId, now, input.notes || ""]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    handoffQueueItemId: row.handoff_queue_item_id,
    assignedToStaffId: row.assigned_to_staff_id,
    tenantId: row.tenant_id,
    assignedAt: new Date(row.assigned_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    notes: row.notes,
  };
}

export async function getAssignmentsForStaff(staffId: string, includeCompleted = false): Promise<HandoffAssignment[]> {
  if (!hasDatabaseConfig()) {
    return Array.from(memoryAssignments.values())
      .filter((a) => a.assignedToStaffId === staffId)
      .filter((a) => (includeCompleted ? true : !a.completedAt))
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }

  await ensureStaffSchema();
  const pool = getPool();
  const query = includeCompleted
    ? `SELECT * FROM handoff_assignments WHERE assigned_to_staff_id = $1 ORDER BY assigned_at DESC;`
    : `SELECT * FROM handoff_assignments WHERE assigned_to_staff_id = $1 AND completed_at IS NULL ORDER BY assigned_at DESC;`;

  const result = await pool.query(query, [staffId]);

  return result.rows.map((row) => ({
    id: row.id,
    handoffQueueItemId: row.handoff_queue_item_id,
    assignedToStaffId: row.assigned_to_staff_id,
    tenantId: row.tenant_id,
    assignedAt: new Date(row.assigned_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    notes: row.notes,
  }));
}
