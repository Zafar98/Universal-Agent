"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("admin@platform.local");
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
        setError(data.error || "Admin login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (submitError) {
      console.error("Admin login request failed:", submitError);
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #eef3ff 0%, #dbe7ff 52%, #f5f8ff 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        padding: "20px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "24px",
          boxShadow: "0 12px 28px rgba(16,24,40,0.08)",
        }}
      >
        <h1 style={{ margin: 0, color: "#102349", fontSize: "30px" }}>Platform Admin Login</h1>
        <p style={{ color: "#4f6895", marginTop: "8px", marginBottom: "18px" }}>
          Sign in to monitor all business models, all calls, and contractor workflows.
        </p>

        <label style={{ fontSize: "13px", color: "#374151", display: "block", marginBottom: "6px" }}>
          Admin identifier
        </label>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "12px",
            background: "white",
            color: "#111827",
          }}
        />

        <label style={{ fontSize: "13px", color: "#374151", display: "block", marginBottom: "6px" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "14px",
            background: "white",
            color: "#111827",
          }}
        />

        {error ? (
          <div
            style={{
              background: "#7f1d1d",
              color: "#fecaca",
              borderRadius: "8px",
              padding: "8px 10px",
              marginBottom: "12px",
              fontSize: "13px",
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
            borderRadius: "10px",
            padding: "11px 14px",
            background: loading ? "#3b82f6" : "#1d4ed8",
            color: "white",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Admin Sign In"}
        </button>
      </form>
    </div>
  );
}