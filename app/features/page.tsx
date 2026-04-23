"use client";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 0 56px 0",
        background:
          "radial-gradient(900px 500px at 14% 0%, rgba(14,165,233,0.10), transparent 65%), radial-gradient(860px 460px at 88% 12%, rgba(251,191,36,0.10), transparent 66%), linear-gradient(145deg, #020617 0%, #0b1220 52%, #111827 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 18px" }}>
        <header style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 44, fontWeight: 900, marginBottom: 10, color: "#e0f2fe", letterSpacing: "-0.03em" }}>
            Agent Platform Features & Capabilities
          </h1>
          <p style={{ fontSize: 20, color: "#93c5fd", maxWidth: 700, lineHeight: 1.7, marginBottom: 0 }}>
            Build, deploy, and scale custom AI agents for any business workflow. Our platform supports voice, email, web, API, and more—plus advanced automation, analytics, and integrations.
          </p>
        </header>

        {/* Demo USPs */}
        <section style={{ marginBottom: 38, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320, background: "rgba(14,165,233,0.10)", border: "1px solid #38bdf8", borderRadius: 18, padding: 28 }}>
            <h2 style={{ color: "#38bdf8", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Demo Email Agent</h2>
            <p style={{ color: "#e0f2fe", fontSize: 16, marginBottom: 16 }}>
              See how our platform builds and runs an agent that handles real customer emails, automates replies, and resolves cases end-to-end.
            </p>
            <Link
              href="/showcase/email"
              style={{
                textDecoration: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Try Email Demo
            </Link>
          </div>
          <div style={{ flex: 1, minWidth: 320, background: "rgba(251,191,36,0.10)", border: "1px solid #fbbf24", borderRadius: 18, padding: 28 }}>
            <h2 style={{ color: "#fbbf24", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Demo Voice Agent</h2>
            <p style={{ color: "#fef9c3", fontSize: 16, marginBottom: 16 }}>
              Experience a custom-built voice agent in action—real-time call handling, routing, and automation for your business.
            </p>
            <Link
              href="/showcase/call"
              style={{
                textDecoration: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "linear-gradient(135deg, #fbbf24, #f59e42)",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Try Voice Demo
            </Link>
          </div>
        </section>

        {/* Feature List */}
        <section>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#7dd3fc", marginBottom: 18 }}>Key Features & Capabilities</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              marginBottom: 0,
            }}
          >
            {[
              { label: "Build agents for any workflow: support, onboarding, booking, compliance, triage, sales, and more", status: "Available" },
              { label: "Multi-channel automation: Voice, email, web chat, SMS, WhatsApp, social messaging", status: "Available" },
              { label: "Real-time call handling, routing, and transcription", status: "Available" },
              { label: "Human handoff/escalation for complex cases", status: "Available" },
              { label: "Custom integrations: CRM, helpdesk, ticketing, APIs, webhooks", status: "Coming Soon" },
              { label: "Website widget and embeddable chat/call", status: "Coming Soon" },
              { label: "Analytics, dashboards, and reporting", status: "Available" },
              { label: "Multi-language support", status: "Planned" },
              { label: "Industry templates and rapid deployment", status: "Planned" },
              { label: "Sentiment analysis on calls and emails", status: "Coming Soon" },
              { label: "Automated ticket creation and CRM updates", status: "Available" },
              { label: "Custom workflow automation (bookings, payments, reminders)", status: "Available" },
              { label: "Smart FAQ and knowledge base integration", status: "Available" },
              { label: "Outbound call/email campaigns (follow-ups, reminders, surveys)", status: "Coming Soon" },
              { label: "Multilingual agent support", status: "Coming Soon" },
              { label: "Advanced analytics: Conversation insights, SLA tracking, agent performance", status: "Available" },
              { label: "Custom agent personalities (tone, script, branding)", status: "Available" },
              { label: "Secure data handling: GDPR, HIPAA, and industry compliance", status: "Available" },
              { label: "Integration marketplace (plug-and-play with popular tools)", status: "Coming Soon" },
              { label: "Self-serve onboarding and configuration", status: "Available" },
              { label: "Voice biometrics or caller verification", status: "Coming Soon" },
              { label: "24/7 uptime and reliability monitoring", status: "Available" },
              { label: "Custom reporting and export tools", status: "Coming Soon" },
              { label: "White-labeling for resellers/partners", status: "Coming Soon" },
            ].map((feature, idx) => {
              let badgeColor = "#4ade80";
              let badgeBg = "rgba(34,197,94,0.13)";
              let badgeBorder = "1px solid #4ade80";
              let badgeText = feature.status;
              if (feature.status === "Coming Soon") {
                badgeColor = "#fbbf24";
                badgeBg = "rgba(251,191,36,0.13)";
                badgeBorder = "1px solid #fbbf24";
              } else if (feature.status === "Planned") {
                badgeColor = "#38bdf8";
                badgeBg = "rgba(56,189,248,0.13)";
                badgeBorder = "1px solid #38bdf8";
              }
              return (
                <div
                  key={feature.label}
                  tabIndex={0}
                  style={{
                    borderRadius: "16px",
                    border: badgeBorder,
                    background: "rgba(2,6,23,0.56)",
                    padding: "22px 20px 18px 20px",
                    boxShadow: "0 2px 16px 0 rgba(56,189,248,0.07)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    outline: "none",
                    transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.boxShadow = `0 4px 32px 0 ${badgeColor}33`;
                    e.currentTarget.style.border = `2px solid ${badgeColor}`;
                    e.currentTarget.style.background = badgeBg;
                  }}
                  onFocus={e => {
                    e.currentTarget.style.boxShadow = `0 4px 32px 0 ${badgeColor}33`;
                    e.currentTarget.style.border = `2px solid ${badgeColor}`;
                    e.currentTarget.style.background = badgeBg;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.boxShadow = "0 2px 16px 0 rgba(56,189,248,0.07)";
                    e.currentTarget.style.border = badgeBorder;
                    e.currentTarget.style.background = "rgba(2,6,23,0.56)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.boxShadow = "0 2px 16px 0 rgba(56,189,248,0.07)";
                    e.currentTarget.style.border = badgeBorder;
                    e.currentTarget.style.background = "rgba(2,6,23,0.56)";
                  }}
                >
                  <div style={{ fontSize: 17, color: "#e0f2fe", fontWeight: 700, marginBottom: 6 }}>{feature.label}</div>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      display: "inline-block",
                      borderRadius: "999px",
                      background: badgeBg,
                      border: badgeBorder,
                      color: badgeColor,
                      padding: "2px 12px",
                      fontSize: "13px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {badgeText}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}