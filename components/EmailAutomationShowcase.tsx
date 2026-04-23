"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useState as useClientState } from "react";
// If you have an API endpoint, import axios or fetch as needed

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
  // Email Automation Agent (existing)
  // ...existing email cases...
  // Voice Call Automation Agent
  {
    id: "voice-1",
    customer: "Inbound Caller",
    from: "(020) 1234 5678",
    subject: "Missed appointment reschedule",
    receivedAt: "09:45",
    urgency: "medium",
    category: "support",
    body: "Caller requests to reschedule a missed appointment for next week.",
    steps: [
      { icon: "📞", label: "Call received", detail: "Caller identified via phone number. Intent: reschedule appointment." },
      { icon: "📅", label: "Calendar checked", detail: "Available slots for next week retrieved from scheduling system." },
      { icon: "✅", label: "Slot confirmed", detail: "Caller selects preferred slot. Appointment updated in system." },
      { icon: "✉️", label: "Confirmation sent", detail: "SMS and email confirmation sent to caller." },
    ],
  },
  // Live Chat Agent
  {
    id: "chat-1",
    customer: "Website Visitor",
    from: "chat-widget",
    subject: "Product availability inquiry",
    receivedAt: "11:10",
    urgency: "low",
    category: "support",
    body: "Visitor asks if product X is in stock.",
    steps: [
      { icon: "💬", label: "Chat started", detail: "Visitor opens chat widget and asks about product X." },
      { icon: "🔍", label: "Inventory checked", detail: "Stock database queried for product X availability." },
      { icon: "✅", label: "Response sent", detail: "Agent replies with stock status and purchase link." },
    ],
  },
  // SMS/Text Automation Agent
  {
    id: "sms-1",
    customer: "Customer Mobile",
    from: "+447700900123",
    subject: "Order delivery update",
    receivedAt: "13:22",
    urgency: "medium",
    category: "support",
    body: "Customer requests delivery status for order #12345.",
    steps: [
      { icon: "📲", label: "SMS received", detail: "Order number extracted from message." },
      { icon: "🚚", label: "Order tracked", detail: "Delivery API queried for status." },
      { icon: "✅", label: "Status sent", detail: "SMS reply sent with delivery ETA." },
    ],
  },
  // Social Media Agent
  {
    id: "social-1",
    customer: "Twitter User",
    from: "@customer123",
    subject: "DM: Need help with login",
    receivedAt: "15:05",
    urgency: "medium",
    category: "support",
    body: "User sends Twitter DM about login issues.",
    steps: [
      { icon: "🐦", label: "DM received", detail: "Twitter DM parsed for intent and user ID." },
      { icon: "🔑", label: "Account checked", detail: "User account status checked in CRM." },
      { icon: "✅", label: "Reply sent", detail: "Agent replies with password reset instructions." },
    ],
  },
  // Document Processing Agent
  {
    id: "doc-1",
    customer: "Accounts Team",
    from: "accounts@company.com",
    subject: "Invoice #2026 upload",
    receivedAt: "16:30",
    urgency: "low",
    category: "billing",
    body: "Invoice PDF uploaded for processing.",
    steps: [
      { icon: "📄", label: "Document received", detail: "PDF invoice uploaded and parsed." },
      { icon: "🔍", label: "Data extracted", detail: "Invoice fields extracted using OCR." },
      { icon: "💾", label: "Saved to system", detail: "Invoice data saved to accounting software." },
      { icon: "✅", label: "Confirmation sent", detail: "Accounts team notified of successful upload." },
    ],
  },
  // Booking & Scheduling Agent (already present as booking)
  // Payment & Billing Agent (already present as billing)
  // HR/Recruitment Agent
  {
    id: "hr-1",
    customer: "Job Applicant",
    from: "applicant@email.com",
    subject: "Application for Customer Support Role",
    receivedAt: "10:00",
    urgency: "low",
    category: "support",
    body: "Applicant submits CV for open position.",
    steps: [
      { icon: "📨", label: "Application received", detail: "CV and cover letter parsed." },
      { icon: "🔍", label: "Screening", detail: "Applicant screened for required skills." },
      { icon: "📅", label: "Interview scheduled", detail: "Interview slot offered and confirmed." },
      { icon: "✅", label: "Confirmation sent", detail: "Applicant notified of interview details." },
    ],
  },
  // IT Helpdesk Agent
  {
    id: "it-1",
    customer: "Employee",
    from: "employee@company.com",
    subject: "Password reset request",
    receivedAt: "08:30",
    urgency: "medium",
    category: "support",
    body: "Employee requests password reset for company portal.",
    steps: [
      { icon: "💻", label: "Ticket created", detail: "Password reset ticket logged in helpdesk system." },
      { icon: "🔑", label: "Reset processed", detail: "Temporary password generated and emailed." },
      { icon: "✅", label: "Confirmation sent", detail: "Employee notified of password reset." },
    ],
  },
  // Compliance & Audit Agent
  {
    id: "compliance-1",
    customer: "Compliance Officer",
    from: "compliance@company.com",
    subject: "Quarterly audit log review",
    receivedAt: "12:00",
    urgency: "low",
    category: "support",
    body: "Request for audit log review for Q1.",
    steps: [
      { icon: "📝", label: "Request received", detail: "Audit log review request logged." },
      { icon: "🔍", label: "Logs analyzed", detail: "System logs analyzed for compliance issues." },
      { icon: "✅", label: "Report generated", detail: "Audit report generated and sent to officer." },
    ],
  },
  // Data Enrichment Agent
  {
    id: "data-1",
    customer: "Sales Team",
    from: "sales@company.com",
    subject: "Enrich lead data",
    receivedAt: "14:45",
    urgency: "low",
    category: "support",
    body: "Sales team requests enrichment of new lead list.",
    steps: [
      { icon: "📈", label: "Request received", detail: "Lead list uploaded for enrichment." },
      { icon: "🔍", label: "Data gathered", detail: "Public and proprietary sources queried for additional info." },
      { icon: "✅", label: "Leads updated", detail: "CRM updated with enriched data." },
    ],
  },
  // Custom Workflow Agent
  {
    id: "custom-1",
    customer: "Operations Manager",
    from: "ops@company.com",
    subject: "Custom workflow automation",
    receivedAt: "17:00",
    urgency: "medium",
    category: "support",
    body: "Manager requests automation for a unique internal process.",
    steps: [
      { icon: "⚙️", label: "Request received", detail: "Custom workflow requirements gathered." },
      { icon: "🛠️", label: "Workflow built", detail: "Automation logic implemented and tested." },
      { icon: "✅", label: "Workflow deployed", detail: "Custom workflow deployed and manager notified." },
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

  // Customer email form state
  const [customerEmail, setCustomerEmail] = useClientState("");
  const [customerSubject, setCustomerSubject] = useClientState("");
  const [customerBody, setCustomerBody] = useClientState("");
  const [sending, setSending] = useClientState(false);
  const [sent, setSent] = useClientState(false);
  const [agentReply, setAgentReply] = useClientState("");
  const [error, setError] = useClientState("");

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

  // Send real email to agent and auto-reply to customer
  const handleCustomerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSent(false);
    setAgentReply("");
    try {
      const res = await fetch("/api/send-demo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail,
          customerSubject,
          customerBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setSent(true);
      setAgentReply(
        `Hi, thank you for your message. Our agent has received your issue: "${customerBody}" and will respond shortly. [Check your email for a real auto-reply.]`
      );
      setCustomerEmail("");
      setCustomerSubject("");
      setCustomerBody("");
    } catch (err) {
      setError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
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
              Demo: Build an Agent for Any Workflow
            </h1>
            <p style={{ marginTop: "10px", marginBottom: 0, color: "#93c5fd", maxWidth: "760px", lineHeight: 1.7 }}>
              See how our platform builds and runs a digital employee for your business. We design, build, and install your custom agent—payment is only taken after you confirm your requirements and features. Setup fee is £1500 (starting price); all add-ons and advanced features are quoted after discovery.
            </p>
          </div>
        </header>

        {/* Customer email input form */}
        <section style={{ marginBottom: 32 }}>
          <form
            onSubmit={handleCustomerEmail}
            style={{
              background: "rgba(2,6,23,0.56)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 14,
              padding: 20,
              maxWidth: 520,
              margin: "0 auto 24px auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Try it yourself — send an email to the agent</div>
            <input
              type="email"
              required
              placeholder="Your email address"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", marginBottom: 4 }}
            />
            <input
              type="text"
              required
              placeholder="Subject"
              value={customerSubject}
              onChange={e => setCustomerSubject(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", marginBottom: 4 }}
            />
            <textarea
              required
              placeholder="Describe your issue or request..."
              value={customerBody}
              onChange={e => setCustomerBody(e.target.value)}
              rows={4}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", marginBottom: 4, resize: "vertical" }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                color: "white",
                fontWeight: 700,
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                cursor: sending ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
            {sent && (
              <div style={{ color: "#4ade80", marginTop: 8, fontWeight: 700 }}>
                Email sent! The agent will reply to your address.
              </div>
            )}
            {agentReply && (
              <div style={{ color: "#fbbf24", marginTop: 8, fontWeight: 700 }}>
                Agent reply: {agentReply}
              </div>
            )}
            {error && (
              <div style={{ color: "#ef4444", marginTop: 8 }}>{error}</div>
            )}
          </form>
        </section>

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
            {/* Autonomous workflow summary */}
            {workflowComplete && (
              <div style={{ color: "#a3e635", fontSize: "13px", marginTop: "10px", marginBottom: "10px" }}>
                <strong>Agent Actions:</strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {selectedCase.steps.map((step, idx) => (
                    <li key={idx}>{step.label}: {step.detail}</li>
                  ))}
                </ul>
              </div>
            )}

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
                href="/quote"
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
                Request a Quote
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
            See Pricing
          </Link>
          <div style={{ color: "#93c5fd", fontSize: "12px", display: "inline-flex", alignItems: "center" }}>
            Payment is only taken after you confirm your requirements. Setup fee is £1500 (starting price); all features and add-ons are quoted after discovery.
          </div>
        </div>
      </div>
    </div>
  );
}
