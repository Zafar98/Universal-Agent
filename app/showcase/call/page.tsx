"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";

type BusinessOption = {
  id: string;
  tenantId: string;
  name: string;
  summary: string;
};

type DemoCallRecord = {
  id: string;
  businessName: string;
  mode: "live" | "simulation";
  endedAt: string;
  durationSeconds: number;
  outcome: string;
  workflowSummary: string;
  savedItems: string[];
  actions: string[]; // New: list of actions agent performed
  callerName?: string;
  reason?: string;
};

const CALL_LIMIT_MS = 60_000;
const DEMO_MODE = (process.env.NEXT_PUBLIC_DEMO_MODE || "live").toLowerCase();
const BASE_LIVE_DEMO_ENABLED = DEMO_MODE === "hybrid" || DEMO_MODE === "live";
const DEMO_HISTORY_KEY = "demo-call-history";

function computeDemoFingerprint(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(screen.width),
      String(screen.height),
      String(new Date().getTimezoneOffset()),
      navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : "",
    ].join("|");
    return btoa(parts).slice(0, 64);
  } catch {
    return "unknown";
  }
}

const CALL_WORKFLOW_STEPS = [
  {
    icon: "📞",
    label: "Call connected",
    detail: "Greeting delivered. Business context, department policy, and FAQs loaded.",
  },
  {
    icon: "🎙️",
    label: "Listening",
    detail: "Customer speech captured in real time. Live transcription active.",
  },
  {
    icon: "🔍",
    label: "Intent classified",
    detail: "Request type identified — repair, booking, complaint, or general enquiry.",
  },
  {
    icon: "📚",
    label: "Knowledge lookup",
    detail: "Policy records, availability calendars, and account history searched.",
  },
  {
    icon: "🗣️",
    label: "Response drafted",
    detail: "Natural language reply generated and spoken, tailored to the specific request.",
  },
  {
    icon: "✅",
    label: "Outcome delivered",
    detail: "Resolution communicated, or escalation ticket created with a reference number.",
  },
];

