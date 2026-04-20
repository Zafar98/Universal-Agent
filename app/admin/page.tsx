"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type TranscriptEntry = {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: string;
};

type CallLog = {
  id: string;
  tenantId: string;
  tenantName: string;
  sessionId: string;
  startedAt: string;
  durationSeconds: number;
  issueType: "repair" | "complaint" | "billing" | "reservation" | "order" | "general";
  urgency: "low" | "medium" | "high";
  workflowStatus:
    | "new"
    | "sent_to_contractor"
    | "awaiting_contractor"
    | "contractor_on_the_way"
    | "reservation_confirmed"
    | "order_dispatched"
    | "guest_service_assigned"
    | "event_quote_sent"
    | "resolved";
  workflowCallType: string;
  status: "open" | "in_progress" | "closed";
  summary: string;
  ticketId: string;
  transcript: TranscriptEntry[];
};

type Analytics = {
  totalCalls: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  estimatedCost: number;
  byStatus: Record<string, number>;
  byIssueType: Record<string, number>;
  byTenant: Array<{
    tenantId: string;
    tenantName: string;
    calls: number;
    durationSeconds: number;
    estimatedCost: number;
  }>;
};

type BusinessTenant = {
  id: string;
  tenantId: string;
  businessName: string;
  businessModelId: string;
  selectedPlan?: "starter" | "growth" | "enterprise";
  selectedIntegration?: "website-widget" | "phone-number" | "api-webhooks";
  subscriptionStatus?: "pending_payment" | "trialing" | "active" | "past_due" | "canceled";
  integrationReady?: boolean;
  activationCompletedAt?: string | null;
  createdAt: string;
  monthlyCost: number;
};

const sampleLogs: CallLog[] = [
  {
    id: "sample-1",
    tenantId: "developers-housing",
    tenantName: "Developers Housing",
    sessionId: "sample-session-1",
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    durationSeconds: 184,
    issueType: "repair",
    urgency: "high",
    workflowStatus: "awaiting_contractor",
    workflowCallType: "Emergency repair",
    status: "in_progress",
    summary: "Caller reported a heavy kitchen leak and requested immediate attendance.",
    ticketId: "SAMPLE-1001",
    transcript: [
      { id: "1", speaker: "user", text: "My kitchen ceiling is leaking right now.", timestamp: new Date().toISOString() },
      { id: "2", speaker: "agent", text: "I can help now. Please confirm your address and postcode.", timestamp: new Date().toISOString() },
    ],
  },
  {
    id: "sample-2",
    tenantId: "grand-harbor-hotel",
    tenantName: "Grand Harbor Hotel",
    sessionId: "sample-session-2",
    startedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    durationSeconds: 121,
    issueType: "reservation",
    urgency: "low",
    workflowStatus: "reservation_confirmed",
    workflowCallType: "New room booking",
    status: "closed",
    summary: "Guest confirmed weekend reservation and accepted rate terms.",
    ticketId: "SAMPLE-2001",
    transcript: [
      { id: "1", speaker: "user", text: "I need a room for Friday and Saturday.", timestamp: new Date().toISOString() },
      { id: "2", speaker: "agent", text: "Confirmed. I have secured a double room with breakfast.", timestamp: new Date().toISOString() },
    ],
  },
];

