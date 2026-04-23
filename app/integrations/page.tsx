import Link from "next/link";

export default function IntegrationsPage() {
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
            Integrations & Setup
          </h1>
          <p style={{ fontSize: 20, color: "#93c5fd", maxWidth: 700, lineHeight: 1.7, marginBottom: 0 }}>
            Learn how your AI agent connects to your business and how easy it is to get started.
          </p>
        </header>

        <section style={{ marginBottom: 38 }}>
          <h2 style={{ color: "#7dd3fc", fontWeight: 800, fontSize: 24, marginBottom: 14 }}>How Integration Works</h2>
          <ol style={{ color: "#e0e8f0", fontSize: 17, lineHeight: 1.7, paddingLeft: 22, marginBottom: 0 }}>
            <li style={{ marginBottom: 18 }}>
              <strong>Sign up and choose your product:</strong> Select the agent package that fits your business needs. Our onboarding flow guides you through every step.
            </li>
            <li style={{ marginBottom: 18 }}>
              <strong>Pick your integration method:</strong> You can connect your agent via:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 22, color: "#a5f3fc", fontSize: 15 }}>
                <li>Website widget (simple copy-paste JS snippet)</li>
                <li>Dedicated phone number (SIP/VoIP, Twilio, Zoom, Teams, etc.)</li>
                <li>Email (IMAP, Office365, Gmail, SMTP relay)</li>
                <li>CRM/helpdesk (Salesforce, HubSpot, Zendesk, Intercom, etc.)</li>
                <li>Custom API/webhook integration</li>
              </ul>
            </li>
            <li style={{ marginBottom: 18 }}>
              <strong>Configure and launch:</strong> Our dashboard provides step-by-step setup guides for each integration. Most clients are live in under 30 minutes.
            </li>
            <li style={{ marginBottom: 18 }}>
              <strong>Test and go live:</strong> Use our built-in demo tools to test your agent with real calls and emails before launch. Get instant feedback and support.
            </li>
            <li>
              <strong>Ongoing support & updates:</strong> We monitor, maintain, and update your agent. You get analytics, call/email logs, and can request changes anytime.
            </li>
          </ol>
        </section>

        <section style={{ marginBottom: 38 }}>
          <h2 style={{ color: "#fbbf24", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Why Integrate with Us?</h2>
          <ul style={{ color: "#e2e8f0", fontSize: 17, lineHeight: 1.7, paddingLeft: 22, marginBottom: 0 }}>
            <li>Fastest setup in the industry—no developer required for most integrations</li>
            <li>Works with your existing website, phone, and business tools</li>
            <li>Secure, GDPR-compliant, and privacy-first by design</li>
            <li>Custom onboarding and white-glove support available</li>
            <li>Scales with your business—add channels or integrations anytime</li>
          </ul>
        </section>

        <section style={{ marginBottom: 38 }}>
          <h2 style={{ color: "#38bdf8", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>See It in Action</h2>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 320, background: "rgba(14,165,233,0.10)", border: "1px solid #38bdf8", borderRadius: 18, padding: 28, marginBottom: 18 }}>
              <h3 style={{ color: "#38bdf8", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Demo Email Integration</h3>
              <p style={{ color: "#e0f2fe", fontSize: 15, marginBottom: 16 }}>
                Instantly see how our agent integrates with your email workflow and automates responses.
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
            <div style={{ flex: 1, minWidth: 320, background: "rgba(251,191,36,0.10)", border: "1px solid #fbbf24", borderRadius: 18, padding: 28, marginBottom: 18 }}>
              <h3 style={{ color: "#fbbf24", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Demo Voice Integration</h3>
              <p style={{ color: "#fef9c3", fontSize: 15, marginBottom: 16 }}>
                Experience seamless voice agent integration—real-time call handling and automation.
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
          </div>
        </section>

        <div style={{ marginTop: 18, color: "#a5f3fc", fontSize: 15 }}>
          Need a custom integration or have questions? <Link href="/contact" style={{ color: "#fbbf24", textDecoration: "underline" }}>Contact us</Link> for a free consultation.
        </div>
      </div>
    </div>
  );
}