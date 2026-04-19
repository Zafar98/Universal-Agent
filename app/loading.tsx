export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(140deg, #030712 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes ua-spin { to { transform: rotate(360deg); } }
        @keyframes ua-pulse-text { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(56,189,248,0.2)",
            borderTop: "3px solid #38bdf8",
            borderRadius: "50%",
            animation: "ua-spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <div
          style={{
            color: "#7dd3fc",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            animation: "ua-pulse-text 1.4s ease-in-out infinite",
          }}
        >
          Loading…
        </div>
      </div>
    </div>
  );
}
