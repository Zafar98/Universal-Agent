"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type WorkflowStep = {
  icon: string;
  label: string;
  detail: string;
};

type EmailCase = {
  id: string;
  customer: string;
  from: string;
  subject: string;
  receivedAt: string;
  urgency: "low" | "medium" | "high" | "critical";
  category: "billing" | "support" | "complaint" | "booking" | "emergency";
  body: string;
  steps: WorkflowStep[];
};

const CASES: EmailCase[] = [
  {
    id: "email-1",
    customer: "Sarah Mitchell",
    from: "sarah.mitchell@example.com",
    subject: "Charged twice on April invoice — please refund",
    receivedAt: "09:14",
    urgency: "medium",
    category: "billing",
    body:
      "Hi, I noticed I've been charged twice for the same monthly subscription — both on 1st April and 3rd April. Can someone look into this and arrange a refund? I'd like a case reference too. Thanks, Sarah.",
    steps: [
      {
        icon: "📨",
        label: "Email received & parsed",
        detail: "Sender identity confirmed, subject line classified as billing dispute. Message body extracted and tokenised.",
      },
      {
        icon: "🔍",
        label: "Intent classified",
        detail: "Intent: duplicate charge complaint. Urgency set to Medium. Category: Billing. No escalation keyword detected.",
      },
      {
        icon: "👤",
        label: "Account lookup",
        detail: "Customer record located by email address. Subscription tier confirmed. Invoice history for April retrieved.",
      },
      {
        icon: "🧾",
        label: "Duplicate charge confirmed",
        detail: "Two separate charges found on 1st April (£49.99) and 3rd April (£49.99) for the same billing period. Root cause: payment retry after gateway timeout.",
      },
      {
        icon: "🔄",
        label: "Refund initiated",
        detail: "Refund request raised via billing API for £49.99. Case reference #BL-20482 generated. Timeline: 3–5 business days.",
      },
      {
        icon: "✉️",
        label: "Reply sent & case closed",
        detail: "Email sent to Sarah confirming duplicate, refund amount, case reference, and expected timeline. Ticket closed.",
      },
    ],
  },
  {
    id: "email-2",
    customer: "City Hotel — Front Desk",
    from: "frontdesk@cityhotel.co.uk",
    subject: "URGENT: Guest cannot modify reservation — error on portal",
    receivedAt: "10:02",
    urgency: "high",
    category: "booking",
    body:
      "Hi, a guest checking in on Friday is trying to move their booking from Room 214 to a sea-view room. The portal keeps throwing an error on the date change screen. Please fix this urgently — the guest is very unhappy.",
    steps: [
      {
        icon: "📨",
        label: "Email received & parsed",
        detail: "High-urgency keyword 'URGENT' detected in subject. Sender matched to registered hotel partner account. Request type: booking modification.",
      },
      {
        icon: "🔍",
        label: "Intent classified",
        detail: "Intent: reservation change request with portal error report. Urgency set to High. Category: Booking. Guest displeasure flag raised.",
      },
      {
        icon: "📅",
        label: "Reservation located",
        detail: "Booking reference retrieved from partner account. Guest: Mr. R. Patel. Current room: 214 (standard). Requested: sea-view room on same dates.",
      },
      {
        icon: "🏨",
        label: "Availability confirmed",
        detail: "Sea-view rooms checked for Friday check-in. Room 308 available. Upgrade fee policy applied: £30/night differential pre-authorised.",
      },
      {
        icon: "🔄",
        label: "Booking updated & portal error logged",
        detail: "Room changed to 308 directly via booking API (bypassing broken portal). Portal error logged as incident #IT-0912 for engineering team.",
      },
      {
        icon: "✉️",
        label: "Confirmation sent",
        detail: "Revised confirmation emailed to front desk and guest. Apology note included. Portal incident reference shared with hotel IT contact.",
      },
    ],
  },
  {
    id: "email-3",
    customer: "Mario Ali",
    from: "mario.ali@example.com",
    subject: "Still no update on my heating repair — 3 days and counting",
    receivedAt: "11:37",
    urgency: "high",
    category: "complaint",
    body:
      "I reported a complete heating failure in my flat on Tuesday morning. It is now Friday and I have had no update, no contractor visit, no anything. I am a vulnerable resident. This is completely unacceptable. Please respond immediately.",
    steps: [
      {
        icon: "📨",
        label: "Email received & parsed",
        detail: "Complaint type detected. Sender matched to tenant record. 'Vulnerable resident' keyword flagged for priority routing.",
      },
      {
        icon: "🔍",
        label: "Intent classified",
        detail: "Intent: unresolved maintenance complaint. Urgency set to High. Vulnerable resident flag applied. Category: Complaint.",
      },
      {
        icon: "🎫",
        label: "Open ticket located",
        detail: "Maintenance ticket #MT-3841 found — heating failure reported Tuesday 08:43. Status: awaiting contractor assignment. Age: 3 days. SLA: 24h — BREACHED.",
      },
      {
        icon: "⬆️",
        label: "Priority escalated",
        detail: "Ticket escalated to Critical. Housing manager notified. Emergency contractor dispatched. ETA: same day by 17:00.",
      },
      {
        icon: "✉️",
        label: "Reply sent to tenant",
        detail: "Apology email sent with escalation confirmation, contractor ETA, and direct manager contact number. SLA breach acknowledged.",
      },
      {
        icon: "📋",
        label: "Follow-up scheduled",
        detail: "24-hour auto-follow-up added to ticket. Complaint formally logged in resident relations system for review.",
      },
    ],
  },
  {
    id: "email-4",
    customer: "James Turner",
    from: "j.turner@mapleestate.co.uk",
    subject: "Emergency — roof leak in Block C, water entering flat 4",
    receivedAt: "07:52",
    urgency: "critical",
    category: "emergency",
    body:
      "There is a significant roof leak directly above Flat 4, Block C. The tenant called in last night and is reporting water dripping from the ceiling onto furniture. It rained heavily overnight. This needs immediate attention — please treat as emergency.",
    steps: [
      {
        icon: "📨",
        label: "Email received & parsed",
        detail: "Emergency keyword detected: 'Emergency', 'roof leak', 'immediate'. Received 07:52 — flagged for out-of-hours routing.",
      },
      {
        icon: "🚨",
        label: "Emergency classification",
        detail: "Category: Emergency structural repair. Urgency: Critical. Affected property: Block C, Flat 4 — pulled from estate database.",
      },
      {
        icon: "👤",
        label: "Tenant record confirmed",
        detail: "Tenant: Ms. P. Okafor. Tenancy active. Property: 4 Maple Estate, Block C. Roof last inspected: 14 months ago. Contractor on file retrieved.",
      },
      {
        icon: "🏗️",
        label: "Emergency contractor dispatched",
        detail: "Out-of-hours roofing contractor notified via API. Emergency ticket #EM-0047 raised. SLA: 2-hour on-site response. Contractor ETA: 09:30.",
      },
      {
        icon: "✉️",
        label: "Email replies sent",
        detail: "Confirmation emailed to property manager James Turner. Tenant Ms. Okafor notified with contractor ETA, emergency reference, and advice to protect belongings.",
      },
      {
        icon: "📲",
        label: "On-call manager alerted",
        detail: "SMS alert sent to on-call maintenance manager with full incident summary. Ticket marked for post-repair inspection and insurance log.",
      },
    ],
  },
  {
    id: "email-5",
    customer: "Priya Sharma",
    from: "priya.sharma@freshbites.co.uk",
    subject: "Wrong order delivered — requesting refund and explanation",
    receivedAt: "14:20",
    urgency: "medium",
    category: "complaint",
    body:
      "I placed order #FB-9921 at 1pm today. The delivery arrived with the completely wrong items — I ordered the vegan platter and received a meat option. I have a food allergy and this is a serious issue. I am requesting a full refund and an explanation of how this happened.",
    steps: [
      {
        icon: "📨",
        label: "Email received & parsed",
        detail: "Sender matched to customer record. Order reference #FB-9921 extracted. Allergy concern keyword detected — severity escalation triggered.",
      },
      {
        icon: "🔍",
        label: "Intent classified",
        detail: "Intent: wrong order received, refund request with food allergy concern. Urgency: Medium (elevated from low due to allergy flag). Category: Complaint.",
      },
      {
        icon: "🧾",
        label: "Order record retrieved",
        detail: "Order #FB-9921 confirmed: vegan platter, 1pm pickup, 1:34pm delivered. Fulfilment note: item substituted by kitchen at 12:58 — no customer notification sent. Error confirmed.",
      },
      {
        icon: "💰",
        label: "Refund & resolution applied",
        detail: "Full refund of £18.50 processed immediately. Complimentary £10 credit applied to account. Allergy incident flagged to kitchen manager for review.",
      },
      {
        icon: "✉️",
        label: "Apology & confirmation sent",
        detail: "Email sent with full apology, refund confirmation, credit code, and explanation of error. Allergy safeguarding steps communicated.",
      },
      {
        icon: "📋",
        label: "Incident logged",
        detail: "Allergy incident report filed internally. Kitchen substitution policy flagged for review. Case closed — customer satisfaction follow-up scheduled for 48h.",
      },
    ],
  },
];

