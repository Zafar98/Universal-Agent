import { NextRequest, NextResponse } from "next/server";
import {
  buildDepartmentRoutingInstructions,
  getCallClosingLineForTenant,
  getTaskCompletionDirectiveForTenant,
  normalizeRealtimeVoice,
  resolveLeadVoiceForTenant,
  resolveTenantConfig,
} from "@/lib/tenantConfig";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getEffectiveBusinessWorkspace } from "@/lib/businessWorkspaceStore";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { getDemoSession, markDemoUsed, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";
import { getRequestIp } from "@/lib/botProtection";
import {
  buildIdentityHash,
  getTrialWindowStatus,
  startOrResumeTrialWindow,
} from "@/lib/trialTrackingStore";

function isIntegrationReadyForAccount(account: {
  selectedIntegration: string;
  integrationConfig: {
    widgetEmbedCode?: string;
    inboundPhoneNumber?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  };
}): boolean {
  if (account.selectedIntegration === "website-widget") {
    return Boolean(account.integrationConfig.widgetEmbedCode);
  }
  if (account.selectedIntegration === "phone-number") {
    return Boolean(account.integrationConfig.inboundPhoneNumber);
  }
  if (account.selectedIntegration === "api-webhooks") {
    return Boolean(account.integrationConfig.webhookUrl && account.integrationConfig.webhookSecret);
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const session = await getAuthenticatedBusinessFromRequest(request);
    const body = await request.json().catch(() => ({}));

    // ─── Demo user gate ───────────────────────────────────────────────────────
    const isDemoRequest = Boolean(body.isDemoCall);
    if (isDemoRequest) {
      const demoCookie = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
      const demoSession = await getDemoSession(demoCookie);

      if (demoSession?.hasUsedDemo && !demoSession.subscribed) {
        return NextResponse.json(
          { error: "Your shared 60-second demo window has been used. Please subscribe to continue." },
          { status: 403 }
        );
      }

      // ── IP + fingerprint identity check (independent of account) ──────────
      // This prevents a user from creating a new account to claim another demo
      // window after closing the browser or using a private/incognito tab.
      if (!demoSession?.subscribed) {
        const ip = getRequestIp(request);
        const fingerprint = String(body.fingerprint || "");
        const identityHash = buildIdentityHash(ip, fingerprint);

        const trialStatus = await getTrialWindowStatus(identityHash);
        if (trialStatus.isBlocked) {
          if (demoSession && !demoSession.hasUsedDemo) {
            await markDemoUsed(demoSession.userId);
          }
          return NextResponse.json(
            { error: "This device has already used the shared 60-second demo window. Please subscribe to continue." },
            { status: 403 }
          );
        }

        await startOrResumeTrialWindow(identityHash, ip);
      }
      // ─────────────────────────────────────────────────────────────────────
    }
    // ─────────────────────────────────────────────────────────────────────────

    const requestedTenantId = String(body.tenantId || request.nextUrl.searchParams.get("tenantId") || "") || undefined;
    const account = requestedTenantId ? await getBusinessAccountByTenantId(requestedTenantId) : null;
    if (account) {
      const billingReady = account.subscriptionStatus === "trialing" || account.subscriptionStatus === "active";
      const integrationReady = isIntegrationReadyForAccount(account);

      if (!billingReady || !integrationReady) {
        return NextResponse.json(
          {
            error:
              "Live routing is not enabled for this business yet. Complete billing activation and integration setup first.",
            setupRequired: true,
            subscriptionStatus: account.subscriptionStatus,
            selectedIntegration: account.selectedIntegration,
          },
          { status: 403 }
        );
      }
    }
    const fallbackTenant = resolveTenantConfig(requestedTenantId);
    const selectedTenantId = requestedTenantId || session?.tenantId || account?.tenantId || fallbackTenant.id;
    const selectedBusinessName = requestedTenantId
      ? account?.businessName || fallbackTenant.name
      : session?.businessName || account?.businessName || fallbackTenant.name;
    const selectedBusinessModelId = requestedTenantId
      ? account?.businessModelId || fallbackTenant.businessModelId
      : session?.businessModelId || account?.businessModelId || fallbackTenant.businessModelId;
    const tenant = await getEffectiveBusinessWorkspace({
      tenantId: selectedTenantId,
      businessName: selectedBusinessName,
      businessModelId: selectedBusinessModelId,
    });
    const routedDepartmentId = String(body.routedDepartmentId || "");
    const routedDepartment = tenant.departments.find((department) => department.id === routedDepartmentId) || null;
    const routingSource = String(body.routingSource || "front-door");
    const routingRationale = String(body.routingRationale || "");
    const callerName = String(body.callerName || "caller");
    const callReason = String(body.callReason || "");
    const requestedFrontDoorVoice = resolveLeadVoiceForTenant(tenant);
    const frontDoorVoice = normalizeRealtimeVoice(requestedFrontDoorVoice);
    const completionDirective = getTaskCompletionDirectiveForTenant(tenant);
    const closingLine = getCallClosingLineForTenant(tenant);

    if (frontDoorVoice !== requestedFrontDoorVoice) {
      console.warn(
        `Invalid realtime voice '${requestedFrontDoorVoice}' for tenant ${tenant.id}. Falling back to '${frontDoorVoice}'.`
      );
    }

    const baseInstructions = buildDepartmentRoutingInstructions(tenant);
    const realtimeInstructions = `${baseInstructions}\n\nResponse length policy:\n- Keep each response brief and direct.\n- Default reply length: 1 short sentence (max 18 words).\n- If needed for clarity: up to 2 short sentences (max 30 words total).\n- Ask one question at a time.\n- Stop speaking once the key point is delivered.\n\nTask completion protocol:\n- Goal for every call: complete the caller's operational task, not conversation quality.\n- Sequence: verify -> classify -> collect minimum required details -> execute next step -> confirm outcome -> close.\n- Verification is one-time only at the start of the call.\n- After verification is complete, do not ask for identity verification again unless the caller clearly starts a new unrelated request.\n- After verification, target completion within 4 agent turns for standard requests.\n- If caller already gave sufficient details, skip questions and move straight to confirmation/action.\n- As soon as the caller states the reason for calling, follow this business directive immediately: ${completionDirective}\n- Never continue chatting after outcome confirmation unless the caller asks a new task.\n- When the request is completed, end with this exact closing line: "${closingLine}"\n- After saying the closing line, stop immediately and do not ask any additional questions.\n\nSingle-agent mode is active:\n- Do not transfer the caller to another agent or team.\n- Do not announce handoffs, escalation transfers, or specialist transfers.\n- Stay as one continuous agent for ${tenant.name} and resolve requests in one script whenever possible.\n- If escalation is needed, collect required details and log the escalation path internally, but continue speaking as the same agent.\n- Caller name: ${callerName}.\n- Initial reason captured before answer: ${callReason || "No structured reason captured."}${
      routedDepartment
        ? `\n- Department hint captured pre-answer: ${routedDepartment.name} (${routedDepartment.agentName}).`
        : ""
    }\n- Routing source metadata: ${routingSource}.\n- Routing rationale metadata: ${routingRationale || "No additional rationale captured."}`;

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: realtimeInstructions,
          output_modalities: ["audio"],
          audio: {
            input: {
              transcription: {
                model: "gpt-4o-mini-transcribe",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 700,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: frontDoorVoice,
              speed: 1.03,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create realtime session:", errorText);

      return NextResponse.json(
        { error: "Failed to create realtime session", details: errorText },
        { status: response.status }
      );
    }

    const sessionData = await response.json();
    return NextResponse.json({ ...sessionData, tenant, routedDepartment, routingSource, routingRationale });
  } catch (error) {
    console.error("Realtime session route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}