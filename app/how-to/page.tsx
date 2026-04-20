"use client";

import Link from "next/link";

const CORE_REQUIREMENTS = [
  {
    title: "Business and service details",
    items: [
      "Primary business name, brand tone, and preferred greeting style",
      "Departments you want the agent to handle (support, billing, bookings, repairs, sales)",
      "Operating hours, out-of-hours policy, and emergency escalation rules",
      "Service boundaries: what the agent can do automatically vs what must be handed to staff",
    ],
  },
  {
    title: "Customer channels",
    items: [
      "Which channels you are enabling: email, voice calls, SMS, website widget, API",
      "Expected monthly volume for each channel so we can tune limits and overage thresholds",
      "Priority language(s), call geography (UK-only or global), and routing preferences",
      "Brand assets for public touchpoints (logo, support links, legal footer)",
    ],
  },
  {
    title: "Systems and data access",
    items: [
      "CRM or helpdesk platform details (HubSpot, Salesforce, Zendesk, Freshdesk, custom stack)",
      "API keys, webhook endpoints, or secure integration credentials",
      "Field mapping requirements: which customer fields and ticket fields must sync",
      "Test environment access (sandbox credentials) before production go-live",
    ],
  },
  {
    title: "Compliance and approvals",
    items: [
      "Privacy policy and retention requirements for transcripts, recordings, and logs",
      "Consent language for call recording and outbound communications",
      "Regulated workflows that need approval gates (financial changes, legal statements)",
      "Named stakeholder who signs off final scripts, fallback logic, and launch",
    ],
  },
];

const INTEGRATION_PATHS = [
  {
    name: "Email automation",
    needs: [
      "Shared inbox credentials or delegated mailbox access",
      "Mailbox rules to avoid loops (auto-replies, no-reply sources)",
      "Templates for key response types (refunds, appointment changes, complaints)",
      "Escalation queue email addresses and response SLA targets",
    ],
  },
  {
    name: "Voice calls",
    needs: [
      "Preferred call flow by department (intro, verification, qualification, handoff)",
      "Knowledge base links for accurate answer grounding",
      "Handoff contacts for urgent calls (phone, email, on-call roster)",
      "Call outcome taxonomy (resolved, callback required, escalated, complaint)",
    ],
  },
  {
    name: "SMS messaging",
    needs: [
      "Approved SMS use cases (reminders, updates, confirmations)",
      "Brand-safe message templates and character limits",
      "Opt-in and opt-out language",
      "Delivery reporting destination (dashboard only or CRM sync)",
    ],
  },
  {
    name: "Website widget",
    needs: [
      "Website domain list and CMS/platform details",
      "Preferred pages for widget placement",
      "Design preferences (button position, color, label)",
      "Tracking requirements for analytics (UTM/event naming)",
    ],
  },
  {
    name: "API and webhooks",
    needs: [
      "REST endpoint requirements for session create/update/close",
      "Webhook consumer URL and HMAC signature verification setup",
      "Retry policy and idempotency strategy",
      "Event contract acceptance for call outcomes and automation actions",
    ],
  },
];

const TIMELINE = [
  {
    phase: "1. Discovery and design",
    duration: "1-3 days",
    detail: "We align on departments, workflows, allowed actions, and success criteria per channel.",
  },
  {
    phase: "2. Integration and configuration",
    duration: "2-5 days",
    detail: "We connect channels and systems, configure capabilities by plan, and load your business rules.",
  },
  {
    phase: "3. UAT and safety checks",
    duration: "1-4 days",
    detail: "You test real scenarios, validate escalations, and approve transcripts, handoffs, and automation outcomes.",
  },
  {
    phase: "4. Go-live and optimization",
    duration: "Ongoing",
    detail: "We launch, monitor quality, tune prompts/workflows, and scale departments or channels as needed.",
  },
];

const GO_LIVE_CHECKLIST = [
  "Final plan selected (Starter, Growth, or Enterprise) with expected monthly volume confirmed",
  "All required integrations connected and credentials validated",
  "Department-level agents configured with owners and escalation contacts",
  "Usage limits and overage expectations reviewed with finance/operations",
  "Compliance wording approved for calls, email, and SMS",
  "Fallback policy verified for outages and unsupported requests",
  "Reporting dashboard access tested by your operations team",
];

