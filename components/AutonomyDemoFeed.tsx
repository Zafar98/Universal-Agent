"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "done" | "escalated";

interface AutomationStep {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  status: StepStatus;
  isEscalation?: boolean;
}

interface CallScenario {
  id: string;
  businessType: string;
  businessName: string;
  callerName: string;
  issue: string;
  issueType: string;
  ticketId: string;
  urgency: "low" | "medium" | "high";
  staffRequired: boolean;
  staffReason?: string;
  steps: Omit<AutomationStep, "status">[];
}

// ─── Scenario Data ────────────────────────────────────────────────────────────

const SCENARIOS: CallScenario[] = [
  {
    id: "housing-routine",
    businessType: "🏠 Housing",
    businessName: "Developers Housing",
    callerName: "Marcus Reid",
    issue: "Boiler not working — no heating",
    issueType: "Repair",
    ticketId: "TKT-20482",
    urgency: "medium",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 2m 14s · Verified: ✓" },
      { id: "extract", icon: "🧠", label: "Case data extracted", detail: "Caller: Marcus Reid · Postcode: SW12 4BN · Issue: Boiler fault" },
      { id: "ticket", icon: "🎫", label: "Ticket created", detail: "#TKT-20482 · Status: Open · Priority: Medium" },
      { id: "sms", icon: "📱", label: "SMS sent to caller", detail: '"Your boiler repair is logged. Ref: TKT-20482. An engineer will contact you within 2 hours."' },
      { id: "email", icon: "📧", label: "Confirmation email sent", detail: "To: marcus.reid@email.com · Subject: Your repair request TKT-20482" },
      { id: "contractor", icon: "🔧", label: "Contractor contacted", detail: "Sunrise Repairs Ltd · Job dispatched via API · ETA: 2 hours" },
      { id: "eta", icon: "🚗", label: "Engineer ETA confirmed", detail: "Ryan Davies · Arriving: 14:30 today · Ref: SRL-2048" },
      { id: "resolve", icon: "🟢", label: "Resolved automatically — no staff involved", detail: "Status: Sent to contractor · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "housing-urgent",
    businessType: "🏠 Housing",
    businessName: "Developers Housing",
    callerName: "Priya Nair",
    issue: "Severe leak — water through ceiling",
    issueType: "Emergency Repair",
    ticketId: "TKT-20491",
    urgency: "high",
    staffRequired: true,
    staffReason: "Flood risk detected — live staff escalation triggered",
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 1m 47s · Emotion: Distressed" },
      { id: "extract", icon: "🧠", label: "Case data extracted", detail: "Caller: Priya Nair · Postcode: E1 7RW · Issue: Active leak" },
      { id: "ticket", icon: "🎫", label: "Ticket created", detail: "#TKT-20491 · Status: Open · Priority: 🔴 High" },
      { id: "sms", icon: "📱", label: "Emergency SMS sent to caller", detail: '"Your emergency has been logged. A staff member will call you back within 5 minutes."' },
      { id: "contractor", icon: "🔧", label: "Emergency contractor dispatched", detail: "RapidFix 24/7 · Emergency slot booked · ETA: 30 minutes" },
      { id: "escalate", icon: "🔴", label: "Staff escalation triggered", detail: "On-call manager notified via Slack + Phone · Reason: Flood risk", isEscalation: true },
    ],
  },
  {
    id: "hotel-reservation",
    businessType: "🏨 Hotel",
    businessName: "Grand Harbor Hotel",
    callerName: "Sophie Lawton",
    issue: "Room booking for 3 nights, king suite",
    issueType: "Reservation",
    ticketId: "TKT-30118",
    urgency: "low",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 3m 02s · Verified: Booking ref + surname" },
      { id: "extract", icon: "🧠", label: "Booking data extracted", detail: "Guest: Sophie Lawton · Dates: 24–27 May · Room: King Suite" },
      { id: "ticket", icon: "🎫", label: "Booking record created", detail: "#TKT-30118 · PMS updated · Confirmation: GHH-8820" },
      { id: "sms", icon: "📱", label: "SMS confirmation sent", detail: '"Your booking at Grand Harbor Hotel is confirmed. Ref: GHH-8820. Check-in: 24 May from 3pm."' },
      { id: "email", icon: "📧", label: "Booking confirmation email sent", detail: "To: sophie.lawton@email.com · Includes: itinerary, T&Cs, directions" },
      { id: "pms", icon: "🏨", label: "Property management system updated", detail: "Room 412 reserved · Housekeeping notified · Late arrival flag: No" },
      { id: "resolve", icon: "🟢", label: "Reservation confirmed — no staff involved", detail: "Status: Reservation confirmed · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "hotel-concierge",
    businessType: "🏨 Hotel",
    businessName: "Grand Harbor Hotel",
    callerName: "Tariq Hassan",
    issue: "Taxi to airport at 5am — urgent",
    issueType: "Concierge Request",
    ticketId: "TKT-30124",
    urgency: "low",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 1m 31s · Department: Night Concierge" },
      { id: "extract", icon: "🧠", label: "Request data extracted", detail: "Guest: Tariq Hassan · Room 207 · Pickup: 05:00 · Destination: Heathrow T5" },
      { id: "ticket", icon: "🎫", label: "Concierge ticket created", detail: "#TKT-30124 · Priority: Normal · Assigned: Night desk" },
      { id: "taxi", icon: "🚕", label: "Taxi booked automatically", detail: "City Cars Ltd · 05:00 pickup confirmed · Driver: A.Patel · ETA buffer: 10 min" },
      { id: "sms", icon: "📱", label: "SMS sent to guest", detail: '"Your 5am taxi is booked. Driver: A.Patel · Reg: LK22 HBT. Lobby pickup."' },
      { id: "resolve", icon: "🟢", label: "Request arranged — no staff involved", detail: "Status: Guest service assigned · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "restaurant-reservation",
    businessType: "🍽️ Restaurant",
    businessName: "Sunset Bistro",
    callerName: "Claire Booth",
    issue: "Table for 6 this Saturday at 7:30pm",
    issueType: "Reservation",
    ticketId: "TKT-40055",
    urgency: "low",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 1m 58s · Verified: Name & phone" },
      { id: "extract", icon: "🧠", label: "Booking data extracted", detail: "Name: Claire Booth · Party: 6 · Date: Sat 20 Apr · Time: 19:30" },
      { id: "ticket", icon: "🎫", label: "Reservation created", detail: "#TKT-40055 · Table 8 assigned · Status: Confirmed" },
      { id: "sms", icon: "📱", label: "SMS confirmation sent", detail: '"Your table for 6 at Sunset Bistro is confirmed for Sat 20 Apr at 7:30pm. See you then!"' },
      { id: "email", icon: "📧", label: "Confirmation email sent", detail: "To: claire.booth@email.com · Includes: menu preview, cancellation policy" },
      { id: "rms", icon: "🍽️", label: "Reservation system updated", detail: "Table 8 blocked · Front of house notified · Dietary notes: None" },
      { id: "resolve", icon: "🟢", label: "Booking confirmed — no staff involved", detail: "Status: Reservation confirmed · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "restaurant-order",
    businessType: "🍽️ Restaurant",
    businessName: "Sunset Bistro",
    callerName: "Dean Okafor",
    issue: "Delivery order — burger + fries + cola",
    issueType: "Delivery Order",
    ticketId: "TKT-40061",
    urgency: "low",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 2m 11s · Department: Orders" },
      { id: "extract", icon: "🧠", label: "Order data extracted", detail: "Burger x1, Fries x1, Cola x1 · Address: 44 Brook Lane, SE5 · Phone: 07712 334 881" },
      { id: "ticket", icon: "🎫", label: "Order ticket created", detail: "#TKT-40061 · Estimated prep: 15 min · Delivery: 25–35 min" },
      { id: "kitchen", icon: "🧑‍🍳", label: "Kitchen notified automatically", detail: "Order sent to KDS · Priority: Normal · Allergens: None flagged" },
      { id: "sms", icon: "📱", label: "SMS sent to customer", detail: '"Your order from Sunset Bistro is confirmed! Estimated delivery: 35 min. Track: bistro.co/track/40061"' },
      { id: "driver", icon: "🛵", label: "Delivery driver assigned", detail: "Kai Mensah · Pickup in 15 min · Customer notified on dispatch" },
      { id: "resolve", icon: "🟢", label: "Order dispatched — no staff involved", detail: "Status: Order dispatched · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "energy-outage",
    businessType: "⚡ Energy",
    businessName: "City Energy",
    callerName: "Amir Patel",
    issue: "No electricity at home since 18:20",
    issueType: "Power Outage",
    ticketId: "TKT-51022",
    urgency: "high",
    staffRequired: true,
    staffReason: "Vulnerability flag raised — network duty team escalated",
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 2m 05s · Verification: Name + postcode" },
      { id: "extract", icon: "🧠", label: "Outage data extracted", detail: "Address captured · Outage start: 18:20 · Supply type: Electric" },
      { id: "ticket", icon: "🎫", label: "Incident ticket created", detail: "#TKT-51022 · Priority: 🔴 High · Queue: Network Ops" },
      { id: "sms", icon: "📱", label: "SMS status update sent", detail: '"We are investigating your outage. Ref: TKT-51022. Next update within 30 minutes."' },
      { id: "dispatch", icon: "🛠️", label: "Duty engineer dispatch check triggered", detail: "Nearest crew identified · ETA pending control-room confirmation" },
      { id: "escalate", icon: "🔴", label: "Live escalation triggered", detail: "Vulnerability and widespread-fault indicators detected", isEscalation: true },
    ],
  },
  {
    id: "energy-billing",
    businessType: "⚡ Energy",
    businessName: "City Energy",
    callerName: "Sarah Bennett",
    issue: "Unexpectedly high monthly bill",
    issueType: "Billing Query",
    ticketId: "TKT-51039",
    urgency: "medium",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 2m 24s · Verified: Account reference + postcode" },
      { id: "extract", icon: "🧠", label: "Billing data extracted", detail: "Invoice period, meter read date, and disputed amount captured" },
      { id: "ticket", icon: "🎫", label: "Billing case created", detail: "#TKT-51039 · Status: Open · Billing specialist assigned" },
      { id: "sms", icon: "📱", label: "SMS summary sent", detail: '"Your billing review is logged. Ref: TKT-51039. We will update you within 1 working day."' },
      { id: "email", icon: "📧", label: "Case confirmation email sent", detail: "To: sarah.bennett@email.com · Includes charge breakdown checklist" },
      { id: "resolve", icon: "🟢", label: "Case queued automatically — no staff handoff call needed", detail: "Status: Billing review queued · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "council-waste",
    businessType: "🏛️ Borough Council",
    businessName: "Rivergate Borough Council",
    callerName: "Helen Morris",
    issue: "Missed recycling collection on my street",
    issueType: "Waste Report",
    ticketId: "TKT-62014",
    urgency: "low",
    staffRequired: false,
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 1m 52s · Verified: Name + postcode" },
      { id: "extract", icon: "🧠", label: "Service report extracted", detail: "Location, collection type, and scheduled date captured" },
      { id: "ticket", icon: "🎫", label: "Council job created", detail: "#TKT-62014 · Service: Waste Operations · Priority: Standard" },
      { id: "sms", icon: "📱", label: "Resident SMS sent", detail: '"Your missed collection report is logged. Ref: TKT-62014. Update expected within 2 working days."' },
      { id: "email", icon: "📧", label: "Case email confirmation sent", detail: "To: helen.morris@email.com · Includes service standards and contact route" },
      { id: "resolve", icon: "🟢", label: "Request routed automatically — no staff involved", detail: "Status: Scheduled for operations review · Closed by: Autonomy Engine" },
    ],
  },
  {
    id: "council-safeguarding",
    businessType: "🏛️ Borough Council",
    businessName: "Rivergate Borough Council",
    callerName: "Liam Ford",
    issue: "Concern about vulnerable neighbour in immediate distress",
    issueType: "Safeguarding Concern",
    ticketId: "TKT-62033",
    urgency: "high",
    staffRequired: true,
    staffReason: "Urgent safeguarding threshold met — duty officer alerted",
    steps: [
      { id: "log", icon: "✅", label: "Call completed & transcript saved", detail: "Duration: 1m 36s · Urgent risk language detected" },
      { id: "extract", icon: "🧠", label: "Incident details extracted", detail: "Location, risk indicator, and immediate safety context captured" },
      { id: "ticket", icon: "🎫", label: "Safeguarding incident logged", detail: "#TKT-62033 · Priority: 🔴 Critical · Duty queue assigned" },
      { id: "sms", icon: "📱", label: "Caller reassurance SMS sent", detail: '"Your urgent concern has been escalated to the duty team. Ref: TKT-62033."' },
      { id: "escalate", icon: "🔴", label: "Duty officer escalation triggered", detail: "Live safeguarding handoff opened with incident notes", isEscalation: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BUSINESS_TABS = [
  { id: "🏠 Housing", label: "🏠 Housing" },
  { id: "🏨 Hotel", label: "🏨 Hotel" },
  { id: "🍽️ Restaurant", label: "🍽️ Restaurant" },
  { id: "⚡ Energy", label: "⚡ Energy" },
  { id: "🏛️ Borough Council", label: "🏛️ Borough Council" },
];

const STEP_DELAY_MS = 900;
const AUTO_ROTATE_MS = 14000;

function urgencyColor(urgency: CallScenario["urgency"]): string {
  if (urgency === "high") return "#ef4444";
  if (urgency === "medium") return "#f59e0b";
  return "#22c55e";
}

function urgencyLabel(urgency: CallScenario["urgency"]): string {
  if (urgency === "high") return "🔴 High";
  if (urgency === "medium") return "🟡 Medium";
  return "🟢 Low";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ step, index }: { step: AutomationStep; index: number }) {
  const isDone = step.status === "done" || step.status === "escalated";
  const isRunning = step.status === "running";
  const isEscalation = step.isEscalation;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: "8px",
        background: isDone
          ? isEscalation
            ? "rgba(239,68,68,0.08)"
            : "rgba(34,197,94,0.06)"
          : isRunning
          ? "rgba(14,165,233,0.08)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${
          isDone
            ? isEscalation
              ? "rgba(239,68,68,0.2)"
              : "rgba(34,197,94,0.15)"
            : isRunning
            ? "rgba(14,165,233,0.2)"
            : "rgba(255,255,255,0.05)"
        }`,
        transition: "all 0.4s ease",
        opacity: step.status === "pending" ? 0.35 : 1,
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          lineHeight: 1,
          minWidth: "20px",
          paddingTop: "2px",
          filter: step.status === "pending" ? "grayscale(1)" : "none",
        }}
      >
        {isRunning ? (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "2px solid #0ea5e9",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
              marginTop: "2px",
            }}
          />
        ) : (
          step.icon
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: isDone
              ? isEscalation
                ? "#f87171"
                : "#86efac"
              : isRunning
              ? "#7dd3fc"
              : "#94a3b8",
            lineHeight: 1.4,
          }}
        >
          {step.label}
        </div>
        {step.detail && isDone && (
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
              marginTop: "3px",
              lineHeight: 1.5,
              fontFamily: "monospace",
            }}
          >
            {step.detail}
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  isActive,
}: {
  scenario: CallScenario;
  isActive: boolean;
}) {
  const [steps, setSteps] = useState<AutomationStep[]>(
    scenario.steps.map((s) => ({ ...s, status: "pending" as StepStatus }))
  );
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setSteps(scenario.steps.map((s) => ({ ...s, status: "pending" as StepStatus })));
      if (animRef.current) clearTimeout(animRef.current);
      return;
    }

    // Reset then animate through steps
    setSteps(scenario.steps.map((s) => ({ ...s, status: "pending" as StepStatus })));

    let stepIndex = 0;

    function animateNext() {
      if (!mountedRef.current) return;
      if (stepIndex >= scenario.steps.length) return;

      const i = stepIndex;
      stepIndex++;

      // Mark current as running
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s))
      );

      animRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        // Mark as done
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? {
                  ...s,
                  status: s.isEscalation ? "escalated" : "done",
                }
              : s
          )
        );

        animRef.current = setTimeout(animateNext, 180);
      }, STEP_DELAY_MS);
    }

    const startTimer = setTimeout(animateNext, 400);
    return () => {
      clearTimeout(startTimer);
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [isActive, scenario]);

  const completedSteps = steps.filter((s) => s.status === "done" || s.status === "escalated").length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const allDone = completedSteps === steps.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Call summary card */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(148,163,184,0.1)",
          borderRadius: "12px 12px 0 0",
          padding: "16px 20px",
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0369a1, #0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          📞
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "14px" }}>
              {scenario.callerName}
            </span>
            <span
              style={{
                background: "rgba(14,165,233,0.15)",
                color: "#7dd3fc",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "100px",
                border: "1px solid rgba(14,165,233,0.2)",
              }}
            >
              {scenario.issueType}
            </span>
            <span
              style={{
                background: scenario.staffRequired ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: scenario.staffRequired ? "#f87171" : "#86efac",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "100px",
                border: `1px solid ${scenario.staffRequired ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
              }}
            >
              Urgency: {urgencyLabel(scenario.urgency)}
            </span>
          </div>
          <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            {scenario.issue}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{ color: "#64748b", fontSize: "11px" }}>
              🎫 {scenario.ticketId}
            </span>
            <span style={{ color: "#64748b", fontSize: "11px" }}>
              🏢 {scenario.businessName}
            </span>
          </div>
        </div>
        {/* Staff required badge */}
        <div
          style={{
            flexShrink: 0,
            background: scenario.staffRequired ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
            border: `1px solid ${scenario.staffRequired ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px" }}>{scenario.staffRequired ? "👤" : "🤖"}</div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: scenario.staffRequired ? "#f87171" : "#86efac",
              marginTop: "3px",
              lineHeight: 1.3,
            }}
          >
            {scenario.staffRequired ? "Staff\nRequired" : "Auto\nResolved"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          background: "rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: scenario.staffRequired
              ? "linear-gradient(90deg, #ef4444, #f97316)"
              : "linear-gradient(90deg, #0369a1, #22c55e)",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Automation steps */}
      <div
        style={{
          background: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(148,163,184,0.08)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              color: "#64748b",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            Autonomous Actions
          </span>
          <span
            style={{
              color: allDone ? (scenario.staffRequired ? "#f87171" : "#86efac") : "#64748b",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {completedSteps}/{steps.length} complete
          </span>
        </div>

        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} index={i} />
        ))}

        {/* Final outcome */}
        {allDone && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: scenario.staffRequired
                ? "rgba(239,68,68,0.1)"
                : "rgba(34,197,94,0.08)",
              border: `1px solid ${scenario.staffRequired ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.2)"}`,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "20px" }}>{scenario.staffRequired ? "🔴" : "✅"}</span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: scenario.staffRequired ? "#f87171" : "#86efac",
                }}
              >
                {scenario.staffRequired
                  ? "Live staff escalated — caller and manager notified"
                  : "Fully resolved by AI — zero staff involvement"}
              </div>
              {scenario.staffReason && (
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                  Reason: {scenario.staffReason}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AutonomyDemoFeed() {
  const [activeTab, setActiveTab] = useState("🏠 Housing");
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const rotateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tabScenarios = SCENARIOS.filter((s) => s.businessType === activeTab);
  const activeScenario = tabScenarios[activeScenarioIndex] ?? tabScenarios[0];

  // Auto-rotate scenarios
  useEffect(() => {
    if (!isPlaying) return;
    rotateTimerRef.current = setInterval(() => {
      setActiveScenarioIndex((prev) => {
        const next = (prev + 1) % tabScenarios.length;
        if (next === 0) {
          // Cycle to next tab
          setActiveTab((prevTab) => {
            const tabs = BUSINESS_TABS.map((t) => t.id);
            const tabIdx = tabs.indexOf(prevTab);
            return tabs[(tabIdx + 1) % tabs.length];
          });
        }
        return next;
      });
    }, AUTO_ROTATE_MS);

    return () => {
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
    };
  }, [isPlaying, tabScenarios.length, activeTab]);

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    setActiveScenarioIndex(0);
    setIsPlaying(false);
  }

  function handleScenarioClick(idx: number) {
    setActiveScenarioIndex(idx);
    setIsPlaying(false);
  }

  return (
    <section
      style={{
        background: "linear-gradient(180deg, #0b1120 0%, #060d1a 100%)",
        padding: "72px 20px 80px",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .autonomy-scenario-btn:hover {
          background: rgba(14,165,233,0.12) !important;
          border-color: rgba(14,165,233,0.3) !important;
        }
        .autonomy-tab-btn:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>

      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Example Post-Call Automations
            </span>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                display: "inline-block",
                animation: "spin 2s linear infinite",
              }}
            />
          </div>
          <h2
            style={{
              color: "#f1f5f9",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            See what your agent does{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              after every call
            </span>
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "17px",
              lineHeight: 1.7,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            These example scenarios show how the AI can handle the full back-office workflow after a call —
            SMS, email, contractor dispatch, and system updates — with no staff needed.
          </p>
        </div>

        {/* Business type tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {BUSINESS_TABS.map((tab) => (
            <button
              key={tab.id}
              className="autonomy-tab-btn"
              onClick={() => handleTabClick(tab.id)}
              style={{
                background:
                  activeTab === tab.id
                    ? "rgba(14,165,233,0.15)"
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeTab === tab.id ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: activeTab === tab.id ? "#7dd3fc" : "#64748b",
                padding: "8px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scenario selector */}
        {tabScenarios.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {tabScenarios.map((s, idx) => (
              <button
                key={s.id}
                className="autonomy-scenario-btn"
                onClick={() => handleScenarioClick(idx)}
                style={{
                  background:
                    activeScenarioIndex === idx
                      ? "rgba(14,165,233,0.1)"
                      : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeScenarioIndex === idx ? "rgba(14,165,233,0.25)" : "rgba(255,255,255,0.06)"}`,
                  color: activeScenarioIndex === idx ? "#7dd3fc" : "#64748b",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                {s.issueType}
                {s.staffRequired && (
                  <span style={{ marginLeft: "6px", color: "#f87171" }}>⚠️</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active scenario card */}
        <div
          key={`${activeTab}-${activeScenarioIndex}`}
          style={{ animation: "fadeInUp 0.35s ease" }}
        >
          <ScenarioCard scenario={activeScenario} isActive={true} />
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#64748b", fontSize: "13px" }}>
              Auto-resolved — no staff needed
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#64748b", fontSize: "13px" }}>
              Escalated — staff alerted automatically
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#475569", fontSize: "13px" }}>
              Example scenarios auto-rotate every 14s · Click tabs to explore
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
