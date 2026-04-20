"use client";

import { useVoiceCall } from "@/lib/useVoiceCall";
import { useState, useEffect, useRef } from "react";

type TenantOption = {
  id: string;
  name: string;
};

const SMART_ROUTING_OPTIONS: TenantOption[] = [
  { id: "developers-housing", name: "Housing Association" },
  { id: "grand-harbor-hotel", name: "Hotel" },
  { id: "sunset-bistro", name: "Restaurant" },
];

export function CallInterface({ initialTenantId }: { initialTenantId?: string }) {
  const { callState, startCall, startListening, stopListening, endCall } = useVoiceCall();
  const [isClient, setIsClient] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showCallEndedToast, setShowCallEndedToast] = useState(false);
  const [officeAmbience, setOfficeAmbience] = useState(true);
  const [noiseNode, setNoiseNode] = useState<AudioBufferSourceNode | null>(null);
  const [noiseContext, setNoiseContext] = useState<AudioContext | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const previousIsActiveRef = useRef(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [intake, setIntake] = useState({
    tenantId: initialTenantId || "developers-housing",
    callerName: "",
    callerPhone: "",
    callReason: "y",
    dialedDepartmentHint: "",
  });

  const quickLinks = [
    { href: "/signup", label: "Sign up" },
    { href: "/login", label: "Sign in" },
    { href: "/admin", label: "Admin" },
    { href: "/subscription", label: "Subscription" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    void fetch("/api/tenants")
      .then((response) => response.json())
      .then((data) => {
        const tenantLookup = new Map<string, string>(
          (data.tenants || []).map((tenant: any) => [String(tenant.id), String(tenant.name)])
        );

        const options = SMART_ROUTING_OPTIONS.map((option) => ({
          id: option.id,
          name: option.name || tenantLookup.get(option.id) || option.id,
        }));

        setTenants(options);
        setIntake((prev) => ({
          ...prev,
          tenantId: options.some((option) => option.id === prev.tenantId)
            ? prev.tenantId
            : options[0]?.id || prev.tenantId,
        }));
      })
      .catch((error) => {
        console.error("Failed to load tenants:", error);
        setTenants(SMART_ROUTING_OPTIONS);
      });
  }, []);

  useEffect(() => {
    if (initialTenantId) {
      setIntake((prev) => ({ ...prev, tenantId: initialTenantId }));
    }
  }, [initialTenantId]);

  useEffect(() => {
    if (!callState.isActive) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState.isActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startOfficeAmbience = async () => {
    if (noiseNode || noiseContext) return;

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 2, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const source = context.createBufferSource();
    const lowPass = context.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 500;

    const highPass = context.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 120;

    const gain = context.createGain();
    gain.gain.value = callState.isAgentSpeaking ? 0.06 : 0.03;

    source.buffer = buffer;
    source.loop = true;
    source.connect(lowPass);
    lowPass.connect(highPass);
    highPass.connect(gain);
    gain.connect(context.destination);
    source.start();

    setNoiseContext(context);
    setNoiseNode(source);
    noiseGainRef.current = gain;
  };

  const stopOfficeAmbience = async () => {
    if (noiseNode) {
      noiseNode.stop();
      setNoiseNode(null);
    }

    if (noiseContext) {
      await noiseContext.close();
      setNoiseContext(null);
    }

    noiseGainRef.current = null;
  };

  useEffect(() => {
    if (!callState.isActive || !officeAmbience) {
      void stopOfficeAmbience();
      return;
    }

    void startOfficeAmbience();

    return () => {
      void stopOfficeAmbience();
    };
  }, [callState.isActive, officeAmbience]);

  useEffect(() => {
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = callState.isAgentSpeaking ? 0.06 : 0.03;
    }
  }, [callState.isAgentSpeaking, officeAmbience]);

  useEffect(() => {
    if (!callState.isActive) {
      setCallDuration(0);
      setMenuOpen(false);
    }
  }, [callState.isActive]);

  useEffect(() => {
    const wasActive = previousIsActiveRef.current;

    if (wasActive && !callState.isActive) {
      setShowCallEndedToast(true);
      const timer = window.setTimeout(() => {
        setShowCallEndedToast(false);
      }, 1500);
      previousIsActiveRef.current = callState.isActive;
      return () => window.clearTimeout(timer);
    }

    previousIsActiveRef.current = callState.isActive;
    return undefined;
  }, [callState.isActive]);

  const showLaunchScreen = !callState.isActive || callState.connectionStatus === "ending";

  if (!isClient) {
    return <div style={{ background: "#1e3a8a", minHeight: "100vh" }} />;
  }

  if (showLaunchScreen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 500px at 20% 0%, rgba(56,189,248,0.24), transparent 65%), radial-gradient(900px 500px at 88% 18%, rgba(59,130,246,0.2), transparent 62%), linear-gradient(140deg, #030712 0%, #0f172a 46%, #111827 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes ua-home-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes ua-home-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0.35); }
            70% { box-shadow: 0 0 0 22px rgba(14,165,233,0); }
          }
          @keyframes ua-home-grid {
            from { background-position: 0 0, 0 0; }
            to { background-position: 0 40px, 40px 0; }
          }
          @keyframes ua-home-menu-in {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ua-toast-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {showCallEndedToast ? (
          <div
            style={{
              position: "absolute",
              top: "18px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(125,211,252,0.45)",
              color: "#e0f2fe",
              borderRadius: "999px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.01em",
              boxShadow: "0 12px 24px rgba(2,6,23,0.45)",
              zIndex: 12,
              animation: "ua-toast-in 160ms ease",
            }}
          >
            Call ended. Ready for another test.
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 8,
          }}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              color: "#e0f2fe",
              border: "1px solid rgba(125,211,252,0.56)",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              background: "rgba(14,116,144,0.26)",
              cursor: "pointer",
            }}
          >
            Quick Links ▾
          </button>

          {menuOpen ? (
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: 0,
                minWidth: "300px",
                background: "rgba(15,23,42,0.96)",
                border: "1px solid rgba(125,211,252,0.42)",
                borderRadius: "14px",
                boxShadow: "0 20px 38px rgba(2,6,23,0.65)",
                overflow: "hidden",
                animation: "ua-home-menu-in 160ms ease",
                zIndex: 9,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              {quickLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    textAlign: "left",
                    textDecoration: "none",
                    color: "#dbeafe",
                    padding: "11px 12px",
                    fontSize: "13px",
                    borderBottom: "1px solid rgba(148,163,184,0.16)",
                    borderRight: "1px solid rgba(148,163,184,0.14)",
                    background: "transparent",
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.24,
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            animation: "ua-home-grid 10s linear infinite",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(56,189,248,0.02) 70%)",
            top: "-80px",
            left: "-70px",
            filter: "blur(10px)",
            animation: "ua-home-float 7s ease-in-out infinite",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.02) 72%)",
            bottom: "-120px",
            right: "-90px",
            filter: "blur(12px)",
            animation: "ua-home-float 9s ease-in-out infinite",
          }}
        />

        <div
          style={{
            textAlign: "center",
            width: "100%",
            maxWidth: "760px",
            position: "relative",
            zIndex: 2,
            border: "1px solid rgba(148,163,184,0.24)",
            background: "linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.46))",
            backdropFilter: "blur(16px)",
            borderRadius: "28px",
            padding: "26px 22px 24px",
            boxShadow: "0 24px 60px rgba(2,6,23,0.55)",
          }}
        >
          <div
            style={{
              width: "132px",
              height: "132px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #38bdf8 100%)",
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "60px",
              animation: "ua-home-pulse 2.6s infinite",
            }}
          >
            🤖
          </div>

          <div
            style={{
              color: "#7dd3fc",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Autonomous Voice Interface
          </div>

          <h1 style={{ fontSize: "40px", fontWeight: 900, color: "#e0f2fe", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Asistoria
          </h1>
          <p style={{ color: "#bae6fd", marginBottom: "26px", fontSize: "16px" }}>
            Futuristic real-time business voice operations in one intelligent control line
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              margin: "0 auto 20px",
              background: "rgba(15,23,42,0.5)",
              border: "1px solid rgba(56,189,248,0.28)",
              borderRadius: "20px",
              padding: "14px 14px 10px",
              textAlign: "left",
            }}
          >
            <div style={{ color: "#e0f2fe", fontWeight: 800, marginBottom: "8px", letterSpacing: "0.02em" }}>
              Smart call routing
            </div>
            <p style={{ color: "#bae6fd", fontSize: "13px", lineHeight: 1.5, marginTop: 0 }}>
              The agent adapts instantly to your selected business profile and handles calls end-to-end in one consistent voice.
            </p>

            {!initialTenantId ? (
              <>
                <label style={{ display: "block", color: "#dbeafe", fontSize: "12px", marginBottom: "6px" }}>Business line</label>
                <select
                  value={intake.tenantId}
                  onChange={(event) => setIntake((prev) => ({ ...prev, tenantId: event.target.value }))}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid rgba(125,211,252,0.36)", padding: "10px 12px", marginBottom: "10px", background: "rgba(15,23,42,0.9)", color: "#e0f2fe" }}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>

          <button
            onClick={() => startCall({ tenantId: intake.tenantId })}
            style={{
              background: "linear-gradient(135deg, #06b6d4, #2563eb)",
              color: "white",
              fontWeight: 800,
              padding: "16px 32px",
              borderRadius: "50px",
              fontSize: "18px",
              width: "100%",
              maxWidth: "360px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 12px 28px rgba(6,182,212,0.28)",
              letterSpacing: "0.01em",
            }}
          >
            {callState.connectionStatus === "connecting" ? "Connecting..." : "Launch Voice Session"}
          </button>
        </div>
      </div>
    );
  }

  if (callState.isActive && callState.connectionStatus !== "ending") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #0b1220 0%, #111827 100%)",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#111827",
            border: "1px solid rgba(148,163,184,0.24)",
            borderRadius: "28px",
            padding: "28px 22px 26px",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(2,6,23,0.55)",
          }}
        >
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              margin: "0 auto 14px",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
            }}
          >
            🤖
          </div>

          <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#f8fafc" }}>
            {callState.tenantName || "Asistoria"}
          </h2>

          <p style={{ margin: "0 0 14px", color: "#93c5fd", fontSize: "14px" }}>
            {callState.connectionStatus === "connected" ? "On call" : "Connecting"}
          </p>

          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: "18px",
              color: "#e2e8f0",
            }}
          >
            {formatDuration(callDuration)}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "12px" }}>
            <button
              onClick={callState.isMuted ? startListening : stopListening}
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.3)",
                background: callState.isMuted ? "#7f1d1d" : "#1f2937",
                color: "#f8fafc",
                padding: "11px 16px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                minWidth: "120px",
              }}
            >
              {callState.isMuted ? "Unmute" : "Mute"}
            </button>

            <button
              onClick={endCall}
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(248,113,113,0.5)",
                background: "#dc2626",
                color: "#fff",
                padding: "11px 18px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                minWidth: "120px",
              }}
            >
              End call
            </button>
          </div>

          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            {callState.isAgentSpeaking ? "Agent speaking..." : "Listening..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 500px at 12% 0%, rgba(56,189,248,0.22), transparent 62%), radial-gradient(900px 520px at 88% 20%, rgba(59,130,246,0.2), transparent 66%), linear-gradient(140deg, #030712 0%, #0f172a 46%, #111827 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ua-live-float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ua-live-grid {
          from { background-position: 0 0, 0 0; }
          to { background-position: 0 36px, 36px 0; }
        }
        @keyframes ua-live-pulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14,165,233,0.42); }
          70% { transform: scale(1.03); box-shadow: 0 0 0 24px rgba(14,165,233,0); }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 8,
        }}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            color: "#e0f2fe",
            border: "1px solid rgba(125,211,252,0.56)",
            borderRadius: "999px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            background: "rgba(14,116,144,0.26)",
            cursor: "pointer",
          }}
        >
          Quick Links ▾
        </button>

        {menuOpen ? (
          <div
            style={{
              position: "absolute",
              top: "42px",
              right: 0,
              minWidth: "300px",
              background: "rgba(15,23,42,0.96)",
              border: "1px solid rgba(125,211,252,0.42)",
              borderRadius: "14px",
              boxShadow: "0 20px 38px rgba(2,6,23,0.65)",
              overflow: "hidden",
              zIndex: 9,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  textAlign: "left",
                  textDecoration: "none",
                  color: "#dbeafe",
                  padding: "11px 12px",
                  fontSize: "13px",
                  borderBottom: "1px solid rgba(148,163,184,0.16)",
                  borderRight: "1px solid rgba(148,163,184,0.14)",
                  background: "transparent",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          animation: "ua-live-grid 11s linear infinite",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "290px",
          height: "290px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.45) 0%, rgba(14,165,233,0.02) 74%)",
          top: "-100px",
          right: "-80px",
          filter: "blur(8px)",
          animation: "ua-live-float 8s ease-in-out infinite",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          position: "relative",
          zIndex: 2,
          border: "1px solid rgba(148,163,184,0.22)",
          background: "linear-gradient(180deg, rgba(15,23,42,0.76), rgba(15,23,42,0.5))",
          backdropFilter: "blur(16px)",
          borderRadius: "28px",
          padding: "22px 18px",
          boxShadow: "0 24px 60px rgba(2,6,23,0.56)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "116px",
            height: "116px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 58%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "54px",
            marginBottom: "16px",
            animation: "ua-live-pulse 2.4s infinite",
          }}
        >
          🤖
        </div>

        <div style={{ color: "#7dd3fc", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "6px" }}>
          Live Conversation
        </div>

        <h2 style={{ color: "#e0f2fe", fontSize: "26px", margin: "0 0 12px", fontWeight: 800 }}>
          {callState.tenantName || "Asistoria"}
        </h2>

        <div style={{ color: "#bae6fd", fontSize: "20px", fontWeight: 700, marginBottom: "12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {formatDuration(callDuration)}
        </div>

        {callState.activeDepartmentName ? (
          <div style={{ color: "#e0f2fe", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(14,116,144,0.24)", border: "1px solid rgba(125,211,252,0.4)", borderRadius: "999px", padding: "5px 10px" }}>
            Active department: {callState.activeDepartmentName}
          </div>
        ) : null}

        <div style={{ color: "#dbeafe", marginBottom: "8px", fontSize: "13px", textAlign: "center" }}>
          Routed by: {callState.routingSource}
          {callState.callerName ? ` · Caller: ${callState.callerName}` : ""}
        </div>

        <div style={{ color: "#c7d2fe", marginBottom: "10px", fontSize: "13px", textTransform: "capitalize" }}>
          Verification: {callState.verificationStatus.replace("_", " ")}
        </div>

        {callState.isTransferring ? (
          <div
            style={{
              color: "#fde68a",
              marginBottom: "12px",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Updating specialist context
          </div>
        ) : null}

        {callState.routingRationale ? (
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              color: "#cbd5e1",
              fontSize: "13px",
              marginBottom: "12px",
              textAlign: "center",
              background: "rgba(15,23,42,0.4)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "12px",
              padding: "10px 12px",
            }}
          >
            {callState.routingRationale}
          </div>
        ) : null}

        <div
          style={{
            color: "#bfdbfe",
            fontSize: "13px",
            marginBottom: "14px",
            textTransform: "capitalize",
          }}
        >
          {callState.connectionStatus === "connected"
            ? "Connected"
            : callState.connectionStatus === "connecting"
              ? "Connecting"
              : callState.connectionStatus}
        </div>

        <button
          onClick={() => setOfficeAmbience((prev) => !prev)}
          style={{
            marginBottom: "12px",
            background: officeAmbience ? "rgba(14,165,233,0.24)" : "rgba(255,255,255,0.12)",
            color: "#eaf2ff",
            border: "1px solid rgba(125,211,252,0.45)",
            borderRadius: "999px",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {officeAmbience ? "Office ambience on" : "Office ambience off"}
        </button>

        <div
          style={{
            width: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.62)",
            borderRadius: "10px",
            padding: "11px 12px",
            marginBottom: "18px",
            border: "1px solid rgba(56,189,248,0.28)",
            color: "#bae6fd",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          Transcript access is available in the dashboard only.
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={callState.isMuted ? startListening : stopListening}
            style={{
              minWidth: "130px",
              padding: "12px 18px",
              borderRadius: "999px",
              backgroundColor: callState.isMuted
                ? "rgba(239,68,68,0.32)"
                : callState.isAgentSpeaking
                  ? "rgba(59,130,246,0.3)"
                  : callState.isListening
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(255,255,255,0.14)",
              color: "white",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.22)",
              cursor: "pointer",
            }}
          >
            {callState.isMuted
              ? "Muted"
              : callState.isAgentSpeaking
                ? "Agent speaking"
                : callState.isListening
                  ? "Live mic"
                  : "Processing"}
          </button>

          <button
            onClick={endCall}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: "1px solid rgba(248,113,113,0.5)",
              fontSize: "24px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #991b1b, #dc2626)",
              color: "white",
              boxShadow: "0 10px 26px rgba(220,38,38,0.34)",
            }}
          >
            ☎️
          </button>
        </div>

        <div style={{ color: "#bfdbfe", fontSize: "14px", textAlign: "center", maxWidth: "640px" }}>
          {callState.isMuted
            ? "Your microphone is muted. Tap the status pill to unmute."
            : callState.isAgentSpeaking
              ? "The agent is talking. You can interrupt naturally if needed."
              : callState.isListening
                ? "Live call in progress. Speak naturally like a normal phone call."
                : "The model is processing your last turn."}
        </div>
      </div>
    </div>
  );
}
