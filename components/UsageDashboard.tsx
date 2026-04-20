"use client";

import { useEffect, useState } from "react";

interface Usage {
  voiceCalls: number;
  voiceMinutes: number;
  emailsSent: number;
  smsSent: number;
}

interface Limits {
  voice_calls: number;
  voice_minutes: number;
  emails: number;
  sms_messages: number;
}

interface Overages {
  voiceCallOverages: number;
  voiceMinuteOverages: number;
  emailOverages: number;
  smsOverages: number;
}

interface UsageDashboardProps {
  planName?: string;
}

export default function UsageDashboard({ planName }: UsageDashboardProps) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [overages, setOverages] = useState<Overages | null>(null);
  const [overageCharges, setOverageCharges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) {
          throw new Error("Failed to fetch usage");
        }
        const data = await res.json();
        setUsage(data.usage);
        setLimits(data.limits);
        setOverages(data.overages);
        setOverageCharges(data.overageCharges);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
        Loading usage data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "#f87171", backgroundColor: "#7f1d1d", borderRadius: "8px" }}>
        Error: {error}
      </div>
    );
  }

  if (!usage || !limits) {
    return (
      <div style={{ padding: "20px", color: "#94a3b8" }}>
        No usage data available
      </div>
    );
  }

  const usageMetrics = [
    {
      label: "Voice Calls",
      current: usage.voiceCalls,
      limit: limits.voice_calls,
      unit: "calls",
      color: "#3b82f6",
      overage: overages?.voiceCallOverages || 0,
      overageLabel: "calls over limit",
    },
    {
      label: "Voice Minutes",
      current: usage.voiceMinutes,
      limit: limits.voice_minutes,
      unit: "minutes",
      color: "#06b6d4",
      overage: overages?.voiceMinuteOverages || 0,
      overageLabel: "minutes over limit",
    },
    {
      label: "Emails",
      current: usage.emailsSent,
      limit: limits.emails,
      unit: "emails",
      color: "#22c55e",
      overage: overages?.emailOverages || 0,
      overageLabel: "emails over limit",
    },
    {
      label: "SMS",
      current: usage.smsSent,
      limit: limits.sms_messages,
      unit: "SMS",
      color: "#f59e0b",
      overage: overages?.smsOverages || 0,
      overageLabel: "SMS over limit",
    },
  ];

  const hasAnyOverage = usageMetrics.some((metric) => metric.overage > 0);

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Overage Charges Alert */}
      {overageCharges > 0 && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#7c2d12",
            border: "1px solid #ea580c",
            borderRadius: "8px",
            color: "#fed7aa",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            ⚠️ Overage Charges This Month
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#fbbf24" }}>
            £{overageCharges.toFixed(2)}
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#fed7aa" }}>
            You have exceeded your plan limits. These charges will be billed to your account at the end of the month.
          </div>
        </div>
      )}

      {/* Usage Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {usageMetrics.map((metric) => {
          const percentage = Math.min((metric.current / Math.max(metric.limit, 1)) * 100, 100);
          const isOverLimit = metric.current > metric.limit;
          const hasOverage = metric.overage > 0;

          return (
            <div
              key={metric.label}
              style={{
                padding: "16px",
                border: `1px solid ${isOverLimit ? "#dc2626" : "#475569"}`,
                borderRadius: "8px",
                backgroundColor: isOverLimit ? "#7f1d1d" : "#1e293b",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "14px" }}>
                    {metric.label}
                  </span>
                  <span style={{ color: isOverLimit ? "#fca5a5" : "#cbd5e1", fontSize: "12px" }}>
                    {metric.current} / {metric.limit} {metric.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#334155",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOverLimit ? "#dc2626" : metric.color,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Usage percentage */}
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: isOverLimit ? "#fca5a5" : "#94a3b8",
                  }}
                >
                  {percentage.toFixed(0)}% of monthly limit
                </div>
              </div>

              {/* Overage info */}
              {hasOverage && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#9f1239",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#fca5a5",
                    marginTop: "8px",
                  }}
                >
                  ⚠️ {metric.overage} {metric.overageLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No limit reached */}
      {!hasAnyOverage && overageCharges === 0 && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#064e3b",
            border: "1px solid #10b981",
            borderRadius: "8px",
            color: "#a7f3d0",
            textAlign: "center",
          }}
        >
          ✓ You're within your plan limits this month!
        </div>
      )}
    </div>
  );
}
