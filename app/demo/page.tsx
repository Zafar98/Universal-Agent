"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";

const TRIAL_SECONDS = 60;

/** Derive a lightweight browser fingerprint without any third-party library. */
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

type AuthState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "authenticated"; email: string; hasUsedDemo: boolean; subscribed: boolean };

type BusinessOption = { id: string; tenantId: string; name: string; summary: string };
type TrialStatus = {
  blocked: boolean;
  reason?: string;
  subscribed?: boolean;
  hasStarted: boolean;
  isActive: boolean;
  secondsLeft: number;
  expiresAt: string | null;
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function getTrialProgressPercent(secondsLeft: number) {
  return Math.max(0, Math.min(100, (secondsLeft / TRIAL_SECONDS) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: "3px solid rgba(255,255,255,0.2)",
        borderTop: "3px solid white",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto",
      }}
    />
  );
}

function AuthPanel({
  onAuthenticated,
}: {
  onAuthenticated: (email: string, hasUsedDemo: boolean, subscribed: boolean) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState<number>(Date.now());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormStartedAt(Date.now());
    setWebsite("");
  }, [tab]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = tab === "login" ? "/api/demo/login" : "/api/demo/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(tab === "signup" ? { website, formStartedAt } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onAuthenticated(data.email, data.hasUsedDemo, data.subscribed);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.07)",
    color: "white",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    color: active ? "white" : "rgba(255,255,255,0.5)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: active ? 700 : 400,
    fontSize: 14,
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 400,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎙️</div>
        <h2 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 700 }}>
          Try the AI Voice Agent
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: "8px 0 0", fontSize: 14 }}>
          One shared 60-second demo window — switch businesses inside your remaining time
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "rgba(0,0,0,0.2)",
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
        }}
      >
        <button style={tabStyle(tab === "login")} onClick={() => setTab("login")}>
          Sign In
        </button>
        <button style={tabStyle(tab === "signup")} onClick={() => setTab("signup")}>
          Create Account
        </button>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          style={inputStyle}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={tab === "signup" ? "new-password" : "current-password"}
          minLength={6}
        />

        {tab === "signup" ? (
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
          />
        ) : null}

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 8,
              padding: "10px 14px",
              color: "#fca5a5",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? <Spinner /> : tab === "login" ? "Sign In & Try Demo" : "Create Account & Try Demo"}
        </button>
      </form>
    </div>
  );
}

