"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SessionResponse = {
  authenticated?: boolean;
  business?: {
    businessName: string;
  };
};

const CAPABILITIES = [
  {
    title: "Verify once, launch fast",
    detail: "Create your account, verify your email, and move straight into business setup.",
  },
  {
    title: "Unlimited live calls after subscription",
    detail: "Your paid account unlocks full deployment instead of the anonymous homepage trial.",
  },
  {
    title: "Built for real operations",
    detail: "Routing, summaries, notifications, and logs are ready from the start.",
  },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  color: "#94a3b8",
  marginBottom: "6px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: "12px",
  padding: "11px 13px",
  marginBottom: "14px",
  background: "rgba(15,23,42,0.7)",
  color: "#e0f2fe",
  fontSize: "14px",
  boxSizing: "border-box",
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"signup" | "verify">("signup");
  const [error, setError] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [devCode, setDevCode] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [requiresChallenge, setRequiresChallenge] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    website: "",
    challengeToken: "",
    formStartedAt: Date.now(),
    termsAccepted: false,
    privacyAccepted: false,
    dpaAccepted: false,
    subprocessorAccepted: false,
    aiDisclosureAccepted: false,
  });

  const chosenPlan = searchParams.get("plan") || "starter";
  const chosenIntegration = searchParams.get("integration") || "website-widget";
  const verificationState = searchParams.get("verification") || "";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = (await response.json()) as SessionResponse;
        if (data.authenticated || data.business) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // Ignore and continue to signup.
      } finally {
        setLoading(false);
      }
    };

    void checkSession();
  }, [router]);

  useEffect(() => {
    if (verificationState === "missing") {
      setError("That verification link was incomplete. Request a new verification email by signing up again.");
      setStage("signup");
      return;
    }

    if (verificationState === "failed") {
      setError("That verification link is invalid or expired. Sign up again to receive a fresh verification email.");
      setStage("signup");
    }
  }, [verificationState]);

  const submitSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.termsAccepted || !form.privacyAccepted || !form.dpaAccepted || !form.subprocessorAccepted || !form.aiDisclosureAccepted) {
      setError("You must accept all legal terms to continue.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          surname: form.surname,
          email: form.email,
          password: form.password,
          selectedPlan: chosenPlan,
          selectedIntegration: chosenIntegration,
          website: form.website,
          challengeToken: form.challengeToken,
          formStartedAt: form.formStartedAt,
          termsAccepted: form.termsAccepted,
          privacyAccepted: form.privacyAccepted,
          dpaAccepted: form.dpaAccepted,
          subprocessorAccepted: form.subprocessorAccepted,
          aiDisclosureAccepted: form.aiDisclosureAccepted,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 403 && data.requiresChallenge) {
          setRequiresChallenge(true);
          setError("Additional human verification is required. Complete the challenge token and retry.");
          return;
        }
        setError(data.error || "Unable to create account right now.");
        return;
      }

      setPendingId(String(data.pendingId || ""));
      setDeliveryMessage(data.delivery?.message || "Verification email sent.");
      setDevLink(String(data.verificationUrl || ""));
      setDevCode(String(data.verificationPreviewCode || ""));
      setVerificationCode(String(data.verificationPreviewCode || ""));
      setRequiresChallenge(false);
      setStage("verify");
    } catch {
      setError("Unable to create account right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingId || !verificationCode) {
      setError("Enter the verification code from your email.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, verificationCode }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to verify email.");
        return;
      }

      router.push("/dashboard/setup?verified=1");
      router.refresh();
    } catch {
      setError("Unable to verify email right now. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#070d1c" }}>
        <div style={{ color: "#94a3b8" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 500px at 80% 0%, rgba(59,130,246,0.16), transparent 65%), linear-gradient(140deg, #030712 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        padding: "28px 18px 56px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: "28px" }}>
        <section>
          <div style={{ color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "11px", marginBottom: "12px" }}>
            Full Version Setup
          </div>
          <h1 style={{ fontSize: "46px", lineHeight: 1.04, color: "#e0f2fe", margin: "0 0 14px", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Create your business account and verify your email.
          </h1>
          <p style={{ color: "#64748b", fontSize: "17px", lineHeight: 1.7, maxWidth: "660px", margin: "0 0 24px" }}>
            The homepage trial is anonymous. This page is where a real customer account starts: sign up, verify by email, then continue into dashboard setup and subscription activation.
          </p>

          <div style={{ display: "grid", gap: "12px" }}>
            {CAPABILITIES.map((capability) => (
              <div
                key={capability.title}
                style={{
                  borderRadius: "16px",
                  background: "rgba(15,23,42,0.62)",
                  border: "1px solid rgba(148,163,184,0.14)",
                  padding: "16px 18px",
                }}
              >
                <div style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "16px", marginBottom: "6px" }}>{capability.title}</div>
                <div style={{ color: "#94a3b8", lineHeight: 1.5, fontSize: "13px" }}>{capability.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: "rgba(15,23,42,0.82)",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "24px",
            padding: "28px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 24px 60px rgba(2,6,23,0.5)",
            alignSelf: "start",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div>
              <div style={{ color: "#7dd3fc", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "4px" }}>
                {stage === "signup" ? "Sign Up" : "Verify Email"}
              </div>
              <h2 style={{ margin: 0, color: "#e0f2fe", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.01em" }}>
                {stage === "signup" ? "Create your account" : "Confirm your email"}
              </h2>
            </div>
            <Link href="/login" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none", fontSize: "13px", whiteSpace: "nowrap" }}>
              Sign In
            </Link>
          </div>

          {stage === "signup" ? (
            <form onSubmit={submitSignup}>
              <label style={labelStyle}>First name</label>
              <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} required style={inputStyle} />

              <label style={labelStyle}>Surname</label>
              <input value={form.surname} onChange={(event) => setForm((prev) => ({ ...prev, surname: event.target.value }))} required style={inputStyle} />

              <label style={labelStyle}>Email address</label>
              <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required style={inputStyle} />

              <label style={labelStyle}>Password</label>
              <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required minLength={8} style={{ ...inputStyle, marginBottom: "16px" }} />

              <div style={{ borderRadius: "14px", border: "1px solid rgba(56,189,248,0.2)", background: "rgba(14,116,144,0.1)", padding: "12px 14px", marginBottom: "4px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "10px" }}>
                  <input type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))} style={{ marginTop: "2px", accentColor: "#0ea5e9" }} />
                  <span>I agree to the <Link href="/terms" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>Terms and Conditions</Link>.</span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "10px" }}>
                  <input type="checkbox" checked={form.privacyAccepted} onChange={(event) => setForm((prev) => ({ ...prev, privacyAccepted: event.target.checked }))} style={{ marginTop: "2px", accentColor: "#0ea5e9" }} />
                  <span>I agree to the <Link href="/privacy" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>Privacy Policy</Link>.</span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "10px" }}>
                  <input type="checkbox" checked={form.dpaAccepted} onChange={(event) => setForm((prev) => ({ ...prev, dpaAccepted: event.target.checked }))} style={{ marginTop: "2px", accentColor: "#0ea5e9" }} />
                  <span>I acknowledge the Data Processing Agreement (DPA).</span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "13px", marginBottom: "10px" }}>
                  <input type="checkbox" checked={form.subprocessorAccepted} onChange={(event) => setForm((prev) => ({ ...prev, subprocessorAccepted: event.target.checked }))} style={{ marginTop: "2px", accentColor: "#0ea5e9" }} />
                  <span>I acknowledge approved sub-processors may process data on our behalf.</span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "13px" }}>
                  <input type="checkbox" checked={form.aiDisclosureAccepted} onChange={(event) => setForm((prev) => ({ ...prev, aiDisclosureAccepted: event.target.checked }))} style={{ marginTop: "2px", accentColor: "#0ea5e9" }} />
                  <span>I accept AI call handling and recording disclosure obligations for inbound callers.</span>
                </label>
              </div>

              {requiresChallenge ? (
                <div style={{ marginTop: "12px", borderRadius: "12px", border: "1px solid rgba(234,179,8,0.45)", background: "rgba(113,63,18,0.32)", padding: "12px" }}>
                  <label style={labelStyle}>Challenge token</label>
                  <input
                    value={form.challengeToken}
                    onChange={(event) => setForm((prev) => ({ ...prev, challengeToken: event.target.value }))}
                    placeholder="Paste Turnstile challenge token"
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              ) : null}

              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))} style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />

              {error ? (
                <div style={{ marginTop: "12px", borderRadius: "12px", background: "rgba(239,68,68,0.12)", color: "#fca5a5", padding: "10px 12px", fontSize: "13px", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: "16px", border: "none", borderRadius: "14px", background: submitting ? "rgba(37,99,235,0.6)" : "linear-gradient(135deg, #06b6d4, #2563eb)", color: "white", padding: "14px 16px", fontWeight: 800, fontSize: "15px", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 20px rgba(6,182,212,0.18)" }}>
                {submitting ? "Sending verification…" : "Send verification email"}
              </button>
            </form>
          ) : (
            <div>
              <div style={{ borderRadius: "14px", background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.16)", padding: "16px", marginBottom: "16px" }}>
                <div style={{ color: "#e0f2fe", fontWeight: 700, marginBottom: "6px" }}>Check your inbox</div>
                <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
                  We sent a verification email to <strong style={{ color: "#cbd5e1" }}>{form.email}</strong>. Click the link in the email or paste the code below to activate your account.
                </div>
                {deliveryMessage ? <div style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>{deliveryMessage}</div> : null}
                {devLink ? <div style={{ marginTop: "12px", fontSize: "12px", color: "#7dd3fc", wordBreak: "break-all" }}>Dev link: <a href={devLink} style={{ color: "#38bdf8" }}>{devLink}</a></div> : null}
                {devCode ? <div style={{ marginTop: "8px", color: "#38bdf8", fontWeight: 700, fontSize: "12px" }}>Dev code: {devCode}</div> : null}
              </div>

              <form onSubmit={submitVerification}>
                <label style={labelStyle}>Verification code</label>
                <input type="text" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required style={{ ...inputStyle, letterSpacing: "0.18em", fontWeight: 700 }} />

                {error ? (
                  <div style={{ marginTop: "12px", borderRadius: "12px", background: "rgba(239,68,68,0.12)", color: "#fca5a5", padding: "10px 12px", fontSize: "13px", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {error}
                  </div>
                ) : null}

                <button type="submit" disabled={verifying} style={{ width: "100%", marginTop: "16px", border: "none", borderRadius: "14px", background: verifying ? "rgba(37,99,235,0.6)" : "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "14px 16px", fontWeight: 800, fontSize: "15px", cursor: verifying ? "not-allowed" : "pointer" }}>
                  {verifying ? "Verifying…" : "Verify Email And Continue"}
                </button>
              </form>

              <button type="button" onClick={() => { setStage("signup"); setError(""); }} style={{ width: "100%", marginTop: "12px", border: "1px solid rgba(148,163,184,0.28)", borderRadius: "12px", padding: "12px 14px", background: "rgba(15,23,42,0.68)", color: "#cbd5e1", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                Back to sign up details
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
