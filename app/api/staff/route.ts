import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import {
  createStaffMember,
  listStaffByTenant,
  getAssignmentsForStaff,
  completeAssignment,
  type StaffMember,
} from "@/lib/staffAssignmentStore";
import { listHandoffQueueItems, updateHandoffQueueItem } from "@/lib/businessOperationsStore";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedBusinessFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "staff";
    const staffId = searchParams.get("staffId");

    // Get staff members list
    if (type === "staff") {
      const department = searchParams.get("department") || undefined;
      const staff = await listStaffByTenant(session.tenantId, department);
      return NextResponse.json({ staff });
    }

    // Get assignments for specific staff
    if (type === "assignments" && staffId) {
      const includeCompleted = searchParams.get("includeCompleted") === "true";
      const assignments = await getAssignmentsForStaff(staffId, includeCompleted);
      return NextResponse.json({ assignments });
    }

    // Get handoff queue for tenant
    if (type === "handoffs") {
      const handoffs = await listHandoffQueueItems(session.tenantId);
      return NextResponse.json({ handoffs });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Staff API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedBusinessFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Create staff member
    if (action === "create-staff") {
      const { name, email, phone, role, departments, maxOpenItems } = body;

      if (!name || !email || !role) {
        return NextResponse.json(
          { error: "name, email, and role are required" },
          { status: 400 }
        );
      }

      const staff = await createStaffMember({
        tenantId: session.tenantId,
        name,
        email,
        phone,
        role,
        departments: departments || [],
        maxOpenItems: maxOpenItems || 10,
      });

      return NextResponse.json({ staff }, { status: 201 });
    }

    // Complete assignment
    if (action === "complete-assignment") {
      const { assignmentId, notes } = body;

      if (!assignmentId) {
        return NextResponse.json(
          { error: "assignmentId is required" },
          { status: 400 }
        );
      }

      const completed = await completeAssignment({ assignmentId, notes });

      if (!completed) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ assignment: completed });
    }

    // Update handoff status
    if (action === "update-handoff") {
      const { handoffId, status, assignedTo } = body;

      if (!handoffId) {
        return NextResponse.json(
          { error: "handoffId is required" },
          { status: 400 }
        );
      }

      const updated = await updateHandoffQueueItem({
        id: handoffId,
        tenantId: session.tenantId,
        status: status || "open",
        assignedTo: assignedTo || "",
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Handoff not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ handoff: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Staff API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