function SubscribePanel({
  email,
  onSubscribed: _onSubscribed,
  onLogout,
}: {
  email: string;
  onSubscribed: () => void;
  onLogout: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not start checkout.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError("Unexpected response from server.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        padding: "36px 28px",
        width: "100%",
        maxWidth: 420,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 12 }}>⏱️</div>
      <h2 style={{ color: "white", margin: "0 0 10px", fontSize: 22 }}>
        Your demo window has ended
      </h2>
      <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 28px", fontSize: 14, lineHeight: 1.6 }}>
        Your shared 60-second demo window has been used. Subscribe to get unlimited
        calls across every business agent.
      </p>

      <div
        style={{
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        <div style={{ color: "#a5b4fc", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>
          SUBSCRIPTION INCLUDES
        </div>
        {[
          "Unlimited calls to all business agents",
          "Hotel, Restaurant, Housing, Utilities & more",
          "Night Concierge agent for after-hours calls",
          "Full call transcripts and logs",
        ].map((feature) => (
          <div
            key={feature}
            style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 6, display: "flex", gap: 8 }}
          >
            <span style={{ color: "#818cf8" }}>✓</span> {feature}
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.18)",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#fca5a5",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={subscribe}
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "14px",
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {loading ? <Spinner /> : "Activate Subscription"}
      </button>

      <button
        onClick={onLogout}
        style={{
          background: "transparent",
          color: "rgba(255,255,255,0.4)",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          padding: "6px",
        }}
      >
        Sign out ({email})
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const { callState, startCall, endCall } = useVoiceCall();

  const [authState, setAuthState] = useState<AuthState>({ kind: "loading" });
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(TRIAL_SECONDS);
  const [callPhase, setCallPhase] = useState<"idle" | "active" | "ended">("idle");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [trialReason, setTrialReason] = useState("");
  const [trialHasStarted, setTrialHasStarted] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trialCompletionSentRef = useRef(false);

  // ─── Compute browser fingerprint once on mount ──────────────────────────────
  useEffect(() => {
    setFingerprint(computeFingerprint());
  }, []);

  // ─── Load auth status + handle Stripe return params ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const justSubscribed = params.get("subscribed") === "1";

    // Remove the query param so refreshing doesn't re-trigger
    if (params.has("subscribed") || params.has("cancelled")) {
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }

    fetch("/api/demo/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          const subscribed = data.subscribed || justSubscribed;
          setAuthState({
            kind: "authenticated",
            email: data.email,
            hasUsedDemo: data.hasUsedDemo,
            subscribed,
          });
          setIsSubscribed(subscribed);
        } else {
          setAuthState({ kind: "unauthenticated" });
        }
      })
      .catch(() => setAuthState({ kind: "unauthenticated" }));
  }, []);

  const refreshTrialStatus = useCallback(async () => {
    if (!fingerprint) return;

    try {
      const res = await fetch(`/api/demo/trial-status?fingerprint=${encodeURIComponent(fingerprint)}`);
      const data = (await res.json().catch(() => ({}))) as Partial<TrialStatus>;
      const blocked = Boolean(data.blocked);
      const secondsLeft = Math.max(0, Number(data.secondsLeft ?? TRIAL_SECONDS));

      setDeviceBlocked(blocked);
      setTrialReason(String(data.reason || ""));
      setTrialHasStarted(Boolean(data.hasStarted));
      setTrialSecondsLeft(blocked ? 0 : secondsLeft || (data.hasStarted ? 0 : TRIAL_SECONDS));
      trialCompletionSentRef.current = blocked;

      if (blocked) {
        setAuthState((prev) =>
          prev.kind === "authenticated" && !prev.subscribed
            ? { ...prev, hasUsedDemo: true }
            : prev
        );
      }
    } catch {
      // Non-blocking; the page can still work off local state.
    }
  }, [fingerprint]);

  // ─── Device-level trial block check ────────────────────────────────────────
  useEffect(() => {
    void refreshTrialStatus();
  }, [refreshTrialStatus]);

  // ─── Load business options ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/business-models")
      .then((r) => r.json())
      .then((data) => {
        const list: BusinessOption[] = (data.businessModels || []).map((m: BusinessOption) => ({
          id: m.id,
          tenantId: m.tenantId,
          name: m.name,
          summary: m.summary,
        }));
        setBusinesses(list);
        if (list.length > 0 && !selectedBusinessId) setSelectedBusinessId(list[0].id);
      })
      .catch(console.error);
  }, []);

  // ─── Trial tracking helpers ─────────────────────────────────────────────────
  const stopTrialTimer = useCallback(() => {
    if (trialTimerRef.current) {
      clearInterval(trialTimerRef.current);
      trialTimerRef.current = null;
    }
  }, []);

  const completeTrialWindow = useCallback(async () => {
    if (isSubscribed || !fingerprint || trialCompletionSentRef.current) {
      return;
    }

    trialCompletionSentRef.current = true;
    setDeviceBlocked(true);
    setTrialHasStarted(true);
    setTrialSecondsLeft(0);
    setTrialReason("Your shared 60-second demo window has ended. Subscribe for unlimited access.");
    setAuthState((prev) =>
      prev.kind === "authenticated" && !prev.subscribed
        ? { ...prev, hasUsedDemo: true }
        : prev
    );

    await fetch("/api/demo/trial-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    }).catch(() => {
      // Non-blocking; the client state is already finalized.
    });
  }, [fingerprint, isSubscribed]);

  // ─── Trial countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubscribed || !trialHasStarted || deviceBlocked || trialSecondsLeft <= 0) {
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
  }, [
    callState.isActive,
    completeTrialWindow,
    deviceBlocked,
    endCall,
    isSubscribed,
    stopTrialTimer,
    trialHasStarted,
    trialSecondsLeft,
  ]);

  // ─── Watch for call ending externally ──────────────────────────────────────
  useEffect(() => {
    if (!callState.isActive && callPhase === "active") {
      setCallPhase(isSubscribed || deviceBlocked || trialSecondsLeft <= 0 ? "ended" : "idle");
    }
  }, [callState.isActive, callPhase, deviceBlocked, isSubscribed, trialSecondsLeft]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStartCall = async () => {
    if (!isSubscribed && (deviceBlocked || trialSecondsLeft <= 0)) {
      setCallPhase("ended");
      return;
    }

    const activeBusiness = businesses.find((business) => business.id === selectedBusinessId);
    if (!activeBusiness) {
      return;
    }

    setCallPhase("active");
    await startCall({
      tenantId: activeBusiness.tenantId,
      isDemoCall: true,
      fingerprint,
    } as Parameters<typeof startCall>[0]);
    if (!isSubscribed) {
      void refreshTrialStatus();
    }
  };

  const handleEndCall = () => {
    endCall();
    setCallPhase(isSubscribed ? "ended" : "idle");
  };

  const handleLogout = async () => {
    await fetch("/api/demo/logout", { method: "POST" });
    stopTrialTimer();
    setAuthState({ kind: "unauthenticated" });
    setDeviceBlocked(false);
    setTrialReason("");
    setTrialHasStarted(false);
    setTrialSecondsLeft(TRIAL_SECONDS);
    trialCompletionSentRef.current = false;
    setCallPhase("idle");
  };

  const handleAuthenticated = (email: string, hasUsedDemo: boolean, subscribed: boolean) => {
    setAuthState({ kind: "authenticated", email, hasUsedDemo, subscribed });
    setIsSubscribed(subscribed);
    void refreshTrialStatus();
  };

  const handleSubscribed = () => {
    stopTrialTimer();
    setIsSubscribed(true);
    setDeviceBlocked(false);
    setTrialReason("");
    setTrialHasStarted(false);
    setTrialSecondsLeft(TRIAL_SECONDS);
    trialCompletionSentRef.current = false;
    if (authState.kind === "authenticated") {
      setAuthState({ ...authState, subscribed: true });
    }
    setCallPhase("idle");
  };

  const handleTryAgain = () => {
    setCallPhase("idle");
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const canCall =
    authState.kind === "authenticated" &&
    (isSubscribed || (!deviceBlocked && trialSecondsLeft > 0));

  const trialExhausted =
    !isSubscribed &&
    (deviceBlocked ||
      (authState.kind === "authenticated" && authState.hasUsedDemo && trialSecondsLeft <= 0));

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
  const urgentTimer = trialSecondsLeft <= 15;
  const trialProgressPercent = getTrialProgressPercent(trialSecondsLeft);

  // ─── Page shell ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes timerPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        * { box-sizing: border-box; }
        select option { background: #1e1b4b; color: white; }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              color: "white",
              fontSize: 30,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            AI Voice Agent Demo
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "8px 0 0", fontSize: 15 }}>
            Use one shared minute to sample different business agents before subscribing
          </p>
        </div>



        {/* Loading */}
        {authState.kind === "loading" && <Spinner />}

        {/* Unauthenticated */}
        {authState.kind === "unauthenticated" && (
          <AuthPanel onAuthenticated={handleAuthenticated} />
        )}

        {/* Trial exhausted and not subscribed */}
        {trialExhausted && !isSubscribed && callPhase !== "active" && (
          <SubscribePanel
            email={authState.kind === "authenticated" ? authState.email : ""}
            onSubscribed={handleSubscribed}
            onLogout={handleLogout}
          />
        )}

        {/* Ready to call */}
        {authState.kind === "authenticated" && canCall && callPhase === "idle" && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "32px 28px",
              width: "100%",
              maxWidth: 440,
            }}
          >
            {/* User greeting */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                  Welcome back
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                  {authState.email}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isSubscribed && (
                  <span
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34,197,94,0.4)",
                      borderRadius: 999,
                      padding: "3px 10px",
                      color: "#86efac",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    SUBSCRIBER
                  </span>
                )}
                {!isSubscribed && (
                  <span
                    style={{
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.35)",
                      borderRadius: 999,
                      padding: "3px 10px",
                      color: "#fde68a",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                        SHARED DEMO
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>



            {!isSubscribed && (
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  marginBottom: 20,
                }}
              >
                {businesses.slice(0, 6).map((business) => {
                  const active = business.id === selectedBusinessId;
                  return (
                    <button
                      key={business.id}
                      onClick={() => setSelectedBusinessId(business.id)}
                      style={{
                        background: active ? "rgba(99,102,241,0.24)" : "rgba(255,255,255,0.05)",
                        border: active
                          ? "1px solid rgba(129,140,248,0.6)"
                          : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: active ? "white" : "rgba(255,255,255,0.78)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "10px 12px",
                        textAlign: "left",
                      }}
                      type="button"
                    >
                      {business.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Business selector */}
            <label
              style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 8 }}
            >
              Choose a business to sample
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.07)",
                color: "white",
                fontSize: 15,
                marginBottom: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {selectedBusiness && (
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                {selectedBusiness.summary}
              </p>
            )}

            <button
              onClick={handleStartCall}
              disabled={callState.connectionStatus === "connecting"}
              style={{
                width: "100%",
                background:
                  callState.connectionStatus === "connecting"
                    ? "rgba(34,197,94,0.45)"
                    : "#22c55e",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontSize: 17,
                fontWeight: 800,
                cursor:
                  callState.connectionStatus === "connecting" ? "wait" : "pointer",
                letterSpacing: "-0.2px",
              }}
            >
              {callState.connectionStatus === "connecting"
                ? "Connecting…"
                : isSubscribed
                ? "📞 Start Call"
                : trialHasStarted
                ? `📞 Try ${selectedBusiness?.name || "Another Business"}`
                : "📞 Start Shared Demo"}
            </button>
          </div>
        )}

        {/* Active call */}
        {callPhase === "active" && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "36px 28px",
              width: "100%",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            {/* Agent avatar */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: callState.isAgentSpeaking
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(99,102,241,0.25)",
                border: callState.isAgentSpeaking
                  ? "3px solid #818cf8"
                  : "3px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                margin: "0 auto 16px",
                animation: callState.isAgentSpeaking ? "pulse 1.4s ease-in-out infinite" : "none",
                transition: "all 0.3s",
              }}
            >
              🤖
            </div>

            <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              {callState.isAgentSpeaking ? "Agent is speaking…" : "Listening…"}
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              {selectedBusiness?.name} AI Agent
            </div>



            {isSubscribed && (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 28 }}>
                Unlimited call — subscriber
              </div>
            )}

            {/* Live transcript (last 3 lines) */}
            {callState.transcript.length > 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 24,
                  textAlign: "left",
                  maxHeight: 100,
                  overflow: "hidden",
                }}
              >
                {callState.transcript.slice(-3).map((entry) => (
                  <div key={entry.id} style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        color: entry.speaker === "agent" ? "#a5b4fc" : "#86efac",
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        marginRight: 6,
                      }}
                    >
                      {entry.speaker === "agent" ? "Agent" : "You"}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                      {entry.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleEndCall}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "14px 40px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔴 End Call
            </button>
          </div>
        )}

        {/* Call ended */}
        {callPhase === "ended" && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "40px 28px",
              width: "100%",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>
              {isSubscribed ? "✅" : "⏱️"}
            </div>
            <h2 style={{ color: "white", margin: "0 0 10px", fontSize: 22 }}>
              {isSubscribed ? "Call complete" : "Demo window complete"}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                lineHeight: 1.6,
                margin: "0 0 28px",
              }}
            >
              {isSubscribed
                ? "Thanks for calling. Start a new call whenever you're ready."
                : trialReason || "Your shared demo window has ended. Subscribe for unlimited access to all business agents."}
            </p>

            {isSubscribed ? (
              <button
                onClick={handleTryAgain}
                style={{
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 32px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📞 Start New Call
              </button>
            ) : (
              <SubscribePanel
                email={authState.kind === "authenticated" ? authState.email : ""}
                onSubscribed={handleSubscribed}
                onLogout={handleLogout}
              />
            )}
          </div>
        )}

        {/* Footer nav */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { href: "/", label: "← Home" },
            { href: "/dashboard", label: "Business Dashboard" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
                fontSize: 13,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                padding: "5px 14px",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
