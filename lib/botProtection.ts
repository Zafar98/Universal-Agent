import { NextRequest } from "next/server";

type AttemptWindow = {
  timestamps: number[];
};

const attemptsByIp = new Map<string, AttemptWindow>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "yopmail.com",
]);

function normalizeIp(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "unknown";
  if (value.includes(",")) {
    return value.split(",")[0].trim();
  }
  return value;
}

export function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const real = request.headers.get("x-real-ip") || "";
  return normalizeIp(forwarded || real || "unknown");
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attemptsByIp.get(ip) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
  attemptsByIp.set(ip, entry);
  return entry.timestamps.length >= MAX_ATTEMPTS;
}

export function trackAttempt(ip: string): void {
  const now = Date.now();
  const entry = attemptsByIp.get(ip) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
  entry.timestamps.push(now);
  attemptsByIp.set(ip, entry);
}

export function getRecentAttemptCount(ip: string): number {
  const now = Date.now();
  const entry = attemptsByIp.get(ip) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
  attemptsByIp.set(ip, entry);
  return entry.timestamps.length;
}

export function isLikelyBotSignup(input: {
  honeypot?: string;
  formStartedAt?: number;
}): boolean {
  const honeypot = String(input.honeypot || "").trim();
  if (honeypot.length > 0) {
    return true;
  }

  const started = Number(input.formStartedAt || 0);
  if (!Number.isFinite(started) || started <= 0) {
    return true;
  }

  const elapsed = Date.now() - started;
  // Most bots submit in under a second; require at least 3.5s interaction.
  if (elapsed < 3500) {
    return true;
  }

  // Protect against stale/fabricated timestamps older than 2 hours.
  if (elapsed > 2 * 60 * 60 * 1000) {
    return true;
  }

  return false;
}

export function extractEmailDomain(email: string): string {
  const normalized = String(email || "").trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex < 0 || atIndex === normalized.length - 1) {
    return "";
  }
  return normalized.slice(atIndex + 1);
}

export function isDisposableEmailDomain(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) {
    return false;
  }
  return DISPOSABLE_DOMAINS.has(domain);
}

export function calculateSignupRiskScore(input: {
  honeypot?: string;
  formStartedAt?: number;
  userAgent?: string;
  email?: string;
  ipAttemptCount?: number;
  recentRiskScore?: number;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const honeypot = String(input.honeypot || "").trim();
  if (honeypot.length > 0) {
    score += 80;
    reasons.push("honeypot-filled");
  }

  const started = Number(input.formStartedAt || 0);
  if (!Number.isFinite(started) || started <= 0) {
    score += 45;
    reasons.push("invalid-start-time");
  } else {
    const elapsed = Date.now() - started;
    if (elapsed < 3500) {
      score += 45;
      reasons.push("submitted-too-fast");
    } else if (elapsed < 7000) {
      score += 20;
      reasons.push("submitted-fast");
    }
    if (elapsed > 2 * 60 * 60 * 1000) {
      score += 25;
      reasons.push("stale-timestamp");
    }
  }

  const userAgent = String(input.userAgent || "").toLowerCase();
  if (!userAgent || userAgent === "unknown") {
    score += 20;
    reasons.push("missing-user-agent");
  }
  if (/curl|wget|python|httpclient|node-fetch|axios/.test(userAgent)) {
    score += 55;
    reasons.push("automation-user-agent");
  }

  if (isDisposableEmailDomain(String(input.email || ""))) {
    score += 35;
    reasons.push("disposable-email-domain");
  }

  const ipAttemptCount = Number(input.ipAttemptCount || 0);
  if (ipAttemptCount >= 3) {
    score += Math.min(30, ipAttemptCount * 5);
    reasons.push("repeated-attempts");
  }

  const recentRiskScore = Number(input.recentRiskScore || 0);
  if (recentRiskScore >= 40) {
    score += 20;
    reasons.push("ip-historical-risk");
  }
  if (recentRiskScore >= 120) {
    score += 25;
    reasons.push("ip-high-historical-risk");
  }

  return {
    score,
    reasons,
  };
}
