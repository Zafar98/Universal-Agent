import Link from "next/link";

const SECTIONS = [
  { title: "1. Service Scope", body: "Universal Agent provides configurable business communication agents, call routing workflows, operational dashboards, transcript tools, and related account services." },
  { title: "2. Account Responsibilities", body: "You are responsible for maintaining account credentials, lawful use of the service, and accuracy of information submitted by your organisation." },
  { title: "3. Acceptable Use", body: "You must not use the service for unlawful communications, fraud, abuse, harassment, security probing, or any activity violating applicable UK law." },
  { title: "4. Data and Recordings", body: "Call metadata and transcripts may be processed to operate features, deliver workflow automation, and support service reliability." },
  { title: "5. Availability and Changes", body: "Features may evolve over time. We may update, suspend, or replace features to maintain platform quality and security." },
  { title: "6. Limitation of Liability", body: "To the extent permitted by law, the service is provided as available, and liability is limited to direct, proven loss under your active subscription period." },
  { title: "7. Governing Law", body: "These terms are governed by the laws of England and Wales unless another mandatory legal framework applies." },
  { title: "8. Contact", body: "legal@universalagent.local" },
];

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px 72px",
        background: "linear-gradient(140deg, #030712 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#7dd3fc", textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "inline-block", marginBottom: "24px" }}>
          ← Back to Universal Agent
        </Link>
        <div
          style={{
            background: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(148,163,184,0.18)",
            borderRadius: "22px",
            padding: "32px 36px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ color: "#7dd3fc", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>Legal</div>
          <h1 style={{ marginTop: 0, color: "#e0f2fe", fontSize: "34px", fontWeight: 900, letterSpacing: "-0.02em" }}>Terms and Conditions</h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px", lineHeight: 1.6 }}>
            Effective date: 17 April 2026. These terms govern access to Universal Agent services for business call handling, voice workflows, and dashboard operations.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title} style={{ borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "20px", marginTop: "20px" }}>
              <h2 style={{ color: "#bae6fd", fontSize: "16px", fontWeight: 800, margin: "0 0 8px" }}>{section.title}</h2>
              <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7, fontSize: "14px" }}>{section.body}</p>
            </div>
          ))}

          <p style={{ color: "#334155", fontSize: "12px", marginTop: "28px", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: "16px", lineHeight: 1.6 }}>
            This page is a deployment-ready baseline and should be reviewed by qualified legal counsel before public production launch.
          </p>
        </div>
      </div>
    </div>
  );
}
