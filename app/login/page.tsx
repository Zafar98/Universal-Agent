"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      console.error("Login request failed:", submitError);
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(960px 480px at 12% 0%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(960px 520px at 88% 12%, rgba(37,99,235,0.16), transparent 62%), linear-gradient(145deg, #030712 0%, #0f172a 48%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        padding: "28px 18px 44px",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "28px", alignItems: "start" }}>
        <section style={{ paddingTop: "28px" }}>
          <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px" }}>
            Customer Login
          </div>
          <h1 style={{ margin: "0 0 14px", color: "#e0f2fe", fontSize: "52px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: "640px" }}>
            Sign in to manage your live AI call operation.
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "17px", lineHeight: 1.75, maxWidth: "660px", margin: "0 0 22px" }}>
            Your dashboard is where you review live calls, track subscription status, manage routing, inspect transcripts, and complete business setup after signup.
          </p>

          <div style={{ display: "grid", gap: "12px", marginBottom: "22px" }}>
            {[
              {
                title: "What you can do after login",
                detail: "Review recent calls, see urgent issues, and monitor autonomous actions from the same dashboard.",
              },
              {
                title: "Account and subscription status",
                detail: "Check whether your plan is active, whether your integration is ready, and what remains before launch.",
              },
              {
                title: "Workspace controls",
                detail: "Open department agents, manage notifications and staff, and continue your business setup when needed.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: "18px",
                  background: "rgba(15,23,42,0.58)",
                  border: "1px solid rgba(148,163,184,0.14)",
                  padding: "16px 18px",
                  boxShadow: "0 14px 30px rgba(2,6,23,0.28)",
                }}
              >
                <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "16px", marginBottom: "6px" }}>{item.title}</div>
                <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.65 }}>{item.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 800, fontSize: "14px" }}>
              Need an account? Create one →
            </Link>
            <Link href="/subscription" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 800, fontSize: "14px" }}>
              Need a full plan? View subscription options →
            </Link>
          </div>
        </section>

        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
            background: "rgba(15,23,42,0.84)",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "24px",
            padding: "32px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 24px 60px rgba(2,6,23,0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
            <div>
              <div style={{ color: "#7dd3fc", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px" }}>
                Business Sign In
              </div>
              <h2 style={{ margin: 0, color: "#e0f2fe", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>Welcome back</h2>
            </div>
            <Link href="/signup" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>
              Sign Up →
            </Link>
          </div>

          <div style={{ marginBottom: "16px", borderRadius: "14px", background: "rgba(30,64,175,0.16)", padding: "12px 14px", color: "#bfdbfe", fontSize: "13px", border: "1px solid rgba(59,130,246,0.24)", lineHeight: 1.6 }}>
            Use the email you verified during signup. Once inside, you will see your workspace status, live call activity, and next setup steps.
          </div>

          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Email or phone
          </label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            placeholder="you@business.com"
            style={{
              width: "100%",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: "12px",
              padding: "12px 13px",
              marginBottom: "14px",
              background: "rgba(15,23,42,0.72)",
              color: "#e0f2fe",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
            style={{
              width: "100%",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: "12px",
              padding: "12px 13px",
              marginBottom: "18px",
              background: "rgba(15,23,42,0.72)",
              color: "#e0f2fe",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          {error ? (
            <div
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#fca5a5",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "14px",
                fontSize: "13px",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "14px",
              padding: "14px 14px",
              background: loading ? "rgba(37,99,235,0.6)" : "linear-gradient(135deg, #06b6d4, #2563eb)",
              color: "white",
              fontWeight: 800,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(6,182,212,0.2)",
            }}
          >
            {loading ? "Signing in…" : "Open Dashboard"}
          </button>

          <div style={{ marginTop: "16px", color: "#475569", fontSize: "13px", textAlign: "center", lineHeight: 1.7 }}>
            <Link href="/forgot-password" style={{ color: "#67e8f9", fontWeight: 700, textDecoration: "none" }}>
              Forgot password?
            </Link>
            <br />
            No account?{" "}
            <Link href="/signup" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>
              Create one
            </Link>
            <br />
            Platform admin?{" "}
            <Link href="/admin/login" style={{ color: "#7dd3fc", fontWeight: 700, textDecoration: "none" }}>
              Admin login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
