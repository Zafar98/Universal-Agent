import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(140deg, #030712 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "80px",
          fontWeight: 900,
          background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: "16px",
        }}
      >
        404
      </div>
      <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
        Page Not Found
      </div>
      <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "400px", lineHeight: 1.6, margin: "0 0 32px" }}>
        This page does not exist or has been moved. Head back to the platform.
      </p>
      <Link
        href="/"
        style={{
          background: "linear-gradient(135deg, #06b6d4, #2563eb)",
          color: "white",
          textDecoration: "none",
          fontSize: "15px",
          fontWeight: 700,
          padding: "12px 28px",
          borderRadius: "999px",
          boxShadow: "0 8px 20px rgba(6,182,212,0.25)",
        }}
      >
        Back to Universal Agent
      </Link>
    </div>
  );
}