function urgencyColor(urgency: EmailCase["urgency"]): string {
  if (urgency === "critical") return "#ef4444";
  if (urgency === "high") return "#f97316";
  if (urgency === "medium") return "#eab308";
  return "#22c55e";
}

function categoryLabel(category: EmailCase["category"]): string {
  if (category === "booking") return "Booking";
  if (category === "billing") return "Billing";
  if (category === "complaint") return "Complaint";
  if (category === "emergency") return "Emergency";
  return "Support";
}

export default function EmailAutomationShowcase() {
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0].id);
  const [workflowStep, setWorkflowStep] = useState(0);
  const selectedCase = useMemo(
    () => CASES.find((item) => item.id === selectedCaseId) || CASES[0],
    [selectedCaseId]
  );

  const totalSteps = selectedCase.steps.length;
  const workflowComplete = workflowStep >= totalSteps;

  const advanceWorkflow = () => {
    setWorkflowStep((current) => {
      if (current >= totalSteps) return 0;
      return current + 1;
    });
  };

  const selectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setWorkflowStep(0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 16px 56px",
        background:
          "radial-gradient(900px 500px at 14% 0%, rgba(14,165,233,0.16), transparent 65%), radial-gradient(860px 460px at 88% 12%, rgba(251,191,36,0.16), transparent 66%), linear-gradient(145deg, #020617 0%, #0b1220 52%, #111827 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "26px" }}>
          <div>
            <div
              style={{
                color: "#7dd3fc",
                fontSize: "12px",
                letterSpacing: "0.14em",
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Capability Showcase
            </div>
            <h1 style={{ margin: 0, fontSize: "42px", lineHeight: 1.05, color: "#e0f2fe", letterSpacing: "-0.03em" }}>
              Demo Email
            </h1>
            <p style={{ marginTop: "10px", marginBottom: 0, color: "#93c5fd", maxWidth: "760px", lineHeight: 1.7 }}>
              Choose a real scenario and step through how the agent receives, decides, and resolves it.
            </p>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(15,23,42,0.62)",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#67e8f9", fontWeight: 800, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Inbox Queue
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {CASES.map((emailCase) => {
                const active = emailCase.id === selectedCase.id;
                return (
                  <button
                    type="button"
                    key={emailCase.id}
                    onClick={() => selectCase(emailCase.id)}
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 700 }}>{emailCase.subject}</div>
                      <div style={{ fontSize: "11px", color: "#93c5fd" }}>{emailCase.receivedAt}</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "8px" }}>{emailCase.from}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-block", borderRadius: "999px", background: `${urgencyColor(emailCase.urgency)}22`, border: `1px solid ${urgencyColor(emailCase.urgency)}88`, color: urgencyColor(emailCase.urgency), padding: "2px 8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                        {emailCase.urgency}
                      </span>
                      <span style={{ display: "inline-block", borderRadius: "999px", background: "rgba(56,189,248,0.13)", border: "1px solid rgba(56,189,248,0.4)", color: "#7dd3fc", padding: "2px 8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                        {categoryLabel(emailCase.category)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(15,23,42,0.62)",
              padding: "18px",
            }}
          >
            <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Agent workflow
            </div>
            <div style={{ marginBottom: "4px", color: "#e2e8f0", fontWeight: 700 }}>
              {selectedCase.customer}
            </div>
            <div style={{ marginBottom: "4px", color: "#93c5fd", fontSize: "13px", fontStyle: "italic" }}>
              "{selectedCase.subject}"
            </div>
            <div style={{ marginBottom: "14px", color: "#94a3b8", fontSize: "12px", lineHeight: 1.6 }}>
              {workflowComplete
                ? "All steps complete. Replay or choose another case."
                : `Step ${workflowStep + 1} of ${totalSteps} — advance to see each action the agent takes.`}
            </div>

            {/* Email body preview */}
            <div
              style={{
                borderRadius: "12px",
                background: "rgba(2,6,23,0.56)",
                border: "1px solid rgba(148,163,184,0.2)",
                padding: "12px",
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 700 }}>
                Incoming email body
              </div>
              <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.65 }}>
                {selectedCase.body}
              </div>
            </div>

            {/* Step-by-step workflow */}
            <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
              {selectedCase.steps.map((step, index) => {
                const active = index < workflowStep;
                const current = index === workflowStep - 1 && !workflowComplete;
                const pending = index >= workflowStep;
                return (
                  <div
                    key={step.label}
                    style={{
                      borderRadius: "12px",
                      border: current
                        ? "1px solid #fbbf24"
                        : active
                          ? "1px solid rgba(56,189,248,0.42)"
                          : "1px solid rgba(148,163,184,0.18)",
                      background: current
                        ? "rgba(251,191,36,0.1)"
                        : active
                          ? "rgba(14,165,233,0.1)"
                          : "rgba(2,6,23,0.46)",
                      padding: "10px 12px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      opacity: pending && !current ? 0.38 : 1,
                      transition: "all 0.4s ease",
                    }}
                  >
                    <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontWeight: 800, fontSize: "12px", color: current ? "#fde68a" : active ? "#7dd3fc" : "#64748b" }}>
                          {step.label}
                        </span>
                        {current ? (
                          <span style={{ fontSize: "10px", color: "#fbbf24", fontWeight: 900, border: "1px solid rgba(251,191,36,0.5)", borderRadius: "999px", padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Processing
                          </span>
                        ) : active ? (
                          <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 900 }}>✓</span>
                        ) : null}
                      </div>
                      {(active || current) ? (
                        <div style={{ fontSize: "12px", color: current ? "#fde68a" : "#94a3b8", lineHeight: 1.55 }}>
                          {step.detail}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={advanceWorkflow}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontWeight: 800,
                  color: "white",
                  cursor: "pointer",
                  background: workflowComplete
                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                    : "linear-gradient(135deg, #0ea5e9, #2563eb)",
                }}
              >
                {workflowComplete ? "↩ Replay workflow" : `Run step ${workflowStep + 1} →`}
              </button>
              <Link
                href="/signup?plan=starter&integration=email-automation"
                style={{
                  textDecoration: "none",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(34,197,94,0.42)",
                  color: "#dcfce7",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href="/subscription"
            style={{
              textDecoration: "none",
              borderRadius: "10px",
              padding: "9px 12px",
              background: "rgba(56,189,248,0.16)",
              border: "1px solid rgba(56,189,248,0.45)",
              color: "#e0f2fe",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            Choose Plan
          </Link>
          <div style={{ color: "#93c5fd", fontSize: "12px", display: "inline-flex", alignItems: "center" }}>
            Starter includes email automation only. Growth and Enterprise add voice and other channels.
          </div>
        </div>
      </div>
    </div>
  );
}