export default function HowToPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "34px 16px 70px",
        background:
          "radial-gradient(980px 420px at 12% 0%, rgba(14,165,233,0.17), transparent 64%), radial-gradient(900px 520px at 90% 14%, rgba(245,158,11,0.14), transparent 70%), linear-gradient(145deg, #020617 0%, #0b1220 54%, #111827 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              color: "#67e8f9",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 800,
              marginBottom: "10px",
            }}
          >
            Integration Guide
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "44px", fontWeight: 900, letterSpacing: "-0.02em", color: "#e0f2fe" }}>
            How To Integrate Your System
          </h1>
          <p style={{ margin: "0 auto", maxWidth: "860px", color: "#cbd5e1", lineHeight: 1.7, fontSize: "16px" }}>
            Use this checklist to prepare access, data, and approvals. Clear inputs mean a faster and safer launch.
          </p>
        </div>

        <div
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(125,211,252,0.24)",
            background: "rgba(15,23,42,0.56)",
            padding: "16px 18px",
            marginBottom: "20px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "#bfdbfe", fontSize: "14px" }}>
            Start here: pick your plan, choose channels, then complete each checklist section.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/subscription"
              style={{
                textDecoration: "none",
                borderRadius: "999px",
                border: "1px solid rgba(34,211,238,0.4)",
                background: "rgba(14,165,233,0.14)",
                color: "#e0f2fe",
                fontWeight: 700,
                fontSize: "13px",
                padding: "8px 14px",
              }}
            >
              View Plans
            </Link>
            <Link
              href="/signup"
              style={{
                textDecoration: "none",
                borderRadius: "999px",
                border: "1px solid rgba(251,191,36,0.45)",
                background: "rgba(245,158,11,0.13)",
                color: "#fef3c7",
                fontWeight: 700,
                fontSize: "13px",
                padding: "8px 14px",
              }}
            >
              Start Setup
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px", marginBottom: "34px" }}>
          {[
            { label: "Who should read this", value: "Operations, IT, and Compliance" },
            { label: "Minimum prep time", value: "Half day" },
            { label: "Typical integration", value: "4-12 days" },
            { label: "Main blockers", value: "Missing access or approvals" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: "16px",
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(15,23,42,0.56)",
                padding: "14px",
              }}
            >
              <div style={{ color: "#67e8f9", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "6px" }}>
                {item.label}
              </div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "14px", lineHeight: 1.55 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <section style={{ marginBottom: "34px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "28px", color: "#f8fafc" }}>1) Core Integration Requirements</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
            {CORE_REQUIREMENTS.map((group) => (
              <div
                key={group.title}
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "rgba(15,23,42,0.55)",
                  padding: "18px",
                }}
              >
                <div style={{ color: "#bae6fd", fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>{group.title}</div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1", lineHeight: 1.8, fontSize: "14px" }}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "34px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "28px", color: "#f8fafc" }}>2) Integration-Specific Inputs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
            {INTEGRATION_PATHS.map((path) => (
              <div
                key={path.name}
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(56,189,248,0.24)",
                  background: "rgba(2,6,23,0.62)",
                  padding: "18px",
                }}
              >
                <div style={{ color: "#7dd3fc", fontSize: "16px", fontWeight: 800, marginBottom: "10px" }}>{path.name}</div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1", lineHeight: 1.8, fontSize: "14px" }}>
                  {path.needs.map((need) => (
                    <li key={need}>{need}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "34px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "28px", color: "#f8fafc" }}>3) Delivery Timeline and Ownership</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {TIMELINE.map((step) => (
              <div
                key={step.phase}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "rgba(15,23,42,0.56)",
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "minmax(200px, 0.8fr) minmax(120px, 0.3fr) minmax(0, 1.3fr)",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "14px" }}>{step.phase}</div>
                <div style={{ color: "#67e8f9", fontSize: "13px", fontWeight: 700 }}>{step.duration}</div>
                <div style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>{step.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "34px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "28px", color: "#f8fafc" }}>4) Go-Live Readiness Checklist</h2>
          <div
            style={{
              borderRadius: "18px",
              border: "1px solid rgba(251,191,36,0.28)",
              background: "rgba(120,53,15,0.12)",
              padding: "18px",
            }}
          >
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#fde68a", lineHeight: 1.85, fontSize: "14px" }}>
              {GO_LIVE_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(56,189,248,0.32)",
            background: "linear-gradient(135deg, rgba(2,6,23,0.76), rgba(15,23,42,0.84))",
            padding: "22px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: "25px", color: "#e0f2fe" }}>Need a tailored integration plan?</h3>
          <p style={{ margin: "0 auto 16px", maxWidth: "760px", color: "#cbd5e1", lineHeight: 1.7, fontSize: "15px" }}>
            If your setup includes custom APIs, multiple departments, regulated workflows, or complex routing rules, start with Growth or Enterprise and we can map your rollout in detail.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/subscription"
              style={{
                textDecoration: "none",
                borderRadius: "999px",
                border: "1px solid rgba(56,189,248,0.45)",
                background: "rgba(14,165,233,0.14)",
                color: "#e0f2fe",
                fontWeight: 700,
                fontSize: "13px",
                padding: "9px 14px",
              }}
            >
              Compare Plans
            </Link>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(15,23,42,0.55)",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "13px",
                padding: "9px 14px",
              }}
            >
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
