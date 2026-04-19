"use client";

import React, { useState, useEffect } from "react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  departments: string[];
  maxOpenItems: number;
  createdAt: string;
}

interface Assignment {
  id: string;
  staffId: string;
  handoffId: string;
  status: "pending" | "in-progress" | "completed";
  assignedAt: string;
  completedAt?: string;
  notes?: string;
}

export default function StaffListClient({ tenantId }: { tenantId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, [tenantId]);

  const loadStaff = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/staff?type=staff&tenantId=${tenantId}`);

      if (!response.ok) throw new Error("Failed to load staff");

      const data = await response.json();
      setStaff(data.staff || []);
      setError(null);
    } catch (err) {
      console.error("Error loading staff:", err);
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (staffId: string) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/staff?type=assignments&staffId=${staffId}&tenantId=${tenantId}`);

      if (!response.ok) throw new Error("Failed to load assignments");

      const data = await response.json();
      setAssignments({
        ...assignments,
        [staffId]: data.assignments || [],
      });
    } catch (err) {
      console.error("Error loading assignments:", err);
    }
  };

  const toggleStaffDetails = (staffId: string) => {
    if (expandedStaff === staffId) {
      setExpandedStaff(null);
    } else {
      setExpandedStaff(staffId);
      if (!assignments[staffId]) {
        loadAssignments(staffId);
      }
    }
  };

  const completeAssignment = async (staffId: string, assignmentId: string) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete-assignment",
          assignmentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete assignment");

      // Reload assignments for this staff
      await loadAssignments(staffId);
    } catch (err) {
      console.error("Error completing assignment:", err);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-600">Loading staff members...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600">
        <p>No staff members yet. Add one using the form on the right.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((member) => (
        <div
          key={member.id}
          className="border border-slate-200 rounded-lg hover:border-blue-300 transition"
        >
          {/* Staff Header */}
          <button
            onClick={() => toggleStaffDetails(member.id)}
            className="w-full text-left p-4 hover:bg-slate-50 transition flex justify-between items-center"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{member.name}</h3>
              <div className="flex gap-4 text-xs text-slate-600 mt-1">
                <span>{member.email}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {member.role}
                </span>
                <span>Max: {member.maxOpenItems} items</span>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${
                expandedStaff === member.id ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Staff Details - Assignments */}
          {expandedStaff === member.id && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Open Assignments</h4>
                {assignments[member.id]?.length === 0 ? (
                  <p className="text-sm text-slate-600">No active assignments</p>
                ) : (
                  <div className="space-y-2">
                    {assignments[member.id]
                      ?.filter((a) => a.status !== "completed")
                      .map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-white border border-slate-200 rounded p-2 flex justify-between items-start text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              Handoff {assignment.handoffId.substring(0, 8)}
                            </p>
                            <p className="text-xs text-slate-600">
                              Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => completeAssignment(member.id, assignment.id)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded transition"
                          >
                            Complete
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Completed Assignments Summary */}
              {assignments[member.id]?.filter((a) => a.status === "completed").length > 0 && (
                <div className="text-xs text-slate-600 border-t pt-2">
                  <p>
                    {assignments[member.id]?.filter((a) => a.status === "completed").length}{" "}
                    completed assignments
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
