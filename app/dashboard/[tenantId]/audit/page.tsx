import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { getAuthenticatedBusinessFromCookies } from "@/lib/sessionAuth";
import { listAutonomyAuditEvents } from "@/lib/autonomyAuditStore";

export default async function TenantAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ logId?: string; ticketId?: string; operationId?: string }>;
}) {
  const { tenantId } = await params;
  const filters = await searchParams;
  const session = await getAuthenticatedBusinessFromCookies(await cookies());

  if (!session) {
    redirect("/login");
  }

  if (!session.isAdmin && tenantId !== session.tenantId) {
    redirect(`/dashboard/${session.tenantId}/audit`);
  }

  const events = await listAutonomyAuditEvents({
    tenantId,
    logId: filters.logId,
    ticketId: filters.ticketId,
    operationId: filters.operationId,
    limit: 200,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "linear-gradient(135deg, #f7faff 0%, #e8f0ff 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ color: "#4f6ea8", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Compliance
            </div>
            <h1 style={{ margin: "6px 0 0", color: "#102349", fontSize: "34px" }}>Autonomy Audit Trail</h1>
            <p style={{ color: "#4d6898", marginTop: "8px" }}>
              Tenant: {tenantId} · showing latest {events.length} events
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href={`/dashboard/${tenantId}`}
              style={{
                border: "1px solid #bfd1f5",
                borderRadius: "999px",
                background: "white",
                color: "#21447f",
                padding: "10px 14px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back to Tenant
            </Link>
            <Link
              href={`/api/audit-logs?tenantId=${tenantId}`}
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "10px 14px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Raw JSON
            </Link>
          </div>
        </div>

        <form
          method="GET"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "10px",
            background: "white",
            border: "1px solid #dbe7ff",
            borderRadius: "14px",
            padding: "12px",
            marginBottom: "14px",
          }}
        >
          <input name="logId" defaultValue={filters.logId || ""} placeholder="Filter by logId" style={inputStyle} />
          <input name="ticketId" defaultValue={filters.ticketId || ""} placeholder="Filter by ticketId" style={inputStyle} />
          <input name="operationId" defaultValue={filters.operationId || ""} placeholder="Filter by operationId" style={inputStyle} />
          <button type="submit" style={buttonStyle}>Apply Filters</button>
        </form>

        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #dbe7ff",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead style={{ background: "#eef4ff", color: "#23457d" }}>
              <tr>
                <th style={headerStyle}>Timestamp</th>
                <th style={headerStyle}>Event</th>
                <th style={headerStyle}>Decision</th>
                <th style={headerStyle}>Reason</th>
                <th style={headerStyle}>Ticket</th>
                <th style={headerStyle}>Operation</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    No audit events found for current filters.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} style={{ borderTop: "1px solid #edf2ff" }}>
                    <td style={cellStyle}>{new Date(event.createdAt).toLocaleString()}</td>
                    <td style={cellStyle}>{event.eventType}</td>
                    <td style={cellStyle}>{event.decision}</td>
                    <td style={cellStyle}>{event.reason}</td>
                    <td style={cellStyle}>{event.ticketId || "-"}</td>
                    <td style={cellStyle}>{event.operationId || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: "1px solid #c7d6f7",
  borderRadius: "10px",
  padding: "10px 12px",
  color: "#102349",
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const headerStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const cellStyle: CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "top",
  color: "#1e293b",
};
