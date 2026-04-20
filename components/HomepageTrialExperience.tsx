"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";

type BusinessOption = {
  id: string;
  name: string;
  summary: string;
};


export function HomepageTestExperience() {
  const { callState, startCall, endCall } = useVoiceCall();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [callPhase, setCallPhase] = useState<"idle" | "active" | "ended">("idle");

  useEffect(() => {
    fetch("/api/business-models")
      .then((response) => response.json())
      .then((data) => {
        const list: BusinessOption[] = (data.businessModels || []).map((model: BusinessOption) => ({
          id: model.id,
          name: model.name,
          summary: model.summary,
        }));
        if (list.length === 0) {
          // Fallback business types if API is not ready
          setBusinesses([
            { id: "housing-association", name: "🏠 Housing", summary: "Test the agent handling repair requests, tenancy issues, and customer complaints for residential properties." },
            { id: "utilities", name: "⚡ Energy Provider", summary: "Test the agent handling outages, billing, and account changes for UK energy customers." },
            { id: "hotel", name: "🏨 Hotel", summary: "Test the agent managing reservations, guest services, and in-stay requests for hospitality." },
            { id: "restaurant", name: "🍽️ Restaurant", summary: "Test the agent handling bookings, food orders, and customer inquiries for food service." },
            { id: "borough-council", name: "🏛️ Borough Council", summary: "Test the agent handling council tax, housing and benefits, waste, licensing, and complaints." },
          ]);
          setSelectedBusinessId("housing-association");
        } else {
          setBusinesses(list);
          if (list.length > 0) {
            setSelectedBusinessId((prev) => prev || list[0].id);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load demo business types:", error);
        // Fallback to default business types
        setBusinesses([
          { id: "housing-association", name: "🏠 Housing", summary: "Test the agent handling repair requests, tenancy issues, and customer complaints for residential properties." },
          { id: "utilities", name: "⚡ Energy Provider", summary: "Test the agent handling outages, billing, and account changes for UK energy customers." },
          { id: "hotel", name: "🏨 Hotel", summary: "Test the agent managing reservations, guest services, and in-stay requests for hospitality." },
          { id: "restaurant", name: "🍽️ Restaurant", summary: "Test the agent handling bookings, food orders, and customer inquiries for food service." },
          { id: "borough-council", name: "🏛️ Borough Council", summary: "Test the agent handling council tax, housing and benefits, waste, licensing, and complaints." },
        ]);
        setSelectedBusinessId("housing-association");
      });
  }, []);

  useEffect(() => {
    if (!callState.isActive && callPhase === "active") {
      setCallPhase("idle");
    }
  }, [callPhase, callState.isActive]);

  const handleStartCall = useCallback(async () => {
    if (!selectedBusinessId) {
      return;
    }

    setCallPhase("active");
    await startCall({
      tenantId: selectedBusinessId,
      isDemoCall: true,
    });
  }, [selectedBusinessId, startCall]);

  const handleEndCall = useCallback(() => {
    endCall();
    setCallPhase("idle");
  }, [endCall]);

  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId);
  const canCall = Boolean(selectedBusinessId);

  return (
    <section
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 520px at 12% 0%, rgba(245,158,11,0.16), transparent 64%), radial-gradient(900px 500px at 88% 14%, rgba(14,165,233,0.18), transparent 62%), linear-gradient(145deg, #07111f 0%, #0d1829 46%, #111827 100%)",
        padding: "32px 18px 48px",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        color: "#e5eefc",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(5,10,18,0.62)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 28,
              padding: "30px 28px",
              boxShadow: "0 30px 80px rgba(2,6,23,0.45)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div style={{ color: "#fbbf24", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", marginBottom: 12 }}>
              LIVE TEST
            </div>
            <h1 style={{ fontSize: 54, lineHeight: 1.02, margin: "0 0 14px", letterSpacing: "-0.04em", maxWidth: 720 }}>
              Test the live AI call agent before you subscribe.
            </h1>
            <p style={{ color: "#bfd0eb", fontSize: 18, lineHeight: 1.7, maxWidth: 720, margin: "0 0 24px" }}>
              Sign up and hear how the agent handles real call flows across different business types before you buy the full version.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              {[
                { title: "Sign up to test", text: "Create a free account and try the agent instantly." },
                { title: "Switch business types", text: "Test across housing, hotel, restaurant, utilities and more." },
                { title: "Subscribe for full access", text: "Unlimited calls, setup, and live deployment after upgrade." },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(148,163,184,0.16)",
                    padding: "16px 16px 14px",
                  }}
                >
                  <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ color: "#9fb3d1", fontSize: 13, lineHeight: 1.6 }}>{item.text}</div>
                </div>
              ))}
            </div>



            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {businesses.slice(0, 6).map((business) => {
                const active = business.id === selectedBusinessId;
                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => setSelectedBusinessId(business.id)}
                    style={{
                      background: active ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid rgba(56,189,248,0.54)" : "1px solid rgba(148,163,184,0.16)",
                      color: active ? "#f8fbff" : "#cfe0f6",
                      borderRadius: 16,
                      padding: "14px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {business.name}
                  </button>
                );
              })}
            </div>

            {selectedBusiness ? (
              <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
                {selectedBusiness.summary}
              </div>
            ) : null}

            <div style={{ marginBottom: 14 }}>
              <button
                type="button"
                onClick={callPhase === "active" ? handleEndCall : handleStartCall}
                disabled={(!callState.isActive && !canCall) || callState.connectionStatus === "connecting"}
                style={{
                  background: callPhase === "active"
                    ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                    : "linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  padding: "16px 24px",
                  fontSize: 16,
                  fontWeight: 900,
                  width: "100%",
                  cursor: (!callState.isActive && !canCall) || callState.connectionStatus === "connecting" ? "not-allowed" : "pointer",
                  opacity: (!callState.isActive && !canCall) || callState.connectionStatus === "connecting" ? 0.6 : 1,
                }}
              >
                {callState.connectionStatus === "connecting"
                  ? "Connecting..."
                  : callPhase === "active"
                  ? "End Test Call"
                  : "Start Test Call"}
              </button>
            </div>

            <Link
              href="/subscription"
              style={{
                borderRadius: 16,
                padding: "14px 18px",
                fontSize: 14,
                fontWeight: 700,
                color: "#e0f2fe",
                border: "1px solid rgba(56,189,248,0.5)",
                background: "rgba(14,165,233,0.12)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              View Subscription Plans
            </Link>

            <div style={{ color: "#9fb3d1", fontSize: 13, lineHeight: 1.7 }}>
              The full subscription unlocks unlimited live calls, deployment, and business setup.
            </div>
          </div>

          <div
            style={{
              background: "rgba(4,10,18,0.74)",
              border: "1px solid rgba(148,163,184,0.16)",
              borderRadius: 28,
              padding: "26px 24px",
              boxShadow: "0 24px 60px rgba(2,6,23,0.42)",
            }}
          >
            <div style={{ color: "#7dd3fc", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 12 }}>
              LIVE CALL PREVIEW
            </div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 28, marginBottom: 8 }}>
              {callPhase === "active" ? `${selectedBusiness?.name || "Business"} agent live` : "Ready to test"}
            </div>
            <div style={{ color: "#9fb3d1", fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
              {callPhase === "active"
                ? "You are inside the live test. End the call at any time and switch to another business."
                : "Pick a business, start the call, and hear the live voice agent respond in real time without creating an account first."}
            </div>

            <div
              style={{
                borderRadius: 22,
                background: "linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(9,14,25,0.98) 100%)",
                border: "1px solid rgba(56,189,248,0.16)",
                padding: "28px 22px",
                minHeight: 360,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    margin: "0 auto 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 42,
                    background: callState.isAgentSpeaking
                      ? "linear-gradient(135deg, #f59e0b, #fb7185)"
                      : "linear-gradient(135deg, rgba(245,158,11,0.32), rgba(56,189,248,0.22))",
                    boxShadow: callState.isAgentSpeaking
                      ? "0 0 0 10px rgba(251,146,60,0.12)"
                      : "0 0 0 1px rgba(148,163,184,0.1)",
                  }}
                >
                  {callPhase === "active" ? "🎧" : "🎙️"}
                </div>

                <div style={{ textAlign: "center", color: "white", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                  {callPhase === "active"
                    ? callState.isAgentSpeaking
                      ? "Agent speaking"
                      : "Listening live"
                    : "Start your test call"}
                </div>
                <div style={{ textAlign: "center", color: "#9fb3d1", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                  {callPhase === "active"
                    ? `${selectedBusiness?.name || "Business"} agent is currently connected.`
                    : "No login required. The homepage itself is the test experience."}
                </div>

                {callPhase !== "active" ? (
                  <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.04)", padding: "16px 16px", border: "1px solid rgba(148,163,184,0.12)" }}>
                    <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 13, marginBottom: 10 }}>During your test</div>
                    <div style={{ color: "#9fb3d1", fontSize: 13, lineHeight: 1.8 }}>
                      1. Start a live call with any business type.
                      <br />
                      2. Hang up and test another business when you want.
                      <br />
                      3. Subscribe when you are satisfied and want unlimited use.
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                {callState.transcript.length > 0 ? (
                  <div
                    style={{
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(148,163,184,0.1)",
                      padding: "14px 14px",
                      maxHeight: 120,
                      overflow: "hidden",
                    }}
                  >
                    {callState.transcript.slice(-3).map((entry) => (
                      <div key={entry.id} style={{ marginBottom: 6, color: "#d7e5f7", fontSize: 13, lineHeight: 1.6 }}>
                        <strong style={{ color: entry.speaker === "agent" ? "#fcd34d" : "#7dd3fc" }}>
                          {entry.speaker === "agent" ? "Agent" : "You"}:
                        </strong>{" "}
                        {entry.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
                    Test transcript preview appears here once the call starts.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16, color: "#94a3b8", fontSize: 12, lineHeight: 1.7 }}>
              Test access is anonymous. Full deployment, account setup, and unlimited usage start after subscription.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}