const sampleTenants: BusinessTenant[] = [
  {
    id: "1",
    tenantId: "developers-housing",
    businessName: "Developers Housing",
    businessModelId: "housing-association",
    selectedPlan: "enterprise",
    selectedIntegration: "phone-number",
    subscriptionStatus: "active",
    integrationReady: true,
    activationCompletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    monthlyCost: 499,
  },
  {
    id: "2",
    tenantId: "grand-harbor-hotel",
    businessName: "Grand Harbor Hotel",
    businessModelId: "hotel",
    selectedPlan: "growth",
    selectedIntegration: "website-widget",
    subscriptionStatus: "active",
    integrationReady: true,
    activationCompletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    monthlyCost: 149,
  },
  {
    id: "3",
    tenantId: "pizza-palace",
    businessName: "Pizza Palace",
    businessModelId: "restaurant",
    selectedPlan: "starter",
    selectedIntegration: "api-webhooks",
    subscriptionStatus: "trialing",
    integrationReady: false,
    activationCompletedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    monthlyCost: 0,
  },
  {
    id: "4",
    tenantId: "green-meadows",
    businessName: "Green Meadows Housing",
    businessModelId: "housing-association",
    selectedPlan: "growth",
    selectedIntegration: "phone-number",
    subscriptionStatus: "pending_payment",
    integrationReady: false,
    activationCompletedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    monthlyCost: 0,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string>("");
  const [statusDraft, setStatusDraft] = useState<Record<string, CallLog["workflowStatus"]>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "logs">("overview");
  const [tenants, setTenants] = useState<BusinessTenant[]>([]);
  const [tenantFilter, setTenantFilter] = useState<"all" | "active" | "trialing" | "pending">("all");
  const [searchTenant, setSearchTenant] = useState("");
  const logsSignatureRef = useRef("");
  const analyticsSignatureRef = useRef("");
  const tenantsHydratedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json().catch(() => ({}));

        if (!sessionResponse.ok || !sessionData.authenticated || !sessionData.business?.isAdmin) {
          router.replace("/admin/login");
          return;
        }

        const logsResponse = await fetch("/api/call-logs?syncTickets=1");
        const logsData = await logsResponse.json().catch(() => ({}));

        if (!active) return;

        const incomingLogs = Array.isArray(logsData.logs) ? (logsData.logs as CallLog[]) : [];
        const hasRealLogs = incomingLogs.length > 0;
        const activeLogs = hasRealLogs ? incomingLogs : sampleLogs;
        const nextAnalytics =
          logsData.analytics || {
            totalCalls: activeLogs.length,
            totalDurationSeconds: activeLogs.reduce((acc, log) => acc + log.durationSeconds, 0),
            avgDurationSeconds:
              activeLogs.length > 0
                ? Math.round(activeLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / activeLogs.length)
                : 0,
            estimatedCost: Number(((activeLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / 60) * 0.12).toFixed(2)),
            byStatus: {},
            byIssueType: {},
            byTenant: [],
          };

        const nextLogsSignature = JSON.stringify(activeLogs);
        if (nextLogsSignature !== logsSignatureRef.current) {
          logsSignatureRef.current = nextLogsSignature;
          setLogs(activeLogs);
        }

        if (!tenantsHydratedRef.current) {
          tenantsHydratedRef.current = true;
          setTenants(sampleTenants);
        }

        const nextAnalyticsSignature = JSON.stringify(nextAnalytics);
        if (nextAnalyticsSignature !== analyticsSignatureRef.current) {
          analyticsSignatureRef.current = nextAnalyticsSignature;
          setAnalytics(nextAnalytics);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
  const timer = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [router]);

  const topTenants = useMemo(() => (analytics?.byTenant || []).slice(0, 5), [analytics]);

  // Business KPIs
  const businessKpis = useMemo(() => {
    const activeTenants = tenants.filter((t) => t.subscriptionStatus === "active").length;
    const trialingTenants = tenants.filter((t) => t.subscriptionStatus === "trialing").length;
    const pendingTenants = tenants.filter((t) => t.subscriptionStatus === "pending_payment").length;
    const monthlyRecurringRevenue = tenants
      .filter((t) => t.subscriptionStatus === "active")
      .reduce((acc, t) => acc + (t.monthlyCost || 0), 0);
    const integrationReadiness = tenants.filter((t) => t.integrationReady).length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      trialingTenants,
      pendingTenants,
      monthlyRecurringRevenue,
      integrationReadyRate: tenants.length > 0 ? Math.round((integrationReadiness / tenants.length) * 100) : 0,
    };
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (tenantFilter !== "all" && t.subscriptionStatus !== tenantFilter) return false;
      if (searchTenant && !t.businessName.toLowerCase().includes(searchTenant.toLowerCase())) return false;
      return true;
    });
  }, [tenants, tenantFilter, searchTenant]);

  const expandedLog = useMemo(
    () => logs.find((item) => item.id === expandedLogId) || null,
    [logs, expandedLogId]
  );

  const saveWorkflowStatus = async (log: CallLog) => {
    if (log.id.startsWith("sample-")) {
      setLogs((prev) =>
        prev.map((item) =>
          item.id === log.id
            ? { ...item, workflowStatus: statusDraft[log.id] || item.workflowStatus }
            : item
        )
      );
      return;
    }

    const workflowStatus = statusDraft[log.id] || log.workflowStatus;

    try {
      const response = await fetch("/api/call-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: log.id,
          workflowStatus,
          status: workflowStatus === "resolved" ? "closed" : "in_progress",
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      setLogs((prev) => prev.map((item) => (item.id === data.log.id ? data.log : item)));
    } catch (error) {
      console.error("Failed to update workflow:", error);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "22px",
        background:
          "radial-gradient(900px 420px at 10% 0%, rgba(34,211,238,0.16), transparent 66%), linear-gradient(145deg, #030712 0%, #0b1220 58%, #020617 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          <div>
            <div style={{ color: "#4f6895", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Admin Developer Console
            </div>
            <h1 style={{ margin: "6px 0 0", fontSize: "30px", color: "#e2e8f0" }}>Asistoria - Platform Admin</h1>
            <p style={{ marginTop: "6px", color: "#93c5fd" }}>
              Business analytics, tenant management, call logs, and operational metrics.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a href="/dashboard" style={{ color: "#ccfbf1", textDecoration: "none", border: "1px solid rgba(45,212,191,0.32)", padding: "8px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.9)" }}>
              Business Dashboard
            </a>
            <button onClick={logout} style={{ color: "#ccfbf1", background: "rgba(15,23,42,0.9)", border: "1px solid rgba(45,212,191,0.32)", padding: "8px 12px", borderRadius: "10px", cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "0px", marginBottom: "20px", borderBottom: "1px solid #dbe7ff" }}>
          {(["overview", "tenants", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                background: activeTab === tab ? "#ffffff" : "transparent",
                border: activeTab === tab ? "1px solid #dbe7ff" : "none",
                borderBottom: activeTab === tab ? "1px solid #0369a1" : "1px solid #dbe7ff",
                borderTop: activeTab === tab ? "1px solid #dbe7ff" : "none",
                borderLeft: activeTab === tab ? "1px solid #dbe7ff" : "none",
                borderRight: activeTab === tab ? "1px solid #dbe7ff" : "none",
                color: activeTab === tab ? "#0ea5e9" : "#4f6895",
                cursor: "pointer",
                fontWeight: activeTab === tab ? 700 : 500,
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ marginTop: "24px", color: "#4f6895" }}>Loading admin metrics...</div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
                {/* Business KPIs Row 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                  {[
                    { label: "Total Businesses", value: businessKpis.totalTenants, color: "#3b82f6" },
                    { label: "Active Subscriptions", value: businessKpis.activeTenants, color: "#10b981" },
                    { label: "Trialing Businesses", value: businessKpis.trialingTenants, color: "#f59e0b" },
                    { label: "Pending Setup", value: businessKpis.pendingTenants, color: "#ef4444" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", padding: "14px", borderLeft: `3px solid ${kpi.color}` }}>
                      <div style={{ color: "#4f6895", fontSize: "11px", textTransform: "uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px", color: kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Business KPIs Row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Monthly Recurring Revenue", value: `£${businessKpis.monthlyRecurringRevenue.toFixed(2)}`, color: "#8b5cf6" },
                    { label: "Integration Ready Rate", value: `${businessKpis.integrationReadyRate}%`, color: "#06b6d4" },
                    { label: "Avg Call Duration", value: `${analytics?.avgDurationSeconds || 0}s`, color: "#ec4899" },
                    { label: "Total Calls Today", value: analytics?.totalCalls || 0, color: "#14b8a6" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", padding: "14px", borderLeft: `3px solid ${kpi.color}` }}>
                      <div style={{ color: "#4f6895", fontSize: "11px", textTransform: "uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px", color: kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Call and Tenant Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", padding: "14px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "10px" }}>Active Tenants by Plan</div>
                    <div style={{ color: "#4f6895", lineHeight: 2 }}>
                      <div>🚀 Enterprise: {tenants.filter((t) => t.selectedPlan === "enterprise" && t.subscriptionStatus === "active").length}</div>
                      <div>📈 Growth: {tenants.filter((t) => t.selectedPlan === "growth" && t.subscriptionStatus === "active").length}</div>
                      <div>⭐ Starter: {tenants.filter((t) => t.selectedPlan === "starter" && t.subscriptionStatus === "active").length}</div>
                    </div>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", padding: "14px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "10px" }}>Integration Distribution</div>
                    <div style={{ color: "#4f6895", lineHeight: 2 }}>
                      <div>🌐 Widget: {tenants.filter((t) => t.selectedIntegration === "website-widget").length}</div>
                      <div>📞 Phone: {tenants.filter((t) => t.selectedIntegration === "phone-number").length}</div>
                      <div>⚙️ API: {tenants.filter((t) => t.selectedIntegration === "api-webhooks").length}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TENANTS TAB */}
            {activeTab === "tenants" && (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTenant}
                    onChange={(e) => setSearchTenant(e.target.value)}
                    style={{
                      flex: "1 1 200px",
                      padding: "8px 12px",
                      background: "#ffffff",
                      border: "1px solid #bfd1f5",
                      borderRadius: "8px",
                      color: "#132145",
                    }}
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["all", "active", "trialing", "pending"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTenantFilter(filter)}
                        style={{
                          padding: "8px 14px",
                          background: tenantFilter === filter ? "#0369a1" : "#dbe7ff",
                          border: tenantFilter === filter ? "1px solid #0ea5e9" : "1px solid #bfd1f5",
                          borderRadius: "8px",
                          color: "#132145",
                          cursor: "pointer",
                          textTransform: "capitalize",
                          fontWeight: tenantFilter === filter ? 600 : 400,
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#4f6895", borderBottom: "1px solid #dbe7ff" }}>
                          <th style={{ padding: "12px 14px" }}>Business Name</th>
                          <th style={{ padding: "12px 14px" }}>Plan</th>
                          <th style={{ padding: "12px 14px" }}>Integration</th>
                          <th style={{ padding: "12px 14px" }}>Status</th>
                          <th style={{ padding: "12px 14px" }}>Ready</th>
                          <th style={{ padding: "12px 14px" }}>Monthly Cost</th>
                          <th style={{ padding: "12px 14px" }}>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map((tenant) => (
                          <tr key={tenant.id} style={{ borderTop: "1px solid #dbe7ff" }}>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 600 }}>{tenant.businessName}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{tenant.tenantId}</div>
                            </td>
                            <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{tenant.selectedPlan || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: "12px" }}>
                                {tenant.selectedIntegration === "website-widget" && "🌐 Widget"}
                                {tenant.selectedIntegration === "phone-number" && "📞 Phone"}
                                {tenant.selectedIntegration === "api-webhooks" && "⚙️ API"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: tenant.subscriptionStatus === "active" ? "rgba(16,185,129,0.2)" : tenant.subscriptionStatus === "trialing" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                                  color: tenant.subscriptionStatus === "active" ? "#10b981" : tenant.subscriptionStatus === "trialing" ? "#f59e0b" : "#ef4444",
                                  textTransform: "capitalize",
                                }}
                              >
                                {tenant.subscriptionStatus || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {tenant.integrationReady ? (
                                <span style={{ color: "#10b981", fontWeight: 600 }}>✓ Ready</span>
                              ) : (
                                <span style={{ color: "#ef4444", fontWeight: 600 }}>✗ Pending</span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 600 }}>£{tenant.monthlyCost.toFixed(2)}</td>
                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "#4f6895" }}>
                              {new Date(tenant.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* LOGS TAB */}
            {activeTab === "logs" && (
              <div style={{ background: "#ffffff", border: "1px solid #dbe7ff", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #dbe7ff", fontWeight: 700 }}>Interactive Call Logs</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "980px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#4f6895" }}>
                        <th style={{ padding: "8px 10px" }}>Time</th>
                        <th style={{ padding: "8px 10px" }}>Tenant</th>
                        <th style={{ padding: "8px 10px" }}>Ticket</th>
                        <th style={{ padding: "8px 10px" }}>Issue</th>
                        <th style={{ padding: "8px 10px" }}>Workflow</th>
                        <th style={{ padding: "8px 10px" }}>Duration</th>
                        <th style={{ padding: "8px 10px" }}>Cost</th>
                        <th style={{ padding: "8px 10px" }}>Transcript</th>
                        <th style={{ padding: "8px 10px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const draft = statusDraft[log.id] || log.workflowStatus;
                        const estimatedCallCost = Number((((log.durationSeconds || 0) / 60) * 0.12).toFixed(2));

                        return (
                          <tr key={log.id} style={{ borderTop: "1px solid #dbe7ff" }}>
                            <td style={{ padding: "8px 10px" }}>{new Date(log.startedAt).toLocaleString()}</td>
                            <td style={{ padding: "8px 10px" }}>{log.tenantName}</td>
                            <td style={{ padding: "8px 10px" }}>{log.ticketId}</td>
                          <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>{log.issueType}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <select
                              value={draft}
                              onChange={(event) =>
                                setStatusDraft((prev) => ({
                                  ...prev,
                                  [log.id]: event.target.value as CallLog["workflowStatus"],
                                }))
                              }
                              style={{ borderRadius: "8px", border: "1px solid #bfd1f5", background: "#ffffff", color: "#132145", padding: "6px" }}
                            >
                              <option value="new">New</option>
                              <option value="awaiting_contractor">Awaiting contractor</option>
                              <option value="sent_to_contractor">Sent to contractor</option>
                              <option value="contractor_on_the_way">Contractor on the way</option>
                              <option value="reservation_confirmed">Reservation confirmed</option>
                              <option value="order_dispatched">Order dispatched</option>
                              <option value="guest_service_assigned">Guest service assigned</option>
                              <option value="event_quote_sent">Event quote sent</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                          <td style={{ padding: "8px 10px" }}>{log.durationSeconds}s</td>
                          <td style={{ padding: "8px 10px" }}>${estimatedCallCost.toFixed(2)}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <button
                              onClick={() => setExpandedLogId((prev) => (prev === log.id ? "" : log.id))}
                              style={{ border: "1px solid #bfd1f5", background: "#ffffff", color: "#1d4ed8", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}
                            >
                              {expandedLogId === log.id ? "Hide" : "View"}
                            </button>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <button
                              onClick={() => void saveWorkflowStatus(log)}
                              style={{ border: "1px solid #1d4ed8", background: "#1d4ed8", color: "white", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {expandedLogId ? (
                  <div style={{ borderTop: "1px solid #dbe7ff", padding: "12px 14px" }}>
                    <div style={{ color: "#4f6895", marginBottom: "8px", fontWeight: 700 }}>Transcript</div>
                    {(expandedLog?.transcript || []).map((entry) => (
                      <div key={entry.id} style={{ marginBottom: "6px", color: "#17315f", fontSize: "13px" }}>
                        <strong style={{ color: entry.speaker === "agent" ? "#86efac" : "#4f6895" }}>
                          {entry.speaker === "agent" ? "Agent" : "Caller"}
                        </strong>
                        : {entry.text}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

