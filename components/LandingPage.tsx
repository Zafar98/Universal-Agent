"use client";

import Link from "next/link";

const CAPABILITIES = [
  {
    icon: "📧",
    title: "Email Management",
    colour: "#22d3ee",
    description:
      "The agent triages inbound emails, drafts accurate replies, and closes routine issues automatically.",
    points: [
      "Shared inbox monitoring and triage",
      "Auto-drafted and sent customer responses",
      "Issue resolution from email threads",
      "Complaint, billing, and booking handling",
    ],
  },
  {
    icon: "📞",
    title: "Live Call Handling",
    colour: "#a78bfa",
    description:
      "Every call is answered quickly, resolved clearly, and logged with the right next action.",
    points: [
      "Answers calls 24 hours, 7 days a week",
      "Recognises urgency and emotional tone",
      "Books contractors and confirms ETAs",
      "Hands off to staff only when truly needed",
    ],
  },
  {
    icon: "⚙️",
    title: "Workflow Automation",
    colour: "#34d399",
    description:
      "After each interaction, records are updated and downstream workflows run automatically.",
    points: [
      "Tickets created and assigned automatically",
      "SMS and email confirmations sent instantly",
      "CRM and helpdesk integration via webhooks",
      "Full audit trail of every action taken",
    ],
  },
  {
    icon: "🕐",
    title: "24/7 Availability",
    colour: "#fb923c",
    description:
      "The agent handles calls and emails around the clock with consistent response times.",
    points: [
      "No downtime — always available",
      "Night, weekend, and bank holiday cover",
      "Instant response time on every channel",
      "Scales with demand automatically",
    ],
  },
];

const USE_CASES = [
  { icon: "🏠", sector: "Housing", example: "Emergency repairs, tenancy issues, complaints, contractor dispatch" },
  { icon: "🏨", sector: "Hotel", example: "Reservations, concierge requests, guest services, check-in support" },
  { icon: "🍽️", sector: "Restaurant", example: "Table bookings, order queries, allergen questions, event enquiries" },
  { icon: "⚡", sector: "Utilities", example: "Outage reports, billing disputes, account changes, engineer scheduling" },
  { icon: "🏛️", sector: "Council", example: "Council tax, housing benefits, waste services, licensing" },
  { icon: "🏢", sector: "Corporate", example: "Multi-department support, internal helpdesk, policy queries" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "You subscribe and share your setup details",
    detail:
      "Pick a plan, tell us about your departments, workflows, and what your agent should know. We configure everything before go-live.",
  },
  {
    step: "2",
    title: "We build and deploy your agent",
    detail:
      "Your agent is trained on your business logic, connected to your inbox or phone number, and deployed. Typical setup takes days, not months.",
  },
  {
    step: "3",
    title: "The agent handles your workload 24/7",
    detail:
      "Calls are answered, emails resolved, tickets created, and contractors dispatched — autonomously. You see everything in your dashboard in real time.",
  },
  {
    step: "4",
    title: "You only touch the exceptions",
    detail:
      "The agent escalates only what genuinely needs a human. Complex complaints, legal risk, or distressed callers are flagged immediately.",
  },
];

