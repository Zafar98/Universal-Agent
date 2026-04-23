import React from "react";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{
      background: "#0f172a",
      color: "#cbd5e1",
      padding: "40px 0 20px 0",
      borderTop: "1px solid #334155",
      marginTop: 60,
      fontSize: 15
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 32 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>AI Voice & Email Agent</div>
            <div style={{ maxWidth: 320, color: "#94a3b8" }}>
              Professional AI agents for calls and emails. Automate, scale, and delight your customers 24/7.
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Company</div>
            <div><Link href="/contact" style={{ color: "#38bdf8", textDecoration: "none" }}>Contact</Link></div>
            <div><Link href="/subscription" style={{ color: "#38bdf8", textDecoration: "none" }}>Pricing</Link></div>
            <div><Link href="/how-to" style={{ color: "#38bdf8", textDecoration: "none" }}>How It Works</Link></div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Legal</div>
            <div><Link href="/privacy" style={{ color: "#38bdf8", textDecoration: "none" }}>Privacy Policy</Link></div>
            <div><Link href="/terms" style={{ color: "#38bdf8", textDecoration: "none" }}>Terms of Service</Link></div>
          </div>
        </div>
        <div style={{ marginTop: 32, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} AI Voice & Email Agent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
