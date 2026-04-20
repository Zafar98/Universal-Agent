import Link from "next/link";

const SECTIONS = [
  { title: "1. Data We Process", body: "We process account identifiers, business details, call metadata, workflow outcomes, and transcript content required to provide platform functions." },
  { title: "2. Why We Process Data", body: "Processing is used for account authentication, call routing, operational reporting, fraud prevention, service support, and compliance obligations." },
  { title: "3. Legal Basis (UK GDPR)", body: "We process data on the basis of contract performance, legitimate interests in secure platform operation, and legal obligations where applicable." },
  { title: "4. Data Retention", body: "Data is retained only for the period required to operate the service, meet contractual commitments, and satisfy legal/regulatory requirements." },
  { title: "5. Security Measures", body: "We apply authentication controls, access restrictions, anti-bot protections, and operational safeguards to reduce misuse and unauthorised access." },
  { title: "6. Your Rights", body: "Subject to applicable law, you may request access, correction, restriction, deletion, and portability of personal data." },
  { title: "7. Contact", body: "privacy@asistoria.local" },
];

export default function PrivacyPage() {
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
          ← Back to Asistoria
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
          <h1 style={{ marginTop: 0, color: "#e0f2fe", fontSize: "34px", fontWeight: 900, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px", lineHeight: 1.6 }}>
            Effective date: 17 April 2026. This policy explains how Asistoria processes personal data for account management, call operations, and service delivery.
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
