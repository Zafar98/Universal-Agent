"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionBusiness = {
  businessName: string;
  tenantId: string;
  selectedPlan?: string;
  selectedIntegration?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string | null;
  activationCompletedAt?: string | null;
};

type SetupState = {
  selectedPlan: string;
  selectedIntegration: string;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  integrationReady: boolean;
  activationCompletedAt: string | null;
  integrationConfig: {
    widgetEmbedCode?: string;
    inboundPhoneNumber?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  };
};

const INTEGRATION_LABELS: Record<string, string> = {
  "website-widget": "Website Widget",
  "phone-number": "Phone Number",
  "api-webhooks": "API & Webhooks",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export default function DashboardSetupPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<SessionBusiness | null>(null);
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setupComplete = useMemo(() => {
    if (!setup) {
      return false;
    }
    const billingReady = setup.subscriptionStatus === "trialing" || setup.subscriptionStatus === "active";
    return billingReady && setup.integrationReady && Boolean(setup.activationCompletedAt);
  }, [setup]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [sessionRes, setupRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/subscription/setup"),
        ]);

        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        const sessionData = await sessionRes.json().catch(() => ({}));
        const setupData = await setupRes.json().catch(() => ({}));

        if (!active) {
          return;
        }

        setBusiness(sessionData.business || null);
        setSetup(setupData.setup || null);
        setWebhookUrl(setupData.setup?.integrationConfig?.webhookUrl || "");
      } catch (loadError) {
        console.error("Failed to load setup state:", loadError);
        if (active) {
          setError("Unable to load setup state right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  async function refreshState() {
    const response = await fetch("/api/subscription/setup");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Unable to refresh setup state.");
    }
    setSetup(data.setup);
  }

  async function saveSetup(payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/subscription/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Failed to save setup changes.");
        return;
      }

      await refreshState();
    } catch (saveError) {
      console.error("Setup save failed:", saveError);
      setError("Failed to save setup changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b1020", color: "#cbd5e1", display: "grid", placeItems: "center" }}>
        Loading setup...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(900px 420px at 12% 0%, rgba(56,189,248,0.18), transparent 65%), linear-gradient(145deg, #050816 0%, #0b1020 55%, #111827 100%)",
        color: "#e2e8f0",
        padding: "26px 16px 56px",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ color: "#67e8f9", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800 }}>
            Go Live Setup
          </div>
          <h1 style={{ margin: "10px 0 8px", fontSize: "36px", color: "#e0f2fe", letterSpacing: "-0.02em" }}>
            Activate your Universal Agent
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>
            {business?.businessName || "Your workspace"} needs billing activation and integration setup before live call routing is enabled.
          </p>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "18px",
            padding: "18px",
            background: "rgba(15,23,42,0.62)",
            marginBottom: "14px",
          }}
        >
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#67e8f9", fontWeight: 700, marginBottom: "8px" }}>
            Your selection
          </div>
          <div style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700 }}>
            {PLAN_LABELS[String(setup?.selectedPlan || business?.selectedPlan || "starter")] || "Starter"} plan · {INTEGRATION_LABELS[String(setup?.selectedIntegration || business?.selectedIntegration || "website-widget")] || "Website Widget"}
          </div>
          <div style={{ color: "#64748b", marginTop: "6px", fontSize: "13px" }}>
            Status: {setup?.subscriptionStatus || business?.subscriptionStatus || "pending_payment"}
            {setup?.subscriptionEndsAt ? ` · Ends ${new Date(setup.subscriptionEndsAt).toLocaleString()}` : ""}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "18px",
            padding: "18px",
            background: "rgba(15,23,42,0.62)",
            marginBottom: "14px",
          }}
        >
          <div style={{ color: "#e0f2fe", fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Step 1 — Activate billing</div>
          <p style={{ color: "#94a3b8", marginTop: 0, lineHeight: 1.5, fontSize: "14px" }}>
            Start a 7-day trial now. Live routing remains blocked until billing is active.
          </p>
          <button
            type="button"
            onClick={() =>
              saveSetup({
                startTrial: true,
                selectedPlan: setup?.selectedPlan || business?.selectedPlan || "starter",
                selectedIntegration: setup?.selectedIntegration || business?.selectedIntegration || "website-widget",
              })
            }
            disabled={saving}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              fontWeight: 800,
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #06b6d4, #2563eb)",
            }}
          >
            {saving ? "Saving..." : "Start 7-day trial"}
          </button>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "18px",
            padding: "18px",
            background: "rgba(15,23,42,0.62)",
            marginBottom: "14px",
          }}
        >
          <div style={{ color: "#e0f2fe", fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Step 2 — Configure integration</div>
          {String(setup?.selectedIntegration || business?.selectedIntegration) === "website-widget" ? (
            <>
              <p style={{ color: "#94a3b8", marginTop: 0, lineHeight: 1.5, fontSize: "14px" }}>
                Generate your website embed script and install it on your site.
              </p>
              <button
                type="button"
                onClick={() =>
                  saveSetup({
                    selectedPlan: setup?.selectedPlan || business?.selectedPlan || "starter",
                    selectedIntegration: "website-widget",
                  })
                }
                disabled={saving}
                style={{
                  border: "1px solid rgba(56,189,248,0.4)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  cursor: saving ? "not-allowed" : "pointer",
                  background: "rgba(2,132,199,0.2)",
                }}
              >
                Generate embed code
              </button>
              {setup?.integrationConfig?.widgetEmbedCode ? (
                <pre
                  style={{
                    marginTop: "12px",
                    background: "rgba(2,6,23,0.7)",
                    borderRadius: "12px",
                    border: "1px solid rgba(148,163,184,0.22)",
                    color: "#7dd3fc",
                    padding: "12px",
                    overflowX: "auto",
                    fontSize: "12px",
                  }}
                >
{setup.integrationConfig.widgetEmbedCode}
                </pre>
              ) : null}
            </>
          ) : null}

          {String(setup?.selectedIntegration || business?.selectedIntegration) === "phone-number" ? (
            <>
              <p style={{ color: "#94a3b8", marginTop: 0, lineHeight: 1.5, fontSize: "14px" }}>
                Assign your inbound number. Calls to this number will route to your agent.
              </p>
              <button
                type="button"
                onClick={() =>
                  saveSetup({
                    selectedPlan: setup?.selectedPlan || business?.selectedPlan || "starter",
                    selectedIntegration: "phone-number",
                  })
                }
                disabled={saving}
                style={{
                  border: "1px solid rgba(56,189,248,0.4)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  cursor: saving ? "not-allowed" : "pointer",
                  background: "rgba(2,132,199,0.2)",
                }}
              >
                Assign phone number
              </button>
              {setup?.integrationConfig?.inboundPhoneNumber ? (
                <div style={{ marginTop: "12px", color: "#7dd3fc", fontWeight: 700 }}>
                  Assigned number: {setup.integrationConfig.inboundPhoneNumber}
                </div>
              ) : null}
            </>
          ) : null}

          {String(setup?.selectedIntegration || business?.selectedIntegration) === "api-webhooks" ? (
            <>
              <p style={{ color: "#94a3b8", marginTop: 0, lineHeight: 1.5, fontSize: "14px" }}>
                Add your webhook endpoint and we will generate your signing secret.
              </p>
              <input
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://yourapp.com/webhooks/universal-agent"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.7)",
                  color: "#e2e8f0",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  saveSetup({
                    selectedPlan: setup?.selectedPlan || business?.selectedPlan || "starter",
                    selectedIntegration: "api-webhooks",
                    webhookUrl,
                  })
                }
                disabled={saving}
                style={{
                  border: "1px solid rgba(56,189,248,0.4)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  cursor: saving ? "not-allowed" : "pointer",
                  background: "rgba(2,132,199,0.2)",
                }}
              >
                Save webhook settings
              </button>
              {setup?.integrationConfig?.webhookSecret ? (
                <div style={{ marginTop: "12px", color: "#7dd3fc", fontWeight: 700, fontSize: "13px" }}>
                  Signing secret: {setup.integrationConfig.webhookSecret}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {error ? (
          <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fda4af", padding: "10px 12px", marginBottom: "14px" }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={!setupComplete}
            onClick={() => router.push("/dashboard")}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "11px 15px",
              fontWeight: 800,
              color: "white",
              cursor: setupComplete ? "pointer" : "not-allowed",
              background: setupComplete ? "linear-gradient(135deg, #06b6d4, #2563eb)" : "rgba(100,116,139,0.4)",
            }}
          >
            {setupComplete ? "Continue to dashboard" : "Complete setup to continue"}
          </button>
          <Link href="/subscription" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>
            Change plan or integration
          </Link>
        </div>
      </div>
    </div>
  );
}
