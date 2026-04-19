"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INTEGRATIONS = [
  {
    id: "website-widget",
    icon: "🌐",
    title: "Website Widget",
    subtitle: "Embed on your site in minutes",
    description:
      "We give you a single <script> tag. Drop it into your website and a floating voice button appears — visitors can call your agent directly from any page with no phone required.",
    details: [
      "One-line embed code",
      "Customisable button colour & position",
      "Works on any website or CMS",
      "HTTPS required",
    ],
  },
  {
    id: "phone-number",
    icon: "📞",
    title: "Phone Number",
    subtitle: "Dedicated UK number routed to your agent",
    description:
      "We provision a dedicated UK phone number for your business. Anyone who dials it is connected straight to your Universal Agent — no app, no website change needed.",
    details: [
      "UK geographic or 0800 number",
      "Instant call routing to your agent",
      "Call logs and transcripts in dashboard",
      "Works alongside your existing lines",
    ],
  },
  {
    id: "api-webhooks",
    icon: "⚙️",
    title: "API & Webhooks",
    subtitle: "Plug into your existing systems",
    description:
      "Trigger agent sessions via REST API and receive structured call events as webhooks into your CRM, ticketing system, or custom backend in real time.",
    details: [
      "REST API with full session control",
      "Webhook payloads per call outcome",
      "OpenAPI spec provided",
      "HMAC signature verification on all payloads",
    ],
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "£49/mo",
    subtitle: "Best for single-site teams starting out",
    tone: "#0369a1",
    features: [
      "1 business line",
      "Up to 300 call minutes/month",
      "Basic workflow routing",
      "Dashboard with core logs",
      "Email support (48h SLA)",
      "Out-of-hours SMS bundle: 100 messages",
    ],
    limits: ["No custom voice profile", "No API export", "No advanced analytics"],
    popular: false,
  },
  {
    name: "Growth",
    price: "£149/mo",
    subtitle: "Best for growing operations with multiple departments",
    tone: "#1d4ed8",
    features: [
      "Up to 5 business lines",
      "Up to 2,500 call minutes/month",
      "Department-specific workflow playbooks",
      "Priority dashboard analytics",
      "Ticket workflow updates in-app",
      "Out-of-hours SMS bundle: 1,000 messages",
      "Priority support (8h SLA)",
    ],
    limits: ["No white-label domain", "Limited custom integrations"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "£499/mo",
    subtitle: "Best for high-volume, multi-tenant business operations",
    tone: "#7e22ce",
    features: [
      "Unlimited business lines",
      "Unlimited call minutes (fair use)",
      "Advanced workflow orchestration",
      "Live operational analytics + exports",
      "Custom integrations + webhooks",
      "Dedicated onboarding and success manager",
      "Out-of-hours SMS bundle: 10,000 messages",
      "24/7 premium support (1h SLA)",
    ],
    limits: [],
    popular: false,
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  function handleChoosePlan(planName: string) {
    if (!selectedIntegration) {
      const el = document.getElementById("integration-picker");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.outline = "2px solid #22d3ee";
        setTimeout(() => { el.style.outline = ""; }, 1400);
      }
      return;
    }
    router.push(`/signup?plan=${encodeURIComponent(planName)}&integration=${encodeURIComponent(selectedIntegration)}`);
  }

  const selectedIntegrationData = INTEGRATIONS.find((i) => i.id === selectedIntegration);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 16px 60px",
        background:
          "radial-gradient(920px 420px at 16% 0%, rgba(56,189,248,0.2), transparent 64%), radial-gradient(900px 460px at 88% 18%, rgba(59,130,246,0.2), transparent 68%), linear-gradient(145deg, #0b1020 0%, #111827 50%, #172554 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ color: "#67e8f9", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "10px" }}>
            Subscription Packages
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "42px", color: "#e0f2fe", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Choose your Universal Agent package
          </h1>
          <p style={{ color: "#cbd5e1", maxWidth: "700px", margin: "0 auto", lineHeight: 1.55 }}>
            Complete two steps: pick how your customers will reach your agent, then choose the plan that fits your call volume.
          </p>
        </div>

        {/* Step 1 — Integration method */}
        <div id="integration-picker" style={{ marginBottom: "48px", scrollMarginTop: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #06b6d4, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "13px",
                color: "white",
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "18px" }}>
                How will your customers reach your agent?
              </div>
              <div style={{ color: "#64748b", fontSize: "13px" }}>
                Choose the integration method that fits your deployment.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {INTEGRATIONS.map((integration) => {
              const active = selectedIntegration === integration.id;
              return (
                <button
                  key={integration.id}
                  type="button"
                  onClick={() => setSelectedIntegration(integration.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: "18px",
                    border: active ? "2px solid #22d3ee" : "1px solid rgba(148,163,184,0.22)",
                    background: active ? "rgba(6,182,212,0.1)" : "rgba(15,23,42,0.55)",
                    padding: "22px",
                    cursor: "pointer",
                    boxShadow: active ? "0 0 32px rgba(34,211,238,0.2)" : "none",
                    transition: "border 0.18s, box-shadow 0.18s, background 0.18s",
                    width: "100%",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>{integration.icon}</div>
                  <div
                    style={{
                      color: active ? "#67e8f9" : "#e2e8f0",
                      fontWeight: 800,
                      fontSize: "17px",
                      marginBottom: "4px",
                    }}
                  >
                    {integration.title}
                  </div>
                  <div
                    style={{
                      color: active ? "#22d3ee" : "#64748b",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {integration.subtitle}
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.65, margin: "0 0 14px" }}>
                    {integration.description}
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "16px",
                      color: active ? "#a5f3fc" : "#64748b",
                      fontSize: "12px",
                      lineHeight: 1.9,
                    }}
                  >
                    {integration.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  {active ? (
                    <div
                      style={{
                        marginTop: "14px",
                        color: "#22d3ee",
                        fontWeight: 800,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      ✓ Selected — now pick your plan below
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {!selectedIntegration && (
            <div
              style={{
                marginTop: "14px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              ↑ Select an integration method above before choosing a plan.
            </div>
          )}
        </div>

        {/* Step 2 — Pricing plans */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: selectedIntegration
                  ? "linear-gradient(135deg, #06b6d4, #2563eb)"
                  : "rgba(100,116,139,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "13px",
                color: "white",
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              <div style={{ color: selectedIntegration ? "#e0f2fe" : "#64748b", fontWeight: 800, fontSize: "18px" }}>
                Pick the plan that matches your call volume
              </div>
              {selectedIntegrationData ? (
                <div style={{ color: "#22d3ee", fontSize: "13px" }}>
                  Deploying via {selectedIntegrationData.title}
                </div>
              ) : (
                <div style={{ color: "#64748b", fontSize: "13px" }}>
                  Complete step 1 first.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  position: "relative",
                  borderRadius: "18px",
                  border: `1px solid ${plan.tone}66`,
                  background: "linear-gradient(180deg, rgba(15,23,42,0.74), rgba(15,23,42,0.45))",
                  boxShadow: plan.popular
                    ? `0 20px 38px ${plan.tone}55`
                    : "0 18px 32px rgba(2,6,23,0.45)",
                  padding: "20px",
                }}
              >
                {plan.popular ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "14px",
                      background: "#22d3ee",
                      color: "#082f49",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontWeight: 800,
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </div>
                ) : null}

                <h2 style={{ marginTop: 0, marginBottom: "6px", color: "#e2e8f0", fontSize: "26px" }}>
                  {plan.name}
                </h2>
                <div style={{ color: "#67e8f9", fontSize: "30px", fontWeight: 800, marginBottom: "8px" }}>
                  {plan.price}
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "16px" }}>
                  {plan.subtitle}
                </div>

                <div
                  style={{
                    color: "#a5f3fc",
                    fontWeight: 700,
                    marginBottom: "8px",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Included features
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#e2e8f0", lineHeight: 1.75, fontSize: "13px" }}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                {plan.limits.length > 0 ? (
                  <>
                    <div
                      style={{
                        color: "#fda4af",
                        fontWeight: 700,
                        marginTop: "12px",
                        marginBottom: "6px",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Limitations
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#fecdd3", lineHeight: 1.65, fontSize: "12px" }}>
                      {plan.limits.map((limit) => (
                        <li key={limit}>{limit}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleChoosePlan(plan.name)}
                  style={{
                    marginTop: "18px",
                    width: "100%",
                    border: "none",
                    borderRadius: "12px",
                    background: selectedIntegration
                      ? `linear-gradient(135deg, ${plan.tone}, #22d3ee)`
                      : "rgba(100,116,139,0.35)",
                    color: selectedIntegration ? "white" : "#64748b",
                    fontWeight: 800,
                    padding: "12px 12px",
                    cursor: selectedIntegration ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    transition: "background 0.2s",
                  }}
                >
                  {selectedIntegration
                    ? `Choose ${plan.name} →`
                    : "Select integration method first"}
                </button>

                {selectedIntegrationData ? (
                  <div style={{ marginTop: "8px", color: "#64748b", fontSize: "11px", textAlign: "center" }}>
                    via {selectedIntegrationData.title}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* SMS note */}
        <div
          style={{
            marginTop: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.28)",
            background: "rgba(15,23,42,0.42)",
            padding: "14px 16px",
          }}
        >
          <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: "4px" }}>SMS pricing note</div>
          <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5 }}>
            If your monthly SMS bundle is exceeded, overage is billed at £0.06 per outbound SMS. API & Webhooks
            integrations include webhook delivery retries for up to 24 hours at no extra cost.
          </div>
        </div>
      </div>
    </div>
  );
}