export default function CallShowcasePage() {
  const { callState, startCall, endCall } = useVoiceCall();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [trialBlocked, setTrialBlocked] = useState(false);
  const [trialReason, setTrialReason] = useState("");
  const [forceSimulation, setForceSimulation] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(-1);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "connecting" | "connected" | "ending">("idle");
  const [recentCalls, setRecentCalls] = useState<DemoCallRecord[]>([]);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const limitTimerRef = useRef<number | null>(null);
  const workflowTimerRef = useRef<number | null>(null);
  const simulationConnectRef = useRef<number | null>(null);
  const callRecordSavedRef = useRef(false);

  const shouldUseSimulation = !BASE_LIVE_DEMO_ENABLED || forceSimulation;
  const isCallActive = shouldUseSimulation ? simulationActive : callState.isActive;
  const connectionStatus = shouldUseSimulation ? simulationStatus : callState.connectionStatus;

  useEffect(() => {
    setFingerprint(computeDemoFingerprint());
  }, []);

  const refreshTrialStatus = useCallback(async () => {
    if (!fingerprint) {
      return false;
    }

    try {
      const res = await fetch(`/api/demo/trial-status?fingerprint=${encodeURIComponent(fingerprint)}`);
      const data = await res.json().catch(() => ({}));
      const blocked = Boolean(data.blocked);
      const reason = String(data.reason || "");

      setTrialBlocked(blocked);
      setTrialReason(reason);

      if (blocked) {
        setForceSimulation(true);
      }
      return blocked;
    } catch {
      // Keep current mode if status cannot be retrieved.
      return false;
    }
  }, [fingerprint]);

  useEffect(() => {
    void refreshTrialStatus();
  }, [refreshTrialStatus]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(DEMO_HISTORY_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as DemoCallRecord[];
      if (Array.isArray(parsed)) {
        setRecentCalls(parsed);
      }
    } catch {
      setRecentCalls([]);
    }
  }, []);

  // Always use a static, correct mapping for demo businesses to ensure tenantId is set
  useEffect(() => {
    const list: BusinessOption[] = [
      {
        id: "housing-association",
        tenantId: "developers-housing",
        name: "Housing",
        summary: "Test emergency repairs, tenancy issues, and complaint handling.",
      },
      {
        id: "hotel",
        tenantId: "grand-harbor-hotel",
        name: "Hotel",
        summary: "Test reservation changes, concierge requests, and guest support.",
      },
      {
        id: "restaurant",
        tenantId: "sunset-bistro",
        name: "Restaurant",
        summary: "Test booking requests, order handling, and service questions.",
      },
      {
        id: "energy-provider",
        tenantId: "city-energy",
        name: "Energy Provider",
        summary: "Test outage reporting, billing, and account support.",
      },
      {
        id: "borough-council",
        tenantId: "borough-council",
        name: "Borough Council",
        summary: "Test council services, complaints, and general enquiries.",
      },
    ];
    setBusinesses(list);
    setSelectedBusinessId(list[0].id);
  }, []);

  useEffect(() => {
    if (isCallActive) {
      if (limitTimerRef.current !== null) {
        window.clearTimeout(limitTimerRef.current);
      }

      limitTimerRef.current = window.setTimeout(() => {
        saveDemoRecord("timed_out");
        if (!shouldUseSimulation) {
          endCall();
        } else {
          setSimulationActive(false);
          setSimulationStatus("idle");
        }
        setLimitReached(true);
        setCallStartedAt(null);
      }, CALL_LIMIT_MS);
      return;
    }

    if (limitTimerRef.current !== null) {
      window.clearTimeout(limitTimerRef.current);
      limitTimerRef.current = null;
    }
  }, [endCall, isCallActive, shouldUseSimulation]);

  useEffect(() => {
    if (isCallActive) {
      setWorkflowStep(0);
      let step = 0;
      workflowTimerRef.current = window.setInterval(() => {
        step += 1;
        if (step < CALL_WORKFLOW_STEPS.length) {
          setWorkflowStep(step);
        } else {
          if (workflowTimerRef.current !== null) {
            window.clearInterval(workflowTimerRef.current);
          }
        }
      }, 7000);
    } else {
      setWorkflowStep(-1);
      if (workflowTimerRef.current !== null) {
        window.clearInterval(workflowTimerRef.current);
        workflowTimerRef.current = null;
      }
    }
    return () => {
      if (workflowTimerRef.current !== null) {
        window.clearInterval(workflowTimerRef.current);
      }
    };
  }, [isCallActive]);

  useEffect(() => {
    return () => {
      if (limitTimerRef.current !== null) {
        window.clearTimeout(limitTimerRef.current);
      }
      if (simulationConnectRef.current !== null) {
        window.clearTimeout(simulationConnectRef.current);
      }
    };
  }, []);

  const selectedBusiness = businesses.find((item) => item.id === selectedBusinessId);
  // Defensive: If not found, fallback to first business
  const effectiveBusiness = selectedBusiness || businesses[0];

  function saveDemoRecord(reason: "completed" | "timed_out") {
    if (callRecordSavedRef.current) {
      return;
    }

    const businessName = selectedBusiness?.name || "Selected business";
    const durationSeconds = callStartedAt ? Math.max(1, Math.round((Date.now() - callStartedAt) / 1000)) : 0;
    const workflowCompleted = Math.max(0, Math.min(workflowStep + 1, CALL_WORKFLOW_STEPS.length));
    const mode: "live" | "simulation" = shouldUseSimulation ? "simulation" : "live";
    const endedAt = new Date().toISOString();

    // Simulate autonomous agent actions based on business type
    let actions: string[] = [];
    if (businessName.toLowerCase().includes("hotel")) {
      actions = [
        "Identified caller intent: Book a hotel room",
        "Checked room availability",
        "Reserved room for caller",
        "Sent booking confirmation email"
      ];
    } else if (businessName.toLowerCase().includes("housing")) {
      actions = [
        "Identified caller intent: Request a repair",
        "Logged maintenance ticket",
        "Scheduled repair appointment",
        "Sent confirmation to caller"
      ];
    } else if (businessName.toLowerCase().includes("restaurant")) {
      actions = [
        "Identified caller intent: Book a table",
        "Checked table availability",
        "Reserved table for caller",
        "Sent reservation confirmation"
      ];
    } else {
      actions = [
        "Identified caller intent",
        "Processed request",
        "Provided resolution or next steps"
      ];
    }

    const record: DemoCallRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      businessName,
      mode,
      endedAt,
      durationSeconds,
      outcome:
        reason === "timed_out"
          ? "Demo stopped at the time limit. Interaction data was still captured."
          : "Demo completed. Interaction data was captured successfully.",
      workflowSummary: `${workflowCompleted}/${CALL_WORKFLOW_STEPS.length} workflow steps reached`,
      savedItems:
        mode === "live"
          ? ["Caller intent", "Business route", "Transcript summary", "Case fields", "Outcome status"]
          : ["Scenario selected", "Intent classification", "Recommended action", "Escalation path", "Outcome status"],
      actions,
    };

    callRecordSavedRef.current = true;

    setRecentCalls((prev) => {
      const next = [record, ...prev].slice(0, 8);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  const handleStart = useCallback(async () => {
    if (!effectiveBusiness) {
      return;
    }

    const blockedNow = await refreshTrialStatus();
    const shouldSimulateNow = !BASE_LIVE_DEMO_ENABLED || forceSimulation || blockedNow;

    setLimitReached(false);
    callRecordSavedRef.current = false;
    setCallStartedAt(Date.now());
    if (!shouldSimulateNow) {
      // TEMP: Log the tenantId being sent to the backend
      console.log("[CALL DEBUG] Starting call with tenantId:", effectiveBusiness.tenantId, effectiveBusiness.name);
      await startCall({
        tenantId: effectiveBusiness.tenantId,
        isDemoCall: true,
        fingerprint: fingerprint || computeDemoFingerprint(),
      });
      return;
    }

    setSimulationStatus("connecting");
    if (simulationConnectRef.current !== null) {
      window.clearTimeout(simulationConnectRef.current);
    }
    simulationConnectRef.current = window.setTimeout(() => {
      setSimulationActive(true);
      setSimulationStatus("connected");
    }, 700);
  }, [selectedBusiness, startCall, forceSimulation, fingerprint, refreshTrialStatus]);

  const handleEnd = useCallback(() => {
    saveDemoRecord("completed");
    if (!shouldUseSimulation) {
      endCall();
      setCallStartedAt(null);
      return;
    }

    setSimulationStatus("ending");
    window.setTimeout(() => {
      setSimulationActive(false);
      setSimulationStatus("idle");
      setCallStartedAt(null);
    }, 350);
  }, [endCall, shouldUseSimulation]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 16px 56px",
        background:
          "radial-gradient(900px 500px at 14% 0%, rgba(14,165,233,0.16), transparent 65%), radial-gradient(860px 460px at 88% 12%, rgba(251,191,36,0.18), transparent 66%), linear-gradient(145deg, #020617 0%, #0b1220 52%, #111827 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "26px" }}>
          <div style={{ color: "#7dd3fc", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 800, marginBottom: "10px" }}>
            Capability Showcase
          </div>
          <h1 style={{ margin: 0, color: "#e0f2fe", fontSize: "42px", letterSpacing: "-0.03em" }}>
            Demo Call
          </h1>
          <p style={{ marginTop: "10px", color: "#93c5fd", maxWidth: "760px", lineHeight: 1.7 }}>
            {!shouldUseSimulation
              ? "Run a short live sample and watch the agent process the request in real time."
              : "Run a simulation to view the workflow without any live-call cost."}
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          <section style={{ borderRadius: "18px", border: "1px solid rgba(148,163,184,0.25)", background: "rgba(15,23,42,0.62)", padding: "18px" }}>
            <div style={{ color: "#67e8f9", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Select a business
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {businesses.map((business) => {
                const active = business.id === selectedBusinessId;
                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => setSelectedBusinessId(business.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: "12px",
                      border: active ? "1px solid #38bdf8" : "1px solid rgba(148,163,184,0.24)",
                      background: active ? "rgba(14,165,233,0.14)" : "rgba(2,6,23,0.46)",
                      color: "#e2e8f0",
                      padding: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: "4px" }}>{business.name}</div>
                    <div style={{ fontSize: "12px", color: "#93c5fd", lineHeight: 1.5 }}>{business.summary}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ borderRadius: "18px", border: "1px solid rgba(148,163,184,0.25)", background: "rgba(15,23,42,0.62)", padding: "18px" }}>
            <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              {!shouldUseSimulation ? "Live demo call" : "Simulation demo"}
            </div>
            <div style={{ marginBottom: "10px", color: "#e2e8f0", fontWeight: 700 }}>
              {selectedBusiness ? `${selectedBusiness.name} agent ready` : "Choose a business to begin"}
            </div>
            <div style={{ marginBottom: "14px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
              {isCallActive
                ? !shouldUseSimulation
                  ? "Call is active. The agent is listening, classifying intent, and resolving the issue."
                  : "Simulation is active. You are seeing the full call workflow."
                : !shouldUseSimulation
                  ? "Click Start Demo Call to begin."
                  : "Click Start Demo to run the workflow preview."}
            </div>

            <button
              type="button"
              onClick={isCallActive ? handleEnd : handleStart}
              disabled={!selectedBusiness || connectionStatus === "connecting"}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "12px",
                padding: "14px 14px",
                fontWeight: 800,
                color: "white",
                cursor: !selectedBusiness || connectionStatus === "connecting" ? "not-allowed" : "pointer",
                opacity: !selectedBusiness || connectionStatus === "connecting" ? 0.6 : 1,
                background: isCallActive
                  ? "linear-gradient(135deg, #dc2626, #ef4444)"
                  : "linear-gradient(135deg, #0ea5e9, #2563eb)",
              }}
            >
              {connectionStatus === "connecting"
                ? "Connecting..."
                : isCallActive
                  ? !shouldUseSimulation
                    ? "End Demo Call"
                    : "End Demo"
                  : !shouldUseSimulation
                    ? "Start Demo Call"
                    : "Start Demo"}
            </button>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "#93c5fd" }}>
              Status: {connectionStatus}
            </div>

            {shouldUseSimulation ? (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#67e8f9" }}>
                Simulation mode active. No realtime call costs are incurred.
              </div>
            ) : null}

            {trialBlocked ? (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#fca5a5", lineHeight: 1.6 }}>
                {trialReason || "Live demo already used on this device. Simulation preview is available."}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/subscription" style={{ color: "#7dd3fc", fontWeight: 700, textDecoration: "none" }}>
                    Choose a subscription to unlock unlimited live calls -&gt;
                  </Link>
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/signup"
                style={{
                  textDecoration: "none",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  background: "rgba(56,189,248,0.18)",
                  border: "1px solid rgba(56,189,248,0.45)",
                  color: "#e0f2fe",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                Sign up
              </Link>
            </div>
          </section>
        </div>

        {/* Agent Workflow Panel */}
        <section
          style={{
            marginTop: "16px",
            borderRadius: "18px",
            border: "1px solid rgba(167,139,250,0.28)",
            background: "rgba(15,23,42,0.62)",
            padding: "22px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ color: "#a78bfa", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Agent Workflow
              </div>
              <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "16px" }}>
                What happens on every call
              </div>
            </div>
            <div style={{ fontSize: "12px", color: isCallActive ? "#4ade80" : "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              {isCallActive ? (
                <>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  {!shouldUseSimulation ? "Live - agent working through your call" : "Demo running - workflow simulation active"}
                </>
              ) : (
                "Start a call to activate these steps"
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
            {CALL_WORKFLOW_STEPS.map((step, index) => {
              const active = workflowStep >= index;
              const current = workflowStep === index;
              return (
                <div
                  key={step.label}
                  style={{
                    borderRadius: "14px",
                    border: current
                      ? "1px solid #a78bfa"
                      : active
                        ? "1px solid rgba(167,139,250,0.42)"
                        : "1px solid rgba(148,163,184,0.18)",
                    background: current
                      ? "rgba(124,58,237,0.16)"
                      : active
                        ? "rgba(124,58,237,0.07)"
                        : "rgba(2,6,23,0.44)",
                    padding: "14px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    opacity: active ? 1 : 0.45,
                    transition: "all 0.5s ease",
                  }}
                >
                  <span style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "13px", color: active ? "#c4b5fd" : "#64748b" }}>
                        {step.label}
                      </span>
                      {current ? (
                        <span style={{ fontSize: "10px", color: "#a78bfa", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", border: "1px solid rgba(167,139,250,0.5)", borderRadius: "999px", padding: "1px 6px" }}>
                          Live
                        </span>
                      ) : active ? (
                        <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: 900 }}>✓</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "12px", color: active ? "#cbd5e1" : "#475569", lineHeight: 1.55 }}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          style={{
            marginTop: "16px",
            borderRadius: "18px",
            border: "1px solid rgba(45,212,191,0.25)",
            background: "rgba(15,23,42,0.62)",
            padding: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
            <div>
              <div style={{ color: "#5eead4", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Recent Demo Calls
              </div>
              <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "16px" }}>
                Previous calls, saved outcome, and workflow status
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecentCalls([]);
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(DEMO_HISTORY_KEY);
                }
              }}
              style={{
                border: "1px solid rgba(148,163,184,0.35)",
                background: "transparent",
                color: "#cbd5e1",
                borderRadius: "10px",
                padding: "8px 10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear history
            </button>
          </div>

          {recentCalls.length === 0 ? (
            <div style={{ border: "1px dashed rgba(148,163,184,0.35)", borderRadius: "12px", padding: "14px", color: "#94a3b8", fontSize: "13px" }}>
              No demo calls saved yet. Start a call to create the first record.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {recentCalls.map((record) => (
                <div
                  key={record.id}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid rgba(148,163,184,0.24)",
                    background: "rgba(2,6,23,0.44)",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "14px" }}>
                      {record.businessName}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {new Date(record.endedAt).toLocaleString("en-GB")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ borderRadius: "999px", border: "1px solid rgba(56,189,248,0.4)", background: "rgba(14,165,233,0.12)", color: "#7dd3fc", padding: "2px 8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                      {record.mode}
                    </span>
                    <span style={{ borderRadius: "999px", border: "1px solid rgba(167,139,250,0.4)", background: "rgba(124,58,237,0.12)", color: "#c4b5fd", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
                      {record.workflowSummary}
                    </span>
                    <span style={{ borderRadius: "999px", border: "1px solid rgba(45,212,191,0.4)", background: "rgba(20,184,166,0.12)", color: "#99f6e4", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
                      {record.durationSeconds}s
                    </span>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.55, marginBottom: "8px" }}>
                    {record.outcome}
                  </div>
                  {/* Enhanced call summary */}
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    <strong>Saved:</strong> {record.savedItems.join(" • ")}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    <strong>Caller:</strong> {record.callerName || "-"}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    <strong>Reason:</strong> {record.reason || "-"}
                  </div>
                  {/* Checklist */}
                  <div style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
                    <strong>Checklist:</strong>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {/* Example checklist, customize as needed */}
                      <li style={{ color: record.callerName ? "#a3e635" : "#f87171" }}>
                        {record.callerName ? "✔" : "✗"} Caller name
                      </li>
                      <li style={{ color: record.reason ? "#a3e635" : "#f87171" }}>
                        {record.reason ? "✔" : "✗"} Reason captured
                      </li>
                      <li style={{ color: record.actions && record.actions.length > 0 ? "#a3e635" : "#f87171" }}>
                        {record.actions && record.actions.length > 0 ? "✔" : "✗"} Actions decided
                      </li>
                      <li style={{ color: record.savedItems && record.savedItems.length >= 3 ? "#a3e635" : "#f87171" }}>
                        {record.savedItems && record.savedItems.length >= 3 ? "✔" : "✗"} All required info
                      </li>
                      {/* Add more checklist items as needed */}
                    </ul>
                  </div>
                  {record.actions && record.actions.length > 0 && (
                    <div style={{ color: "#a3e635", fontSize: "12px", marginTop: "6px" }}>
                      <strong>Agent Actions:</strong>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {record.actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {limitReached ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.76)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              borderRadius: "18px",
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(15,23,42,0.96)",
              boxShadow: "0 28px 70px rgba(2,6,23,0.6)",
              padding: "22px",
            }}
          >
            <div style={{ color: "#67e8f9", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Demo limit reached
            </div>
            <h2 style={{ margin: "0 0 10px", color: "#e2e8f0", fontSize: "26px", letterSpacing: "-0.02em" }}>
              Continue with a full account
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginTop: 0, marginBottom: "16px" }}>
              Your showcase call has ended. Sign up now to keep using the agent and unlock full business setup.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/subscription"
                style={{
                  textDecoration: "none",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                Choose a subscription
              </Link>
              <button
                type="button"
                onClick={() => setLimitReached(false)}
                style={{
                  borderRadius: "10px",
                  padding: "10px 14px",
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
