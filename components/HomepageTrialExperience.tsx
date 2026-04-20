"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";

const TRIAL_SECONDS = 60;

type BusinessOption = {
  id: string;
  name: string;
  summary: string;
};

type TrialStatus = {
  blocked: boolean;
  reason?: string;
  hasStarted: boolean;
  isActive: boolean;
  secondsLeft: number;
  expiresAt: string | null;
};

function computeFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(screen.width),
      String(screen.height),
      String(new Date().getTimezoneOffset()),
      navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : "",
    ].join("|");
    return btoa(parts).slice(0, 64);
  } catch {
    return "unknown";
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function getTrialProgressPercent(secondsLeft: number) {
  return Math.max(0, Math.min(100, (secondsLeft / TRIAL_SECONDS) * 100));
}

export function HomepageTrialExperience() {
  const { callState, startCall, endCall } = useVoiceCall();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(TRIAL_SECONDS);
  const [trialReason, setTrialReason] = useState("");
  const [trialHasStarted, setTrialHasStarted] = useState(false);
  const [trialBlocked, setTrialBlocked] = useState(false);
  const [callPhase, setCallPhase] = useState<"idle" | "active" | "ended">("idle");
  const [isRefreshingTrial, setIsRefreshingTrial] = useState(true);
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trialCompletionSentRef = useRef(false);

  useEffect(() => {
    setFingerprint(computeFingerprint());
  }, []);

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
            { id: "hotel", name: "🏨 Hotel", summary: "Test the agent managing reservations, guest services, and in-stay requests for hospitality." },
            { id: "restaurant", name: "🍽️ Restaurant", summary: "Test the agent handling bookings, food orders, and customer inquiries for food service." },
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
          { id: "hotel", name: "🏨 Hotel", summary: "Test the agent managing reservations, guest services, and in-stay requests for hospitality." },
          { id: "restaurant", name: "🍽️ Restaurant", summary: "Test the agent handling bookings, food orders, and customer inquiries for food service." },
        ]);
        setSelectedBusinessId("housing-association");
      });
  }, []);

  const refreshTrialStatus = useCallback(async () => {
    if (!fingerprint) return;

    setIsRefreshingTrial(true);
    try {
      const response = await fetch(`/api/demo/trial-status?fingerprint=${encodeURIComponent(fingerprint)}`);
      const data = (await response.json().catch(() => ({}))) as Partial<TrialStatus>;
      const blocked = Boolean(data.blocked);
      const hasStarted = Boolean(data.hasStarted);
      const secondsLeft = Math.max(0, Number(data.secondsLeft ?? TRIAL_SECONDS));

      setTrialBlocked(blocked);
      setTrialHasStarted(hasStarted);
      setTrialReason(String(data.reason || ""));
      setTrialSecondsLeft(blocked ? 0 : secondsLeft || (hasStarted ? 0 : TRIAL_SECONDS));
      trialCompletionSentRef.current = blocked;
    } catch (error) {
      console.error("Failed to refresh demo trial status:", error);
    } finally {
      setIsRefreshingTrial(false);
    }
  }, [fingerprint]);

  useEffect(() => {
    void refreshTrialStatus();
  }, [refreshTrialStatus]);

  const stopTrialTimer = useCallback(() => {
    if (trialTimerRef.current) {
      clearInterval(trialTimerRef.current);
      trialTimerRef.current = null;
    }
  }, []);

  const completeTrialWindow = useCallback(async () => {
    if (!fingerprint || trialCompletionSentRef.current) {
      return;
    }

    trialCompletionSentRef.current = true;
    setTrialBlocked(true);
    setTrialHasStarted(true);
    setTrialSecondsLeft(0);
    setTrialReason("Your shared 60-second trial has ended. Subscribe to unlock unlimited live calls.");

    await fetch("/api/demo/trial-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    }).catch((error) => {
      console.error("Failed to finalize trial window:", error);
    });
  }, [fingerprint]);

  useEffect(() => {
    if (!trialHasStarted || trialBlocked || trialSecondsLeft <= 0) {
      stopTrialTimer();
      return;
    }

    trialTimerRef.current = setInterval(() => {
      setTrialSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTrialTimer();
          if (callState.isActive) {
            endCall();
          }
          setCallPhase("ended");
          void completeTrialWindow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return stopTrialTimer;
  }, [callState.isActive, completeTrialWindow, endCall, stopTrialTimer, trialBlocked, trialHasStarted, trialSecondsLeft]);

  useEffect(() => {
    if (!callState.isActive && callPhase === "active") {
      setCallPhase(trialBlocked || trialSecondsLeft <= 0 ? "ended" : "idle");
    }
  }, [callPhase, callState.isActive, trialBlocked, trialSecondsLeft]);

  const handleStartCall = useCallback(async () => {
    if (trialBlocked || !selectedBusinessId) {
      setCallPhase("ended");
      return;
    }

    setCallPhase("active");
    await startCall({
      tenantId: selectedBusinessId,
      isDemoCall: true,
      fingerprint,
    });
    void refreshTrialStatus();
  }, [fingerprint, refreshTrialStatus, selectedBusinessId, startCall, trialBlocked]);

  const handleEndCall = useCallback(() => {
    endCall();
    setCallPhase(trialBlocked || trialSecondsLeft <= 0 ? "ended" : "idle");
  }, [endCall, trialBlocked, trialSecondsLeft]);

  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId);
  const urgentTimer = trialSecondsLeft <= 15;
  const trialProgressPercent = getTrialProgressPercent(trialSecondsLeft);
  const canCall = !trialBlocked && trialSecondsLeft > 0 && Boolean(selectedBusinessId);

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
              LIVE TRIAL
            </div>
            <h1 style={{ fontSize: 54, lineHeight: 1.02, margin: "0 0 14px", letterSpacing: "-0.04em", maxWidth: 720 }}>
              Test the live AI call agent before you subscribe.
            </h1>
            <p style={{ color: "#bfd0eb", fontSize: 18, lineHeight: 1.7, maxWidth: 720, margin: "0 0 24px" }}>
              No sign-up. No login. Start a shared 60-second trial on this page, switch between business types, and hear how the agent handles real call flows before you buy the full version.
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
                { title: "No sign-up required", text: "Anyone can test immediately from the homepage." },
                { title: "One shared minute", text: "Switch businesses inside the same countdown." },
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
                width: "100%",
                background: urgentTimer ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.1)",
                border: urgentTimer ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(251,191,36,0.28)",
                borderRadius: 22,
                padding: "18px 20px",
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#fff4d6", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em" }}>
                    SHARED TRIAL TIMER
                  </div>
                  <div style={{ color: "#d6e3f7", fontSize: 13, marginTop: 5 }}>
                    {trialBlocked
                      ? "Trial used. Subscribe to unlock the full live version."
                      : "The countdown keeps running even if you switch businesses between calls."}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 34,
                    fontWeight: 900,
                    letterSpacing: "-0.06em",
                    color: trialBlocked ? "#fca5a5" : urgentTimer ? "#fca5a5" : "#fde68a",
                  }}
                >
                  {formatTime(trialSecondsLeft)}
                </div>
              </div>

              <div style={{ width: "100%", height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${trialProgressPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: urgentTimer
                      ? "linear-gradient(90deg, #ef4444 0%, #f97316 100%)"
                      : "linear-gradient(90deg, #f59e0b 0%, #fde047 100%)",
                    transition: "width 0.45s ease",
                  }}
                />
              </div>
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
                disabled={isRefreshingTrial || (!callState.isActive && !canCall) || callState.connectionStatus === "connecting"}
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
                  cursor: isRefreshingTrial || (!callState.isActive && !canCall) || callState.connectionStatus === "connecting" ? "not-allowed" : "pointer",
                  opacity: isRefreshingTrial || (!callState.isActive && !canCall) || callState.connectionStatus === "connecting" ? 0.6 : 1,
                }}
              >
                {callState.connectionStatus === "connecting"
                  ? "Connecting…"
                  : callPhase === "active"
                  ? "End Trial Call"
                  : trialHasStarted
                  ? `Start Call (${formatTime(trialSecondsLeft)} left)`
                  : "Start Call (1-Minute Trial)"}
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

            <div style={{ color: trialBlocked ? "#fca5a5" : "#9fb3d1", fontSize: 13, lineHeight: 1.7 }}>
              {trialBlocked
                ? trialReason || "This device has already used the trial. Subscribe to continue."
                : "The trial is for testing only. The full subscription unlocks unlimited live calls, deployment, and business setup."}
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
                ? "You are inside the live trial. End the call at any time and switch to another business while your shared minute remains."
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
                    : trialBlocked
                    ? "Trial complete"
                    : "Start your trial call"}
                </div>
                <div style={{ textAlign: "center", color: "#9fb3d1", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                  {callPhase === "active"
                    ? `${selectedBusiness?.name || "Business"} agent is currently connected.`
                    : trialBlocked
                    ? "Upgrade to continue with unlimited business call testing."
                    : "No login required. The homepage itself is the test experience."}
                </div>

                {!trialBlocked ? (
                  <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.04)", padding: "16px 16px", border: "1px solid rgba(148,163,184,0.12)" }}>
                    <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 13, marginBottom: 10 }}>During your trial</div>
                    <div style={{ color: "#9fb3d1", fontSize: 13, lineHeight: 1.8 }}>
                      1. Start a live call with any business type.
                      <br />
                      2. Hang up and test another business if time remains.
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
                    Trial transcript preview appears here once the call starts.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16, color: "#94a3b8", fontSize: 12, lineHeight: 1.7 }}>
              Trial access is anonymous. Full deployment, account setup, and unlimited usage start after subscription.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}