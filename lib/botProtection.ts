import { NextRequest } from "next/server";

type AttemptWindow = {
  timestamps: number[];
};

const attemptsByIp = new Map<string, AttemptWindow>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

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
