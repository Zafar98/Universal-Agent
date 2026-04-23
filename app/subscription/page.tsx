"use client";

import Link from "next/link";
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
      "We provision a dedicated UK phone number for your business. Anyone who dials it is connected straight to your Asistoria agent - no app, no website change needed.",
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
    name: "digital-employee",
    label: "Digital Employee Setup",
    price: "£1500 setup fee (starting price)",
    subtitle: "We design, build, and install your custom AI-powered business agent. Payment is only taken after you confirm your requirements and features.",
    tone: "#38bdf8",
    features: [
      "Discovery call to understand your business workflows and needs",
      "Custom agent design and proposal",
      "No payment until you approve the plan and features",
      "Setup fee covers initial build, configuration, and deployment",
      "Ongoing support and maintenance available (quoted separately)",
      "Add-ons and advanced features quoted after requirements are agreed",
      "Transparent, collaborative process—no hidden fees",
    ],
    limits: [
      "£1500 is the starting setup fee; additional features or integrations are quoted after requirements are agreed",
      "No payment is taken until you confirm your plan and features",
      "Ongoing support, maintenance, and add-ons are quoted separately",
    ],
    popular: true,
    custom: true,
  },
];

export default function ProductPage() {
  const router = useRouter();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  function handleChoosePlan(planName: string) {
    if (!selectedIntegration) {
      setShowHint(true);
      const el = document.getElementById("integration-picker");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setShowHint(false);
    router.push(`/signup?plan=${encodeURIComponent(planName)}&integration=${encodeURIComponent(selectedIntegration)}`);
  }

  const selectedIntegrationData = INTEGRATIONS.find((i) => i.id === selectedIntegration) ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 16px 60px",
        background:
          "radial-gradient(920px 420px at 16% 0%, rgba(34,211,238,0.2), transparent 64%), radial-gradient(900px 460px at 88% 18%, rgba(52,211,153,0.17), transparent 68%), linear-gradient(145deg, #020617 0%, #030712 52%, #0b1220 100%)",
        color: "#e2e8f0",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ color: "#67e8f9", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "10px" }}>
            Agent Platform
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "42px", color: "#e0f2fe", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Build Custom AI Agents for Any Workflow
          </h1>
          <p style={{ color: "#cbd5e1", maxWidth: "700px", margin: "0 auto", lineHeight: 1.55 }}>
            Choose from our agent solutions or request a bespoke build. Automate support, onboarding, booking, compliance, triage, sales, and more—across voice, email, web, and API channels. All prices are "starting from" and custom work is always quoted in advance.
          </p>
        </div>


        {/* Integration options info section (moved from main flow) */}
        <div style={{
          margin: "0 auto 48px auto",
          maxWidth: 900,
          background: "rgba(15,23,42,0.62)",
          border: "1px solid rgba(56,189,248,0.18)",
          borderRadius: 18,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#e0f2fe", marginBottom: 10 }}>How integration works</h2>
          <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 18 }}>
            You can connect your agent to your business in three ways:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {INTEGRATIONS.map((integration) => (
              <div key={integration.id} style={{
                borderRadius: 14,
                border: "1px solid rgba(56,189,248,0.18)",
                background: "rgba(2,6,23,0.38)",
                padding: 20,
                marginBottom: 0,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{integration.icon}</div>
                <div style={{ color: "#e0f2fe", fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{integration.title}</div>
                <div style={{ color: "#22d3ee", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{integration.subtitle}</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>{integration.description}</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: "#a5f3fc", fontSize: 12, lineHeight: 1.8 }}>
                  {integration.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href="/how-to" style={{ color: "#38bdf8", fontWeight: 700, fontSize: 15, textDecoration: "underline" }}>Read the full integration guide</Link>
          </div>
        </div>

        {/* Product list */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#7dd3fc", fontSize: "28px", fontWeight: 800, marginBottom: "18px", textAlign: "center" }}>Digital Employee Setup & Pricing</h2>
          <p style={{ color: "#fbbf24", textAlign: "center", marginBottom: 24, fontWeight: 700, fontSize: 16 }}>
            One simple setup fee: £1500 (starting price). No payment is taken until you confirm your requirements and features. All add-ons and advanced features are quoted after we understand your needs—no hidden fees, no surprises.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
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
                  padding: "24px 20px 20px 20px",
                  minHeight: 440,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
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

                <h2 style={{ marginTop: 0, marginBottom: "6px", color: "#e2e8f0", fontSize: "26px" }}>{plan.label}</h2>
                <div style={{ color: "#67e8f9", fontSize: "30px", fontWeight: 800, marginBottom: "8px" }}>
                  {plan.price} <span style={{ fontSize: 14, color: "#fbbf24", fontWeight: 700 }}>(from)</span>
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
                  What's Included
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
                      Add-ons & Custom Work
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#fecdd3", lineHeight: 1.65, fontSize: "12px" }}>
                      {plan.limits.map((limit) => (
                        <li key={limit}>{limit}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {plan.custom ? (
                  <Link
                    href="/quote"
                    style={{
                      marginTop: "18px",
                      width: "100%",
                      display: "inline-block",
                      border: "none",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${plan.tone}, #22d3ee)`,
                      color: "white",
                      fontWeight: 800,
                      padding: "12px 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "background 0.2s",
                    }}
                  >
                    Request Custom Quote
                  </Link>
                ) : (
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
                      ? "Continue to signup ->"
                      : "Select integration method first"}
                  </button>
                )}

                {selectedIntegrationData ? (
                  <div style={{ marginTop: "8px", color: "#64748b", fontSize: "11px", textAlign: "center" }}>
                    via {selectedIntegrationData.title}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Custom work note */}
        <div
          style={{
            marginTop: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.28)",
            background: "rgba(15,23,42,0.42)",
            padding: "14px 16px",
          }}
        >
          <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: "4px" }}>How pricing & quotes work</div>
          <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5 }}>
            <strong>1. Free Consultation:</strong> Tell us what you need.<br/>
            <strong>2. Transparent Quote:</strong> We’ll scope your requirements and provide a clear, fixed quote for your build, agent, or integration.<br/>
            <strong>3. No Surprises:</strong> Ongoing work and add-ons are always quoted in advance. No hidden fees.<br/>
            <strong>4. Start Small, Scale Up:</strong> Begin with a starter package and add features as you grow.
          </div>
        </div>
      </div>
    </div>
  );
}
