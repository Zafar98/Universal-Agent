"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setSent(true);
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    } catch (err) {
      setError("Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #030712 0%, #0b1220 54%, #0f172a 100%)", color: "#e2e8f0", fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif", padding: "60px 0" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", background: "rgba(2,6,23,0.62)", borderRadius: 18, padding: 36, boxShadow: "0 4px 32px #38bdf822" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#e0f2fe", marginBottom: 18 }}>Contact Us</h1>
        <p style={{ color: "#93c5fd", marginBottom: 24 }}>Book a consultation, request a demo, or ask a question. We’ll get back to you within one business day.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="text" required placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #334155" }} />
          <input type="email" required placeholder="Business Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #334155" }} />
          <input type="text" placeholder="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #334155" }} />
          <textarea required placeholder="How can we help?" value={message} onChange={e => setMessage(e.target.value)} rows={5} style={{ padding: 12, borderRadius: 8, border: "1px solid #334155", resize: "vertical" }} />
          <button type="submit" disabled={sending} style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", color: "#082f49", fontWeight: 900, fontSize: 18, borderRadius: 10, padding: "14px 0", border: "none", marginTop: 8, cursor: sending ? "not-allowed" : "pointer" }}>{sending ? "Sending..." : "Send Message"}</button>
          {sent && <div style={{ color: "#4ade80", fontWeight: 700, marginTop: 8 }}>Message sent! We’ll be in touch soon.</div>}
          {error && <div style={{ color: "#ef4444", marginTop: 8 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
