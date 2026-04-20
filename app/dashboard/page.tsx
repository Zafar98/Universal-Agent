"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BusinessModelCard = {
  id: string;
  name: string;
  businessModel: string;
  focus: string;
};

type BusinessModelApiItem = {
  id?: string;
  name?: string;
  summary?: string;
  overview?: string;
};

type BusinessSession = {
  isAdmin?: boolean;
  businessName: string;
  tenantId: string;
  businessModelId: string;
  agentCount: number;
  selectedPlan?: string;
  selectedIntegration?: string;
  subscriptionStatus?: "pending_payment" | "trialing" | "active" | "past_due" | "canceled";
  integrationReady?: boolean;
  activationCompletedAt?: string | null;
  verificationMethod: "email" | "phone";
  email: string | null;
  phone: string | null;
};

type TranscriptEntry = {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: string;
};

type CallAnalytics = {
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

type CallLog = {
  id: string;
  tenantId: string;
  tenantName: string;
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  issueType: "repair" | "complaint" | "billing" | "reservation" | "order" | "general";
  urgency: "low" | "medium" | "high";
  businessUnit:
    | "Repairs"
    | "Customer Care"
    | "Billing"
    | "General Support"
    | "Escalations"
    | "Reservations"
    | "Orders"
    | "Front of House";
  departmentId: string;
  departmentName: string;
  detectedEmotion: "neutral" | "frustrated" | "anxious" | "distressed";
  handoffRecommended: boolean;
  summary: string;
  ticketId: string;
  ticketStatus: "open" | "pending" | "solved" | "unknown";
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
  handoffPayload: Record<string, string>;
  contractorName: string;
  contractorEta: string;
  status: "open" | "in_progress" | "closed";
  transcript: TranscriptEntry[];
};

type WorkflowDraft = {
  workflowStatus: CallLog["workflowStatus"];
  contractorName: string;
  contractorEta: string;
};

type BusinessOperation = {
  id: string;
  tenantId: string;
  operationType: "ticket" | "reservation" | "order" | "appointment" | "case";
  status: "new" | "in_progress" | "confirmed" | "completed";
  departmentName: string;
  title: string;
  summary: string;
  externalReference: string;
  createdAt: string;
};

type HandoffQueueItem = {
  id: string;
  tenantId: string;
  departmentName: string;
  priority: "normal" | "urgent";
  reason: string;
  status: "open" | "assigned" | "resolved";
  assignedTo: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [business, setBusiness] = useState<BusinessSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [workflowDrafts, setWorkflowDrafts] = useState<Record<string, WorkflowDraft>>({});
  const [businessModels, setBusinessModels] = useState<BusinessModelCard[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string>("");
  const [expandedExampleId, setExpandedExampleId] = useState<string>("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [operations, setOperations] = useState<BusinessOperation[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffQueueItem[]>([]);

  const sampleLogs: CallLog[] = [
    {
      id: "sample-dashboard-1",
      tenantId: business?.tenantId || "developers-housing",
      tenantName: business?.businessName || "Developers Housing",
      sessionId: "sample-session-1",
      startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      endedAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      durationSeconds: 180,
      issueType: "repair",
      urgency: "high",
      businessUnit: "Repairs",
      departmentId: "repairs",
      departmentName: "Repairs",
      detectedEmotion: "frustrated",
      handoffRecommended: true,
      summary: "Caller reported urgent leak in kitchen ceiling and asked for emergency attendance.",
      ticketId: "SAMPLE-01",
      ticketStatus: "open",
      workflowStatus: "awaiting_contractor",
      workflowCallType: "Emergency repair",
      handoffPayload: {
        guest_name: "",
      },
      contractorName: "",
      contractorEta: "",
      status: "open",
      transcript: [
        { id: "t1", speaker: "user", text: "There is a leak coming from my ceiling.", timestamp: new Date().toISOString() },
        { id: "t2", speaker: "agent", text: "Thanks for confirming. I will log an urgent repair dispatch now.", timestamp: new Date().toISOString() },
      ],
    },
  ];

  const exampleRecordedCalls: CallLog[] = [
    {
      id: "example-recorded-1",
      tenantId: "example-housing",
      tenantName: "Example Property Services",
      sessionId: "example-session-1",
      startedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      endedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      durationSeconds: 296,
      issueType: "repair",
      urgency: "high",
      businessUnit: "Repairs",
      departmentId: "repairs",
      departmentName: "Repairs Desk",
      detectedEmotion: "frustrated",
      handoffRecommended: true,
      summary: "Caller reported a boiler leak and the agent collected diagnostics, logged emergency priority, and queued contractor dispatch.",
      ticketId: "EXAMPLE-5001",
      ticketStatus: "open",
      workflowStatus: "awaiting_contractor",
      workflowCallType: "Emergency repair",
      handoffPayload: {
        location: "Flat 22B",
        hazard: "water leak",
      },
      contractorName: "",
      contractorEta: "",
      status: "in_progress",
      transcript: [
        { id: "e1", speaker: "user", text: "My boiler has started leaking and water is spreading across the kitchen.", timestamp: new Date().toISOString() },
        { id: "e2", speaker: "agent", text: "I understand this is urgent. I have logged this as a high-priority emergency repair.", timestamp: new Date().toISOString() },
      ],
    },
    {
      id: "example-recorded-2",
      tenantId: "example-hotel",
      tenantName: "Example City Hotel",
      sessionId: "example-session-2",
      startedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      endedAt: new Date(Date.now() - 1000 * 60 * 126).toISOString(),
      durationSeconds: 214,
      issueType: "reservation",
      urgency: "low",
      businessUnit: "Front of House",
      departmentId: "reservations",
      departmentName: "Reservations",
      detectedEmotion: "neutral",
      handoffRecommended: false,
      summary: "Guest requested a two-night booking, confirmed breakfast preference, and received instant reservation confirmation.",
      ticketId: "EXAMPLE-5002",
      ticketStatus: "solved",
      workflowStatus: "reservation_confirmed",
      workflowCallType: "New booking",
      handoffPayload: {
        room_type: "double",
        check_in: "Friday",
      },
      contractorName: "",
      contractorEta: "",
      status: "closed",
      transcript: [
        { id: "e3", speaker: "user", text: "Can I reserve a double room for Friday and Saturday night?", timestamp: new Date().toISOString() },
        { id: "e4", speaker: "agent", text: "Absolutely. I have confirmed your booking with breakfast included.", timestamp: new Date().toISOString() },
      ],
    },
    {
      id: "example-recorded-3",
      tenantId: "example-retail",
      tenantName: "Example Retail Support",
      sessionId: "example-session-3",
      startedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      endedAt: new Date(Date.now() - 1000 * 60 * 176).toISOString(),
      durationSeconds: 188,
      issueType: "billing",
      urgency: "medium",
      businessUnit: "Billing",
      departmentId: "billing",
      departmentName: "Billing & Accounts",
      detectedEmotion: "anxious",
      handoffRecommended: false,
      summary: "Customer queried a duplicate charge; the agent verified order details and issued a billing review ticket.",
      ticketId: "EXAMPLE-5003",
      ticketStatus: "pending",
      workflowStatus: "new",
      workflowCallType: "Billing dispute",
      handoffPayload: {
        order_ref: "A-8821",
      },
      contractorName: "",
      contractorEta: "",
      status: "open",
      transcript: [
        { id: "e5", speaker: "user", text: "I can see the same charge twice on my statement.", timestamp: new Date().toISOString() },
        { id: "e6", speaker: "agent", text: "Thank you. I have opened a billing review and linked your order details.", timestamp: new Date().toISOString() },
      ],
    },
  ];

  const exportCsv = (rows: CallLog[]) => {
    const header = [
      "time",
      "tenant",
      "ticket_id",
      "ticket_status",
      "issue",
      "urgency",
      "business_unit",
      "emotion",
      "handoff_recommended",
      "duration_seconds",
      "summary",
    ];

    const data = rows.map((row) => [
      new Date(row.startedAt).toISOString(),
      row.tenantName,
      row.ticketId,
      row.ticketStatus,
      row.issueType,
      row.urgency,
      row.businessUnit,
      row.detectedEmotion,
      row.handoffRecommended ? "yes" : "no",
      String(row.durationSeconds),
      row.summary.replace(/\n/g, " "),
    ]);

    const csv = [header, ...data]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-ops-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const updateWorkflowDraft = (id: string, patch: Partial<WorkflowDraft>) => {
    setWorkflowDrafts((prev) => {
      const current = prev[id] || {
        workflowStatus: "new",
        contractorName: "",
        contractorEta: "",
      };

      return {
        ...prev,
        [id]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const applyWorkflowUpdate = async (log: CallLog) => {
    const draft = workflowDrafts[log.id] || {
      workflowStatus: log.workflowStatus,
      contractorName: log.contractorName,
      contractorEta: log.contractorEta,
    };

    if (log.id.startsWith("sample-dashboard")) {
      setLogs((prev) =>
        prev.map((item) =>
          item.id === log.id
            ? {
                ...item,
                workflowStatus: draft.workflowStatus,
                contractorName: draft.contractorName,
                contractorEta: draft.contractorEta,
              }
            : item
        )
      );
      return;
    }

    const closedStatuses = new Set<CallLog["workflowStatus"]>([
      "resolved",
      "reservation_confirmed",
      "order_dispatched",
      "event_quote_sent",
    ]);
    const status = closedStatuses.has(draft.workflowStatus) ? "closed" : "in_progress";

    try {
      const response = await fetch("/api/call-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: log.id,
          workflowStatus: draft.workflowStatus,
          workflowCallType: log.workflowCallType,
          handoffPayload: log.handoffPayload,
          contractorName: draft.contractorName,
          contractorEta: draft.contractorEta,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to update workflow");
        return;
      }

      const data = await response.json();
      const updated = data.log as CallLog;

      setLogs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error("Failed to update workflow:", error);
      alert("Failed to update workflow");
    }
  };

  const getWorkflowDraft = (log: CallLog): WorkflowDraft => {
    return (
      workflowDrafts[log.id] || {
        workflowStatus: log.workflowStatus,
        contractorName: log.contractorName,
        contractorEta: log.contractorEta,
      }
    );
  };

  useEffect(() => {
    const applyViewport = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    applyViewport();
    window.addEventListener("resize", applyViewport);

    return () => {
      window.removeEventListener("resize", applyViewport);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [sessionResponse, logResponse, modelResponse, operationsResponse] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/call-logs?syncTickets=1"),
          fetch("/api/business-models"),
          fetch("/api/operations"),
        ]);
        const sessionData = await sessionResponse.json().catch(() => ({}));
        const data = await logResponse.json().catch(() => ({}));
        const modelData = await modelResponse.json().catch(() => ({}));
        const operationsData = await operationsResponse.json().catch(() => ({}));
        if (active) {
          const supportedSetupIds = new Set(["housing-association", "restaurant", "hotel"]);
          const currentBusiness = sessionData.business || null;
          setBusiness(currentBusiness);

          if (currentBusiness && !currentBusiness.isAdmin) {
            // First-time users: redirect to Get Started page if they haven't selected plan/integration yet
            if (!currentBusiness.selectedPlan || !currentBusiness.selectedIntegration) {
              router.replace("/dashboard/started");
              return;
            }
            // Setup incomplete: redirect to Setup page if not activated yet
            if (currentBusiness.subscriptionStatus !== "trialing" && currentBusiness.subscriptionStatus !== "active") {
              router.replace("/dashboard/setup");
              return;
            }
          }

          const fetchedLogs = Array.isArray(data.logs) ? (data.logs as CallLog[]) : [];
          setLogs(fetchedLogs.length > 0 ? fetchedLogs : sampleLogs);
          setAnalytics(data.analytics || null);
          setBusinessModels(
            Array.isArray(modelData.businessModels)
                ? (modelData.businessModels as BusinessModelApiItem[])
                  .filter((model) => supportedSetupIds.has(String(model.id || "")))
                  .map((model) => ({
                  id: String(model.id || ""),
                  name: String(model.name || "Business"),
                  businessModel: "Operations Blueprint",
                  focus: String(model.summary || model.overview || "Business workflow setup"),
                }))
              : []
          );
          setOperations(Array.isArray(operationsData.operations) ? operationsData.operations : []);
          setHandoffs(Array.isArray(operationsData.handoffs) ? operationsData.handoffs : []);
        }
      } catch (error) {
        console.error("Failed to load call logs:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (urgencyFilter !== "all" && log.urgency !== urgencyFilter) {
        return false;
      }

      if (issueFilter !== "all" && log.issueType !== issueFilter) {
        return false;
      }

      if (tenantFilter !== "all" && log.tenantId !== tenantFilter) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const haystack = `${log.summary} ${log.ticketId} ${log.businessUnit} ${log.tenantName}`.toLowerCase();
      return haystack.includes(searchText);
    });
  }, [issueFilter, logs, search, tenantFilter, urgencyFilter]);

  const metrics = useMemo(() => {
    const total = filteredLogs.length;
    const open = filteredLogs.filter((log) => log.status === "open").length;
    const urgent = filteredLogs.filter((log) => log.urgency === "high").length;
    const avgDuration =
      total === 0
        ? 0
        : Math.round(filteredLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / total);

    const estimatedCost = Number((((filteredLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / 60) * 0.12)).toFixed(2));

    return { total, open, urgent, avgDuration, estimatedCost };
  }, [filteredLogs]);

  const tenantOptions = useMemo(() => {
    const unique = Array.from(new Set(logs.map((log) => `${log.tenantId}|${log.tenantName}`)));
    return unique.map((entry) => {
      const [id, name] = entry.split("|");
      return { id, name };
    });
  }, [logs]);

  const businessStatusTone =
    business?.subscriptionStatus === "active"
      ? { color: "#166534", background: "#dcfce7", border: "1px solid #86efac", label: "Subscription active" }
      : business?.subscriptionStatus === "trialing"
        ? { color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", label: "Trial mode" }
        : { color: "#9a3412", background: "#ffedd5", border: "1px solid #fdba74", label: "Action required" };

  const dashboardNextStep = !business || business.isAdmin
    ? "Monitor platform-wide call activity and intervene on urgent workflows when needed."
    : !business.selectedPlan || !business.selectedIntegration
      ? "Finish your initial setup so your business workspace is fully configured."
      : business.subscriptionStatus !== "trialing" && business.subscriptionStatus !== "active"
        ? "Complete subscription activation so your live agent can run without interruption."
        : !business.integrationReady
          ? "Finish your integration so calls and routing can flow into your business systems."
          : "Your workspace is live. Review calls, transcripts, operations, and escalations from here.";

  const quickActions = business?.isAdmin
    ? [
        { href: "/admin", label: "Open admin console", detail: "Platform-level tenants, controls, and monitoring." },
      ]
    : [
        { href: "/dashboard/setup", label: "Continue setup", detail: "Finish plan, activation, and routing steps." },
        { href: "/dashboard/staff", label: "Manage staff", detail: "Control who receives handoffs and internal updates." },
        { href: "/dashboard/notifications", label: "Notification rules", detail: "Define alerts for urgent calls and exceptions." },
        ...(business ? [{ href: `/dashboard/${business.tenantId}`, label: "Department agents", detail: "Open the agent setup for your business unit." }] : []),
      ];

  const visibilityCards = [
    { title: "Account health", description: "Subscription status, integration readiness, plan details, and business verification." },
    { title: "Live call activity", description: "Recent calls, urgency level, ticket status, summaries, and searchable transcripts." },
    { title: "Autonomous actions", description: "Operations created by the agent, fallback handoffs, and workflow progress." },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background:
          "radial-gradient(900px 420px at 12% 0%, rgba(34,211,238,0.18), transparent 65%), radial-gradient(880px 460px at 88% 18%, rgba(52,211,153,0.14), transparent 68%), linear-gradient(145deg, #030712 0%, #0b1220 54%, #020617 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#67e8f9", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              Customer Dashboard
            </div>
            <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "34px", letterSpacing: "-0.03em" }}>
              {business?.isAdmin ? "Platform Operations" : "AI Call Dashboard"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {business?.isAdmin ? (
              <Link
                href="/admin"
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(45,212,191,0.32)",
                  borderRadius: "999px",
                  background: "rgba(15,23,42,0.92)",
                  color: "#ccfbf1",
                  padding: "8px 12px",
                  fontWeight: 600,
                }}
              >
                Admin Console
              </Link>
            ) : null}
            <button
              onClick={handleLogout}
              style={{
                border: "1px solid rgba(45,212,191,0.32)",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.92)",
                color: "#ccfbf1",
                cursor: "pointer",
                padding: "8px 12px",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <p style={{ color: "#93c5fd", marginTop: "10px", fontSize: "15px", lineHeight: 1.7, maxWidth: "840px" }}>
          This is the main workspace your customers log into after signup. It gives them one place to monitor call traffic, inspect transcripts, confirm setup status, and manage the business actions created by the agent.
        </p>

        <div
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #0f172a 0%, #0f2858 100%)",
            borderRadius: "24px",
            border: "1px solid rgba(37,99,235,0.18)",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(15,23,42,0.16)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "1.35fr 0.95fr", gap: "18px", alignItems: "start" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "999px", padding: "8px 12px", ...businessStatusTone }}>
                <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{businessStatusTone.label}</span>
              </div>
              <div style={{ marginTop: "16px", color: "#e2e8f0", fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {business?.isAdmin ? "Workspace overview" : "Business overview"}
              </div>
              <div style={{ marginTop: "8px", color: "white", fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                {business?.businessName || "Loading workspace"}
              </div>
              <p style={{ marginTop: "12px", marginBottom: 0, color: "#bfdbfe", fontSize: "15px", lineHeight: 1.75, maxWidth: "700px" }}>
                {dashboardNextStep}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "18px" }}>
                {[
                  { label: "Plan", value: business?.selectedPlan || (business?.isAdmin ? "Platform" : "Not selected") },
                  { label: "Integration", value: business?.selectedIntegration || (business?.integrationReady ? "Ready" : "Pending setup") },
                  { label: "Verification", value: business?.verificationMethod || "email" },
                  { label: "Agents", value: String(business?.agentCount || 0) },
                ].map((item) => (
                  <div key={item.label} style={{ borderRadius: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(148,163,184,0.16)", padding: "14px" }}>
                    <div style={{ color: "#93c5fd", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800 }}>{item.label}</div>
                    <div style={{ color: "#f8fafc", fontSize: "17px", fontWeight: 800, marginTop: "6px", textTransform: "capitalize" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {visibilityCards.map((item) => (
                <div key={item.title} style={{ borderRadius: "18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(148,163,184,0.16)", padding: "16px" }}>
                  <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.65, marginTop: "6px" }}>{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {business ? (
          <div
            style={{
              marginTop: "18px",
              background: "rgba(8,15,32,0.92)",
              borderRadius: "18px",
              border: "1px solid rgba(45,212,191,0.22)",
              boxShadow: "0 14px 28px rgba(2,6,23,0.45)",
              padding: "18px",
            }}
          >
            <div style={{ color: "#67e8f9", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
              {business.isAdmin ? "Platform Admin Workspace" : "Workspace Status"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: "28px", fontWeight: 800 }}>{business.businessName}</div>
                <div style={{ color: "#94a3b8", marginTop: "6px" }}>
                  {business.isAdmin
                    ? "Viewing all tenants, all calls, and all contractor workflows"
                    : `Tenant ID: ${business.tenantId} · Agents requested: ${business.agentCount} · Verification: ${business.verificationMethod}`}
                </div>
              </div>
              {!business.isAdmin && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#f0f9ff", border: "1px solid #7dd3fc", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#0369a1", textTransform: "uppercase", fontWeight: 600 }}>Subscription</div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        marginTop: "4px",
                        color: business.subscriptionStatus === "active" ? "#10b981" : "#f59e0b",
                        textTransform: "capitalize",
                      }}
                    >
                      {business.subscriptionStatus || "—"}
                    </div>
                  </div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#059669", textTransform: "uppercase", fontWeight: 600 }}>Integration</div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        marginTop: "4px",
                        color: business.integrationReady ? "#10b981" : "#ef4444",
                      }}
                    >
                      {business.integrationReady ? "✓ Ready" : "⚠ Pending"}
                    </div>
                  </div>
                </div>
              )}
              {!business.isAdmin ? (
                <Link
                  href={`/dashboard/${business.tenantId}`}
                  style={{
                    textDecoration: "none",
                    color: "white",
                    background: "#1d4ed8",
                    borderRadius: "999px",
                    padding: "10px 14px",
                    fontWeight: 700,
                  }}
                >
                  View department agents
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginTop: "18px",
            marginBottom: "18px",
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                background: "white",
                borderRadius: "18px",
                border: "1px solid #dbe7ff",
                boxShadow: "0 10px 24px rgba(16,24,40,0.06)",
                padding: "16px",
                textDecoration: "none",
              }}
            >
              <div style={{ color: "#0f1e3d", fontWeight: 800, fontSize: "17px" }}>{action.label}</div>
              <div style={{ color: "#5f76a6", fontSize: "13px", lineHeight: 1.65, marginTop: "8px" }}>{action.detail}</div>
              <div style={{ color: "#1d4ed8", fontSize: "13px", fontWeight: 800, marginTop: "12px" }}>Open section →</div>
            </Link>
          ))}
        </div>

        {!business?.isAdmin ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "14px",
            marginTop: "18px",
            marginBottom: "18px",
          }}
        >
          {businessModels.map((business) => (
            <Link
              key={business.id}
              href={`/dashboard/${business.id}`}
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #dbe7ff",
                boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
                padding: "16px",
                textDecoration: "none",
              }}
            >
              <div style={{ color: "#5c75a7", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {business.businessModel}
              </div>
              <div style={{ color: "#102349", fontSize: "22px", fontWeight: 800, marginTop: "6px" }}>
                {business.name}
              </div>
              <p style={{ color: "#4f6895", marginTop: "10px", lineHeight: 1.5 }}>{business.focus}</p>
              <div style={{ color: "#1d4ed8", fontWeight: 700, marginTop: "12px" }}>Included blueprint</div>
            </Link>
          ))}
        </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobileView ? "1fr" : "2fr 1fr 1fr 1fr auto",
            gap: "10px",
            marginTop: "12px",
            marginBottom: "12px",
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket, summary, team, tenant..."
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #c6d7f6" }}
          />
          <select
            value={urgencyFilter}
            onChange={(event) => setUrgencyFilter(event.target.value)}
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #c6d7f6" }}
          >
            <option value="all">All urgency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={issueFilter}
            onChange={(event) => setIssueFilter(event.target.value)}
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #c6d7f6" }}
          >
            <option value="all">All issues</option>
            <option value="repair">Repair</option>
            <option value="complaint">Complaint</option>
            <option value="billing">Billing</option>
            <option value="reservation">Reservation</option>
            <option value="order">Order</option>
            <option value="general">General</option>
          </select>
          <select
            value={tenantFilter}
            onChange={(event) => setTenantFilter(event.target.value)}
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #c6d7f6" }}
          >
            <option value="all">All tenants</option>
            {tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportCsv(filteredLogs)}
            style={{
              border: "1px solid #bfd1f5",
              borderRadius: "10px",
              background: "white",
              color: "#21447f",
              cursor: "pointer",
              padding: "8px 12px",
              fontWeight: 700,
            }}
          >
            Export CSV
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            marginTop: "18px",
            marginBottom: "18px",
          }}
        >
          {[
            { label: "Total Calls", value: metrics.total },
            { label: "Open Tickets", value: metrics.open },
            { label: "High Urgency", value: metrics.urgent },
            { label: "Avg Duration (sec)", value: metrics.avgDuration },
            { label: "Estimated Cost", value: `$${analytics?.estimatedCost?.toFixed(2) || metrics.estimatedCost.toFixed(2)}` },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid #dbe7ff",
                boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
              }}
            >
              <div style={{ color: "#4b6498", fontSize: "13px", marginBottom: "6px" }}>{card.label}</div>
              <div style={{ color: "#0f1e3d", fontSize: "28px", fontWeight: 700 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid #dbe7ff",
            boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5eeff", color: "#1a2f5e", fontWeight: 700 }}>
            Recent Calls
          </div>

          {loading ? (
            <div style={{ padding: "16px", color: "#4b6498" }}>Loading call logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: "16px", color: "#4b6498" }}>No calls logged yet.</div>
          ) : (
            isMobileView ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", padding: "10px" }}>
                {filteredLogs.map((log) => {
                  const draft = getWorkflowDraft(log);
                  return (
                    <div key={log.id} style={{ border: "1px solid #dbe7ff", borderRadius: "12px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, color: "#102349" }}>{log.ticketId}</div>
                        <div style={{ color: "#4f6895", fontSize: "12px" }}>{new Date(log.startedAt).toLocaleString()}</div>
                      </div>
                      <div style={{ color: "#17315f", marginTop: "6px", fontSize: "13px" }}>{log.tenantName} • {log.departmentName}</div>
                      <div style={{ color: "#4f6895", marginTop: "6px", fontSize: "13px", textTransform: "capitalize" }}>
                        {log.issueType} • {log.urgency} • {log.durationSeconds}s
                      </div>
                      <div style={{ marginTop: "10px", color: "#17315f", fontSize: "13px" }}>{log.summary}</div>

                      <div style={{ marginTop: "10px" }}>
                        <label style={{ display: "block", color: "#4f6895", fontSize: "12px", marginBottom: "6px" }}>Workflow</label>
                        <select
                          value={draft.workflowStatus}
                          onChange={(event) =>
                            updateWorkflowDraft(log.id, {
                              workflowStatus: event.target.value as WorkflowDraft["workflowStatus"],
                            })
                          }
                          style={{ width: "100%", border: "1px solid #c6d7f6", borderRadius: "8px", padding: "8px" }}
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
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                        <input
                          value={draft.contractorName}
                          onChange={(event) => updateWorkflowDraft(log.id, { contractorName: event.target.value })}
                          placeholder="Contractor"
                          style={{ border: "1px solid #c6d7f6", borderRadius: "8px", padding: "8px" }}
                        />
                        <input
                          value={draft.contractorEta}
                          onChange={(event) => updateWorkflowDraft(log.id, { contractorEta: event.target.value })}
                          placeholder="ETA"
                          style={{ border: "1px solid #c6d7f6", borderRadius: "8px", padding: "8px" }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setExpandedLogId((prev) => (prev === log.id ? "" : log.id))}
                          style={{ border: "1px solid #bfd1f5", borderRadius: "8px", background: "white", color: "#21447f", cursor: "pointer", padding: "7px 10px", fontWeight: 700 }}
                        >
                          {expandedLogId === log.id ? "Hide Transcript" : "View Transcript"}
                        </button>
                        <button
                          onClick={() => applyWorkflowUpdate(log)}
                          style={{ border: "1px solid #bfd1f5", borderRadius: "8px", background: "white", color: "#21447f", cursor: "pointer", padding: "7px 10px", fontWeight: 700 }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1440px" }}>
                  <thead>
                    <tr style={{ background: "#f6f9ff", color: "#2d4678", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Time</th>
                      <th style={{ padding: "10px 12px" }}>Tenant</th>
                      <th style={{ padding: "10px 12px" }}>Ticket</th>
                      <th style={{ padding: "10px 12px" }}>Ticket Status</th>
                      <th style={{ padding: "10px 12px" }}>Issue</th>
                      <th style={{ padding: "10px 12px" }}>Urgency</th>
                      <th style={{ padding: "10px 12px" }}>Workflow</th>
                      <th style={{ padding: "10px 12px" }}>Workflow Type</th>
                      <th style={{ padding: "10px 12px" }}>Handoff Schema</th>
                      <th style={{ padding: "10px 12px" }}>Contractor</th>
                      <th style={{ padding: "10px 12px" }}>ETA</th>
                      <th style={{ padding: "10px 12px" }}>Business Unit</th>
                      <th style={{ padding: "10px 12px" }}>Department</th>
                      <th style={{ padding: "10px 12px" }}>Emotion</th>
                      <th style={{ padding: "10px 12px" }}>Handoff</th>
                      <th style={{ padding: "10px 12px" }}>Duration</th>
                      <th style={{ padding: "10px 12px" }}>Summary</th>
                      <th style={{ padding: "10px 12px" }}>Transcript</th>
                      <th style={{ padding: "10px 12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const draft = getWorkflowDraft(log);

                      return (
                      <tr key={log.id} style={{ borderTop: "1px solid #edf3ff", color: "#17315f" }}>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          {new Date(log.startedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 12px" }}>{log.tenantName}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{log.ticketId}</td>
                        <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{log.ticketStatus}</td>
                        <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{log.issueType}</td>
                        <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{log.urgency}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <select
                            value={draft.workflowStatus}
                            onChange={(event) =>
                              updateWorkflowDraft(log.id, {
                                workflowStatus: event.target.value as WorkflowDraft["workflowStatus"],
                              })
                            }
                            style={{ border: "1px solid #c6d7f6", borderRadius: "8px", padding: "6px" }}
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
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{log.workflowCallType}</td>
                        <td style={{ padding: "10px 12px", color: "#375081", maxWidth: "220px" }}>
                          {Object.keys(log.handoffPayload || {}).join(", ") || "n/a"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <input
                            value={draft.contractorName}
                            onChange={(event) =>
                              updateWorkflowDraft(log.id, {
                                contractorName: event.target.value,
                              })
                            }
                            placeholder="Contractor"
                            style={{ border: "1px solid #c6d7f6", borderRadius: "8px", padding: "6px", width: "140px" }}
                          />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <input
                            value={draft.contractorEta}
                            onChange={(event) =>
                              updateWorkflowDraft(log.id, {
                                contractorEta: event.target.value,
                              })
                            }
                            placeholder="ETA"
                            style={{ border: "1px solid #c6d7f6", borderRadius: "8px", padding: "6px", width: "120px" }}
                          />
                        </td>
                        <td style={{ padding: "10px 12px" }}>{log.businessUnit}</td>
                        <td style={{ padding: "10px 12px" }}>{log.departmentName}</td>
                        <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{log.detectedEmotion}</td>
                        <td style={{ padding: "10px 12px" }}>{log.handoffRecommended ? "Yes" : "No"}</td>
                        <td style={{ padding: "10px 12px" }}>{log.durationSeconds}s</td>
                        <td style={{ padding: "10px 12px", maxWidth: "420px" }}>{log.summary}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            onClick={() => setExpandedLogId((prev) => (prev === log.id ? "" : log.id))}
                            style={{
                              border: "1px solid #bfd1f5",
                              borderRadius: "8px",
                              background: "white",
                              color: "#21447f",
                              cursor: "pointer",
                              padding: "7px 10px",
                              fontWeight: 700,
                            }}
                          >
                            {expandedLogId === log.id ? "Hide" : "View"}
                          </button>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            onClick={() => applyWorkflowUpdate(log)}
                            style={{
                              border: "1px solid #bfd1f5",
                              borderRadius: "8px",
                              background: "white",
                              color: "#21447f",
                              cursor: "pointer",
                              padding: "7px 10px",
                              fontWeight: 700,
                            }}
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
            )
          )}

          {expandedLogId ? (
            <div style={{ borderTop: "1px solid #e5eeff", padding: "14px 16px" }}>
              <div style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: "8px" }}>Call Transcript</div>
              {(logs.find((item) => item.id === expandedLogId)?.transcript || []).length === 0 ? (
                <div style={{ color: "#4b6498" }}>No transcript available for this call.</div>
              ) : (
                (logs.find((item) => item.id === expandedLogId)?.transcript || []).map((entry) => (
                  <div key={entry.id} style={{ color: "#17315f", fontSize: "13px", marginBottom: "6px" }}>
                    <strong style={{ color: entry.speaker === "agent" ? "#1d4ed8" : "#2563eb" }}>
                      {entry.speaker === "agent" ? "Agent" : "Caller"}
                    </strong>
                    : {entry.text}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: "18px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #dbe7ff",
            boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5eeff", color: "#1a2f5e", fontWeight: 700 }}>
            Example Recorded Calls
          </div>
          <div style={{ padding: "10px 16px", color: "#4f6895", fontSize: "13px", borderBottom: "1px solid #edf3ff" }}>
            Example records for demonstration only. These are transcript-based sample calls, not live customer recordings.
          </div>

          <div style={{ display: "grid", gap: "10px", padding: "12px" }}>
            {exampleRecordedCalls.map((log) => (
              <div key={log.id} style={{ border: "1px solid #dbe7ff", borderRadius: "12px", padding: "12px", background: "#f9fbff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ color: "#102349", fontWeight: 800 }}>{log.ticketId}</div>
                  <div style={{ color: "#4f6895", fontSize: "12px" }}>{new Date(log.startedAt).toLocaleString()}</div>
                </div>
                <div style={{ marginTop: "6px", color: "#17315f", fontSize: "13px" }}>
                  {log.tenantName} • {log.departmentName} • {log.durationSeconds}s • {log.urgency}
                </div>
                <div style={{ marginTop: "8px", color: "#17315f", fontSize: "13px" }}>{log.summary}</div>
                <button
                  onClick={() => setExpandedExampleId((prev) => (prev === log.id ? "" : log.id))}
                  style={{
                    marginTop: "10px",
                    border: "1px solid #bfd1f5",
                    borderRadius: "8px",
                    background: "white",
                    color: "#21447f",
                    cursor: "pointer",
                    padding: "7px 10px",
                    fontWeight: 700,
                  }}
                >
                  {expandedExampleId === log.id ? "Hide Transcript" : "View Transcript"}
                </button>

                {expandedExampleId === log.id ? (
                  <div style={{ borderTop: "1px solid #e5eeff", marginTop: "10px", paddingTop: "10px" }}>
                    {log.transcript.map((entry) => (
                      <div key={entry.id} style={{ color: "#17315f", fontSize: "13px", marginBottom: "6px" }}>
                        <strong style={{ color: entry.speaker === "agent" ? "#1d4ed8" : "#2563eb" }}>
                          {entry.speaker === "agent" ? "Agent" : "Caller"}
                        </strong>
                        : {entry.text}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: "18px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #dbe7ff",
            boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5eeff", color: "#1a2f5e", fontWeight: 700 }}>
            Autonomous Execution Log
          </div>
          <div style={{ padding: "10px 16px", color: "#4f6895", fontSize: "13px", borderBottom: "1px solid #edf3ff" }}>
            This shows what the autonomous engine created from calls (operations) and any human fallback handoffs.
          </div>

          <div style={{ padding: "12px 16px", display: "grid", gap: "10px" }}>
            {operations.length === 0 ? (
              <div style={{ color: "#4b6498" }}>No autonomous operations yet. Place a call to generate one.</div>
            ) : (
              operations.slice(0, 8).map((operation) => (
                <div key={operation.id} style={{ border: "1px solid #dbe7ff", borderRadius: "12px", padding: "10px 12px", background: "#f9fbff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, color: "#102349" }}>{operation.title}</div>
                    <div style={{ fontSize: "12px", color: "#4f6895" }}>{new Date(operation.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: "5px", color: "#17315f", fontSize: "13px" }}>
                    {operation.departmentName} • {operation.operationType} • Ref: {operation.externalReference}
                  </div>
                  <div style={{ marginTop: "4px", color: "#4f6895", fontSize: "13px" }}>{operation.summary}</div>
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#1d4ed8", fontWeight: 700, textTransform: "capitalize" }}>
                    Status: {operation.status.replace(/_/g, " ")}
                  </div>
                </div>
              ))
            )}
          </div>

          {handoffs.length > 0 ? (
            <div style={{ borderTop: "1px solid #edf3ff", padding: "12px 16px" }}>
              <div style={{ fontWeight: 700, color: "#1a2f5e", marginBottom: "8px" }}>Human Fallback Handoffs</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {handoffs.slice(0, 6).map((handoff) => (
                  <div key={handoff.id} style={{ border: "1px solid #facc15", background: "#fffbeb", borderRadius: "10px", padding: "8px 10px" }}>
                    <div style={{ color: "#92400e", fontWeight: 700, fontSize: "13px" }}>
                      {handoff.departmentName} • {handoff.priority.toUpperCase()} • {handoff.status.toUpperCase()}
                    </div>
                    <div style={{ color: "#78350f", fontSize: "12px", marginTop: "4px" }}>{handoff.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
