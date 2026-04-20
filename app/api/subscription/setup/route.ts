import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getBusinessAccountByTenantId,
  IntegrationConfig,
  updateBusinessSubscriptionState,
} from "@/lib/businessAuthStore";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

function generatePseudoUkNumber(): string {
  const localPart = Math.floor(10000000 + Math.random() * 90000000);
  return `+44 20 ${String(localPart).slice(0, 4)} ${String(localPart).slice(4)}`;
}

function normalizeWebhookUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function integrationIsReady(integration: string, config: IntegrationConfig): boolean {
  if (integration === "website-widget") {
    return Boolean(config.widgetEmbedCode);
  }
  if (integration === "phone-number") {
    return Boolean(config.inboundPhoneNumber);
  }
  if (integration === "api-webhooks") {
    return Boolean(config.webhookUrl && config.webhookSecret);
  }
  return false;
}

export async function GET(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getBusinessAccountByTenantId(principal.tenantId);
  if (!account) {
    return NextResponse.json({ error: "Business account not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    setup: {
      selectedPlan: account.selectedPlan,
      selectedIntegration: account.selectedIntegration,
      subscriptionStatus: account.subscriptionStatus,
      subscriptionEndsAt: account.subscriptionEndsAt,
      integrationConfig: account.integrationConfig,
      integrationReady: integrationIsReady(account.selectedIntegration, account.integrationConfig),
      activationCompletedAt: account.activationCompletedAt,
    },
  });
}

export async function POST(request: NextRequest) {
  const principal = await getAuthenticatedBusinessFromRequest(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getBusinessAccountByTenantId(principal.tenantId);
  if (!account) {
    return NextResponse.json({ error: "Business account not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const selectedPlan = String(body.selectedPlan || account.selectedPlan);
  const selectedIntegration = String(body.selectedIntegration || account.selectedIntegration);
  const startTrial = Boolean(body.startTrial);
  const activatePaid = Boolean(body.activatePaid);
  const webhookUrlInput = String(body.webhookUrl || "");

  let integrationConfig: IntegrationConfig = {
    ...account.integrationConfig,
  };

  if (selectedIntegration === "website-widget") {
    integrationConfig.widgetEmbedCode = `<script src=\"https://asistoria.ai/embed.js\" data-tenant=\"${account.tenantId}\" data-theme=\"dark\"></script>`;
    integrationConfig.configuredAt = new Date().toISOString();
  }

  if (selectedIntegration === "phone-number") {
    integrationConfig.inboundPhoneNumber =
      integrationConfig.inboundPhoneNumber || generatePseudoUkNumber();
    integrationConfig.configuredAt = new Date().toISOString();
  }

  if (selectedIntegration === "api-webhooks") {
    const webhookUrl = normalizeWebhookUrl(webhookUrlInput);
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "A valid webhook URL is required for API & Webhooks integration." },
        { status: 400 }
      );
    }

    integrationConfig.webhookUrl = webhookUrl;
    integrationConfig.webhookSecret =
      integrationConfig.webhookSecret || randomBytes(20).toString("hex");
    integrationConfig.configuredAt = new Date().toISOString();
  }

  const trialStart = startTrial ? new Date() : null;
  const trialEnd = startTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

  const nextSubscriptionStatus = activatePaid
    ? "active"
    : startTrial
      ? "trialing"
      : account.subscriptionStatus;

  const integrationReady = integrationIsReady(selectedIntegration, integrationConfig);
  const activationCompletedAt =
    integrationReady && (nextSubscriptionStatus === "trialing" || nextSubscriptionStatus === "active")
      ? new Date().toISOString()
      : null;

  const updated = await updateBusinessSubscriptionState({
    businessId: account.id,
    selectedPlan,
    selectedIntegration,
    subscriptionStatus: nextSubscriptionStatus,
    subscriptionStartedAt: trialStart ? trialStart.toISOString() : account.subscriptionStartedAt,
    subscriptionEndsAt: trialEnd ? trialEnd.toISOString() : account.subscriptionEndsAt,
    integrationConfig,
    activationCompletedAt,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update setup state" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    setup: {
      selectedPlan: updated.selectedPlan,
      selectedIntegration: updated.selectedIntegration,
      subscriptionStatus: updated.subscriptionStatus,
      subscriptionEndsAt: updated.subscriptionEndsAt,
      integrationConfig: updated.integrationConfig,
      integrationReady: integrationIsReady(updated.selectedIntegration, updated.integrationConfig),
      activationCompletedAt: updated.activationCompletedAt,
    },
  });
}
