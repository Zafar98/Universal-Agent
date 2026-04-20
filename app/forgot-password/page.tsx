"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to send reset link.");
        return;
      }
      setMessage(data.message || "If an account exists, a reset email has been sent.");
    } catch {
      setError("Unable to send reset link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#050816", padding: 16 }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 420, background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 18, padding: 24, color: "#e2e8f0" }}>
        <h1 style={{ marginTop: 0 }}>Reset password</h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Enter your account email and we will send a reset link.</p>

        <label style={{ display: "block", marginBottom: 6, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Email
        </label>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          type="email"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.24)", background: "rgba(2,6,23,0.7)", color: "#e2e8f0", marginBottom: 12 }}
        />

        {error ? <div style={{ marginBottom: 10, color: "#fca5a5" }}>{error}</div> : null}
        {message ? <div style={{ marginBottom: 10, color: "#86efac" }}>{message}</div> : null}

        <button type="submit" disabled={loading} style={{ width: "100%", border: "none", borderRadius: 10, padding: "11px 12px", fontWeight: 800, color: "white", background: loading ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg,#06b6d4,#2563eb)", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <div style={{ marginTop: 12 }}>
          <Link href="/login" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
