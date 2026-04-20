export type ChallengeVerificationResult = {
  success: boolean;
  provider: "turnstile";
  reason?: string;
};

export async function verifyChallengeToken(token: string, ip?: string): Promise<ChallengeVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || "";
  if (!secretKey) {
    return {
      success: false,
      provider: "turnstile",
      reason: "challenge-not-configured",
    };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: secretKey,
      response: String(token || ""),
      remoteip: String(ip || ""),
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      provider: "turnstile",
      reason: "provider-request-failed",
    };
  }

  const result = (await response.json()) as { success?: boolean };
  return {
    success: Boolean(result.success),
    provider: "turnstile",
    reason: result.success ? undefined : "verification-failed",
  };
}
