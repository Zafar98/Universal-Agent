"use client";

import { useState } from "react";

export default function QuoteRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);
    try {
      // Replace with your API endpoint
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, projectType, details }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
      setName("");
      setEmail("");
      setCompany("");
      setProjectType("");
      setDetails("");
    } catch (err) {
      setError("Could not send your request. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: 24, background: "rgba(15,23,42,0.62)", borderRadius: 18, border: "1px solid #38bdf8" }}>
      <h1 style={{ color: "#e0f2fe", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Request a Custom Quote</h1>
      <p style={{ color: "#94a3b8", marginBottom: 18 }}>
        Tell us about your project or requirements. We'll get back to you with a tailored proposal and pricing.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="text"
          required
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
        />
        <input
          type="email"
          required
          placeholder="Your Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
        />
        <input
          type="text"
          placeholder="Company (optional)"
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
        />
        <select
          value={projectType}
          onChange={e => setProjectType(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}
        >
          <option value="">Select Project Type</option>
          <option value="website">Website Build</option>
          <option value="voice-agent">Voice Agent</option>
          <option value="email-agent">Email Agent</option>
          <option value="integration">Integration/API</option>
          <option value="other">Other / Not Sure</option>
        </select>
        <textarea
          required
          placeholder="Describe your needs, goals, or questions..."
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={5}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", resize: "vertical" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            color: "white",
            fontWeight: 700,
            border: "none",
            borderRadius: 8,
            padding: "12px 18px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? "Sending..." : "Request Quote"}
        </button>
        {submitted && <div style={{ color: "#4ade80", fontWeight: 700 }}>Thank you! We'll be in touch soon.</div>}
        {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      </form>
    </div>
  );
}
