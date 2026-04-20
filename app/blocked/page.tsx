export default function BlockedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(145deg, #020617, #0f172a)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          borderRadius: "18px",
          border: "1px solid rgba(148,163,184,0.25)",
          background: "rgba(15,23,42,0.82)",
          padding: "24px",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "28px" }}>Access blocked</h1>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          This request was blocked by automated abuse protection. If you believe this is a mistake,
          contact platform support and include your approximate timestamp and network details for review.
        </p>
      </div>
    </div>
  );
}