export function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        color: "#e2e8f0",
        overflowX: "hidden",
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          background:
            "radial-gradient(1100px 600px at 14% 0%, rgba(14,165,233,0.2), transparent 60%), radial-gradient(900px 560px at 88% 10%, rgba(124,58,237,0.18), transparent 64%), linear-gradient(145deg, #030712 0%, #0b1220 54%, #0f172a 100%)",
          padding: "70px 20px 72px",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ maxWidth: "820px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "999px",
                border: "1px solid rgba(14,165,233,0.4)",
                background: "rgba(14,165,233,0.1)",
                padding: "6px 14px",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22d3ee",
                  boxShadow: "0 0 8px #22d3ee",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#7dd3fc", fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em" }}>
                AI-Powered Business Automation
              </span>
            </div>

            <h1
              style={{
                margin: "0 0 22px",
                fontSize: "clamp(38px, 5vw, 64px)",
                fontWeight: 900,
                lineHeight: 1.03,
                letterSpacing: "-0.035em",
                color: "#f0f9ff",
              }}
            >
              Managing your emails, calls, and workload{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                24 hours a day.
              </span>
            </h1>

            <p
              style={{
                margin: "0 0 32px",
                fontSize: "19px",
                color: "#93c5fd",
                lineHeight: 1.75,
                maxWidth: "680px",
              }}
            >
              Asistoria runs your first-line support so your team can focus on higher-value work.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/showcase/call"
                style={{
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                  color: "white",
                  borderRadius: "14px",
                  padding: "14px 26px",
                  fontWeight: 800,
                  fontSize: "15px",
                  boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
                }}
              >
                Hear the agent live →
              </Link>
              <Link
                href="/subscription"
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(15,23,42,0.6)",
                  color: "#e2e8f0",
                  borderRadius: "14px",
                  padding: "14px 26px",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                View plans
              </Link>
            </div>
          </div>

          {/* stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginTop: "52px",
              maxWidth: "820px",
            }}
          >
            {[
              { value: "24/7", label: "Always available" },
              { value: "< 1s", label: "Call answer time" },
              { value: "100%", label: "Interactions logged" },
              { value: "0", label: "Missed calls" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(15,23,42,0.56)",
                  padding: "16px",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: 900,
                    color: "#e0f2fe",
                    letterSpacing: "-0.03em",
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#64748b", fontSize: "13px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What the agent does ───────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 20px",
          background:
            "radial-gradient(900px 400px at 90% 50%, rgba(124,58,237,0.1), transparent 70%), linear-gradient(180deg, #0b1220, #030712)",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "42px" }}>
            <div
              style={{
                color: "#67e8f9",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              Core Capabilities
            </div>
            <h2 style={{ margin: 0, fontSize: "38px", fontWeight: 900, color: "#e0f2fe", letterSpacing: "-0.025em" }}>
              One agent. Every channel. Every hour.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: "16px",
            }}
          >
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                style={{
                  borderRadius: "22px",
                  border: `1px solid ${cap.colour}33`,
                  background: "rgba(15,23,42,0.62)",
                  padding: "24px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: `${cap.colour}18`,
                    border: `1px solid ${cap.colour}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "14px",
                  }}
                >
                  {cap.icon}
                </div>
                <div style={{ color: cap.colour, fontWeight: 800, fontSize: "18px", marginBottom: "8px" }}>
                  {cap.title}
                </div>
                <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
                  {cap.description}
                </p>
                <ul style={{ margin: 0, paddingLeft: "16px", color: "#cbd5e1", fontSize: "13px", lineHeight: 2 }}>
                  {cap.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 20px",
          background: "linear-gradient(180deg, #030712 0%, #060d1a 100%)",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "42px" }}>
            <div
              style={{
                color: "#a78bfa",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              How It Works
            </div>
            <h2 style={{ margin: 0, fontSize: "38px", fontWeight: 900, color: "#e0f2fe", letterSpacing: "-0.025em" }}>
              From setup to autonomous in days.
            </h2>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: "20px",
                  alignItems: "start",
                  borderRadius: "18px",
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(15,23,42,0.5)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "18px",
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "17px", marginBottom: "6px" }}>
                    {item.title}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industry use cases ───────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 20px",
          background:
            "radial-gradient(860px 440px at 20% 60%, rgba(34,197,94,0.1), transparent 65%), linear-gradient(180deg, #060d1a 0%, #030712 100%)",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "42px" }}>
            <div
              style={{
                color: "#34d399",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              Industry Coverage
            </div>
            <h2 style={{ margin: 0, fontSize: "38px", fontWeight: 900, color: "#e0f2fe", letterSpacing: "-0.025em" }}>
              Built for the sectors that never stop.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {USE_CASES.map((item) => (
              <div
                key={item.sector}
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(15,23,42,0.54)",
                  padding: "18px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{item.icon}</div>
                <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "16px", marginBottom: "6px" }}>
                  {item.sector}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.65 }}>{item.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 20px",
          background:
            "radial-gradient(900px 400px at 50% 50%, rgba(14,165,233,0.16), transparent 60%), linear-gradient(180deg, #030712 0%, #0b1220 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "38px",
              fontWeight: 900,
              color: "#e0f2fe",
              letterSpacing: "-0.025em",
            }}
          >
            Ready to hand your workload to an agent?
          </h2>
          <p style={{ margin: "0 0 28px", color: "#93c5fd", fontSize: "17px", lineHeight: 1.7 }}>
            Hear the agent handle a live call right now — no sign-up, no credit card. Then choose the plan that fits your operation.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/showcase/call"
              style={{
                textDecoration: "none",
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                color: "white",
                borderRadius: "14px",
                padding: "14px 28px",
                fontWeight: 800,
                fontSize: "15px",
                boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
              }}
            >
              Start a live call test →
            </Link>
            <Link
              href="/subscription"
              style={{
                textDecoration: "none",
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(15,23,42,0.6)",
                color: "#e2e8f0",
                borderRadius: "14px",
                padding: "14px 28px",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              View plans
            </Link>
            <Link
              href="/how-to"
              style={{
                textDecoration: "none",
                border: "1px solid rgba(251,191,36,0.38)",
                background: "rgba(120,53,15,0.18)",
                color: "#fef3c7",
                borderRadius: "14px",
                padding: "14px 28px",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Integration guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
