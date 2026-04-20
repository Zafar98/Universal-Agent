import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseConfig } from "@/lib/postgres";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

function has(value?: string | null): boolean {
  return Boolean(value && String(value).trim().length > 0);
}

export async function GET(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!principal || !principal.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks = [
    {
      key: "database",
      ok: hasDatabaseConfig(),
      detail: hasDatabaseConfig() ? "DATABASE_URL is configured." : "DATABASE_URL is missing.",
    },
    {
      key: "openai",
      ok: has(process.env.OPENAI_API_KEY),
      detail: has(process.env.OPENAI_API_KEY) ? "OPENAI_API_KEY is configured." : "OPENAI_API_KEY is missing.",
    },
    {
      key: "dashboard_session_secret",
      ok: has(process.env.DASHBOARD_SESSION_SECRET),
      detail: has(process.env.DASHBOARD_SESSION_SECRET)
        ? "DASHBOARD_SESSION_SECRET is configured."
        : "DASHBOARD_SESSION_SECRET is missing.",
    },
    {
      key: "app_url",
      ok: has(process.env.APP_URL),
      detail: has(process.env.APP_URL) ? "APP_URL is configured." : "APP_URL is missing.",
    },
    {
      key: "smtp",
      ok:
        has(process.env.SMTP_HOST) &&
        has(process.env.SMTP_PORT) &&
        has(process.env.SMTP_USERNAME) &&
        has(process.env.SMTP_PASSWORD) &&
        has(process.env.SMTP_FROM_EMAIL),
      detail:
        has(process.env.SMTP_HOST) &&
        has(process.env.SMTP_PORT) &&
        has(process.env.SMTP_USERNAME) &&
        has(process.env.SMTP_PASSWORD) &&
        has(process.env.SMTP_FROM_EMAIL)
          ? "SMTP delivery is configured."
          : "SMTP delivery is not fully configured.",
    },
    {
      key: "stripe_core",
      ok:
        has(process.env.STRIPE_SECRET_KEY) &&
        has(process.env.STRIPE_WEBHOOK_SECRET) &&
        (has(process.env.STRIPE_PRICE_STARTER) || has(process.env.STRIPE_DEMO_PRICE_ID)),
      detail:
        has(process.env.STRIPE_SECRET_KEY) &&
        has(process.env.STRIPE_WEBHOOK_SECRET) &&
        (has(process.env.STRIPE_PRICE_STARTER) || has(process.env.STRIPE_DEMO_PRICE_ID))
          ? "Stripe core keys are configured."
          : "Stripe keys/price IDs are incomplete.",
    },
    {
      key: "stripe_plan_prices",
      ok:
        (has(process.env.STRIPE_PRICE_STARTER) || has(process.env.STRIPE_DEMO_PRICE_ID)) &&
        has(process.env.STRIPE_PRICE_GROWTH) &&
        has(process.env.STRIPE_PRICE_ENTERPRISE),
      detail:
        (has(process.env.STRIPE_PRICE_STARTER) || has(process.env.STRIPE_DEMO_PRICE_ID)) &&
        has(process.env.STRIPE_PRICE_GROWTH) &&
        has(process.env.STRIPE_PRICE_ENTERPRISE)
          ? "All plan price IDs are configured."
          : "One or more plan price IDs are missing.",
    },
  ];

  const allOperational = checks.every((check) => check.ok);
  return NextResponse.json({
    ok: true,
    allOperational,
    checks,
    generatedAt: new Date().toISOString(),
  });
}
