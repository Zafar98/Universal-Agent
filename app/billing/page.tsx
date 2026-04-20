"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UsageDashboard from "@/components/UsageDashboard";

interface BillingInfo {
  planName: string;
  monthlyPrice: number;
  month: string;
}

export default function BillingPage() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBillingInfo() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) {
          throw new Error("Failed to fetch billing info");
        }
        const data = await res.json();
        setBillingInfo({
          planName: data.plan,
          monthlyPrice: 0, // Would be fetched from pricing config
          month: data.month,
        });
      } catch (error) {
        console.error("Failed to fetch billing info:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingInfo();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        background:
          "radial-gradient(920px 420px at 16% 0%, rgba(34,211,238,0.2), transparent 64%), radial-gradient(900px 460px at 88% 18%, rgba(52,211,153,0.17), transparent 68%), linear-gradient(145deg, #020617 0%, #030712 52%, #0b1220 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#67e8f9",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "inline-block",
            }}
          >
            ← Back to Dashboard
          </Link>

          <h1
            style={{
              margin: "16px 0 8px",
              fontSize: "48px",
              fontWeight: 900,
              color: "#e0f2fe",
              letterSpacing: "-0.02em",
            }}
          >
            Usage & Billing
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: "16px", margin: "0" }}>
            Monitor your monthly usage across all channels and see any overage charges
          </p>
        </div>

        {/* Current Month Info */}
        {billingInfo && (
          <div
            style={{
              marginBottom: "32px",
              padding: "20px",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: "12px",
              backgroundColor: "rgba(15,23,42,0.4)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                  Current Month
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
                  {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                  Active Plan
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#a5f3fc", textTransform: "capitalize" }}>
                  {billingInfo.planName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Dashboard */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>
            <div>Loading usage data...</div>
          </div>
        ) : (
          <UsageDashboard />
        )}

        {/* Billing History Section */}
        <div style={{ marginTop: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#e0f2fe", marginBottom: "20px" }}>
            How Usage-Based Billing Works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                title: "📊 Monthly Allowance",
                description:
                  "Each plan includes a monthly allowance of calls, emails, and SMS. For Starter: 500 emails only. Growth and Enterprise include voice, email, and SMS.",
              },
              {
                title: "💳 Overage Pricing",
                description:
                  "If you exceed your monthly limits, each overage unit is billed at the rate shown on your plan. Growth: £1.50/call, £0.10/min. Enterprise: £0.75/call, £0.05/min.",
              },
              {
                title: "📋 Monthly Billing",
                description:
                  "Usage is tracked daily and overage charges are calculated monthly. Your bill is issued at the start of the next billing cycle.",
              },
              {
                title: "🔍 Real-Time Tracking",
                description:
                  "View your current usage anytime on this page. You'll know exactly when you're approaching limits and how much overages will cost.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "20px",
                  border: "1px solid rgba(148,163,184,0.25)",
                  borderRadius: "10px",
                  backgroundColor: "rgba(15,23,42,0.4)",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#a5f3fc", marginBottom: "8px" }}>
                  {item.title}
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Section */}
        <div
          style={{
            marginTop: "48px",
            padding: "32px",
            border: "1px solid rgba(59,130,246,0.4)",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(30,58,138,0.3), rgba(12,74,110,0.3))",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800, color: "#bfdbfe" }}>
            Need higher limits?
          </h3>
          <p style={{ color: "#cbd5e1", margin: "0 0 16px", fontSize: "15px" }}>
            Upgrade to a higher plan to get more monthly calls, emails, and SMS with lower overage rates.
          </p>
          <Link
            href="/subscription"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
              transition: "background 0.2s",
            }}
          >
            View All Plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
