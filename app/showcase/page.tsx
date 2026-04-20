import Link from "next/link";

export default function ShowcaseIndexPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 16px 56px",
        background:
          "radial-gradient(920px 460px at 16% 0%, rgba(56,189,248,0.16), transparent 65%), radial-gradient(900px 460px at 86% 14%, rgba(34,197,94,0.16), transparent 66%), linear-gradient(145deg, #030712 0%, #0b1220 54%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
            Capability Showcases
          </div>
          <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "42px", letterSpacing: "-0.03em" }}>
            Explore what the agent can do
          </h1>
          <p style={{ marginTop: "10px", color: "#93c5fd", lineHeight: 1.7, maxWidth: "760px" }}>
            Try dedicated demos for live voice calls and email automation workflows.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          <Link
            href="/showcase/call"
            style={{
              textDecoration: "none",
              borderRadius: "18px",
              border: "1px solid rgba(56,189,248,0.32)",
              background: "rgba(15,23,42,0.68)",
              padding: "18px",
              color: "#e0f2fe",
              display: "block",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📞</div>
            <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Call Showcase
            </div>
            <div style={{ color: "#93c5fd", fontSize: "14px", lineHeight: 1.6 }}>
              Live call experience with a hidden 2-minute cap. When the session ends, users are prompted to sign up to continue.
            </div>
          </Link>

          <Link
            href="/showcase/email"
            style={{
              textDecoration: "none",
              borderRadius: "18px",
              border: "1px solid rgba(34,197,94,0.32)",
              background: "rgba(6,24,14,0.68)",
              padding: "18px",
              color: "#dcfce7",
              display: "block",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📧</div>
            <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Email Showcase
            </div>
            <div style={{ color: "#bbf7d0", fontSize: "14px", lineHeight: 1.6 }}>
              See the AI read incoming messages, draft replies, send responses, and resolve business issues through email.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
