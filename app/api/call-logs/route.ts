import { NextRequest, NextResponse } from "next/server";
import { callLogStore } from "@/lib/callLogStore";
import {
  ensureCallLogSchema,
  listCallLogs,
  updateCallLogWorkflow,
  upsertCallLog,
} from "@/lib/callLogRepository";
import { hasDatabaseConfig } from "@/lib/postgres";
import { createExternalTicket, fetchExternalTicketStatus } from "@/lib/ticketing";
import { buildTenantConfigFromBusiness, resolveTenantConfig } from "@/lib/tenantConfig";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";
import { runPostCallActions } from "@/lib/postCallActions";
import { getEffectiveBusinessWorkspace } from "@/lib/businessWorkspaceStore";
import { runAutonomousExecution } from "@/lib/autonomyEngine";

type RawTranscriptItem = {
  id?: string;
  speaker?: string;
  text?: string;
  timestamp?: string;
};

type AnalyticsSummary = {
  totalCalls: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  estimatedCost: number;
  byStatus: Record<string, number>;
  byIssueType: Record<string, number>;
  byTenant: Array<{
    tenantId: string;
    tenantName: string;
    calls: number;
    durationSeconds: number;
    estimatedCost: number;
  }>;
};

const ESTIMATED_COST_PER_MINUTE = 0.12;

function buildAnalytics(logs: Array<{ tenantId: string; tenantName: string; durationSeconds: number; status: string; issueType: string }>): AnalyticsSummary {
  const totalCalls = logs.length;
  const totalDurationSeconds = logs.reduce((acc, log) => acc + Number(log.durationSeconds || 0), 0);
  const avgDurationSeconds = totalCalls === 0 ? 0 : Math.round(totalDurationSeconds / totalCalls);
  const estimatedCost = Number(((totalDurationSeconds / 60) * ESTIMATED_COST_PER_MINUTE).toFixed(2));

  const byStatus: Record<string, number> = {};
  const byIssueType: Record<string, number> = {};
  const byTenantMap = new Map<string, { tenantId: string; tenantName: string; calls: number; durationSeconds: number; estimatedCost: number }>();

  for (const log of logs) {
    byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    byIssueType[log.issueType] = (byIssueType[log.issueType] || 0) + 1;

    const key = `${log.tenantId}::${log.tenantName}`;
    const current = byTenantMap.get(key) || {
      tenantId: log.tenantId,
      tenantName: log.tenantName,
      calls: 0,
      durationSeconds: 0,
      estimatedCost: 0,
    };
    current.calls += 1;
    current.durationSeconds += Number(log.durationSeconds || 0);
    current.estimatedCost = Number(((current.durationSeconds / 60) * ESTIMATED_COST_PER_MINUTE).toFixed(2));
    byTenantMap.set(key, current);
  }

  const byTenant = Array.from(byTenantMap.values()).sort((a, b) => b.calls - a.calls);

  return {
    totalCalls,
    totalDurationSeconds,
    avgDurationSeconds,
    estimatedCost,
    byStatus,
    byIssueType,
    byTenant,
  };
}

export async function GET(request: NextRequest) {
  const syncTickets = request.nextUrl.searchParams.get("syncTickets") === "1";
  const session = await getAuthenticatedBusinessFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (hasDatabaseConfig()) {
      await ensureCallLogSchema();
      let logs = await listCallLogs();

      if (session && !session.isAdmin) {
        logs = logs.filter((log) => log.tenantId === session.tenantId);
      }

      if (syncTickets) {
        logs = await Promise.all(
          logs.map(async (log) => ({
            ...log,
            ticketStatus: await fetchExternalTicketStatus(log.ticketId),
          }))
        );
      }

      return NextResponse.json({ logs, analytics: buildAnalytics(logs) });
    }
  } catch (error) {
    console.error("Call log GET database error, falling back to memory:", error);
  }

  let logs = callLogStore.list();

  if (session && !session.isAdmin) {
    logs = logs.filter((log) => log.tenantId === session.tenantId);
  }

  if (syncTickets) {
    logs = await Promise.all(
      logs.map(async (log) => ({
        ...log,
        ticketStatus: await fetchExternalTicketStatus(log.ticketId),
      }))
    );
  }

  return NextResponse.json({ logs, analytics: buildAnalytics(logs) });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedBusinessFromRequest(request);
    const body = await request.json();
    const {
      sessionId,
      startedAt,
      endedAt,
      transcript,
      tenantId,
      callerName,
      callerPhone,
      routingSource,
      routingConfidence,
      caseData,
      isDemoCall,
    } = body;

    if (!sessionId || !startedAt || !endedAt || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "sessionId, startedAt, endedAt and transcript are required" },
        { status: 400 }
      );
    }

    const tenant = session && !session.isAdmin
      ? buildTenantConfigFromBusiness({
          tenantId: session.tenantId,
          businessName: session.businessName,
          businessModelId: session.businessModelId,
        })
      : resolveTenantConfig(String(tenantId || request.headers.get("x-tenant-id") || "") || undefined);

    const normalizedTranscript = (transcript as RawTranscriptItem[]).map((item, index: number) => ({
      id: item.id || `line-${index}`,
      speaker: (item.speaker === "agent" ? "agent" : "user") as "agent" | "user",
      text: String(item.text || ""),
      timestamp: item.timestamp ? String(item.timestamp) : new Date().toISOString(),
    }));

    const createdLog = callLogStore.create({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantConfig: tenant,
      callerName: String(callerName || ""),
      callerPhone: String(callerPhone || ""),
      routingSource,
      routingConfidence,
      sessionId: String(sessionId),
      startedAt: String(startedAt),
      endedAt: String(endedAt),
      transcript: normalizedTranscript,
      caseData,
      isDemoCall: isDemoCall || false,
    });

    const externalTicketId = await createExternalTicket(createdLog);
    const log = {
      ...createdLog,
      ticketId: externalTicketId,
      ticketStatus: await fetchExternalTicketStatus(externalTicketId),
    };

    try {
      if (hasDatabaseConfig()) {
        await ensureCallLogSchema();
        await upsertCallLog(log);
      }
    } catch (dbError) {
      console.error("Call log POST database write failed, using memory fallback:", dbError);
    }

    // ─── Post-call actions (fire & forget, non-blocking) ───────────────────
    const businessAccount = await getBusinessAccountByTenantId(log.tenantId).catch(() => null);
    void runPostCallActions({
      log,
      integrationConfig: businessAccount?.integrationConfig,
      businessModelId: businessAccount?.businessModelId || tenant.businessModelId,
      businessEmail: businessAccount?.email,
      staffEmail: process.env.STAFF_ALERT_EMAIL || businessAccount?.email,
      staffAlertWebhookUrl: process.env.STAFF_ALERT_WEBHOOK_URL || null,
    });

    void (async () => {
      try {
        const workspace = await getEffectiveBusinessWorkspace({
          tenantId: log.tenantId,
          businessName: businessAccount?.businessName || tenant.name,
          businessModelId: businessAccount?.businessModelId || tenant.businessModelId,
        });

        const autonomyResult = await runAutonomousExecution({
          log,
          workspace,
        });

        console.info(
          "[autonomy] Execution result for",
          log.ticketId,
          JSON.stringify(autonomyResult)
        );
      } catch (autonomyError) {
        console.error("[autonomy] Execution failed:", autonomyError);
      }
    })();
    // ───────────────────────────────────────────────────────────────────────

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Call log POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthenticatedBusinessFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, workflowStatus, workflowCallType, handoffPayload, contractorName, contractorEta, status } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (hasDatabaseConfig()) {
      await ensureCallLogSchema();
      const updated = await updateCallLogWorkflow({
        id: String(id),
        tenantId: session.isAdmin ? undefined : session.tenantId,
        workflowStatus: workflowStatus ? String(workflowStatus) : undefined,
        workflowCallType: workflowCallType ? String(workflowCallType) : undefined,
        handoffPayload:
          handoffPayload && typeof handoffPayload === "object"
            ? (handoffPayload as Record<string, string>)
            : undefined,
        contractorName: contractorName !== undefined ? String(contractorName) : undefined,
        contractorEta: contractorEta !== undefined ? String(contractorEta) : undefined,
        status: status ? String(status) : undefined,
      });

      if (!updated) {
        return NextResponse.json({ error: "Call log not found" }, { status: 404 });
      }

      return NextResponse.json({ log: updated });
    }

    const existing = callLogStore.list().find((log) => log.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }

    if (!session.isAdmin && existing.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = callLogStore.updateWorkflow(String(id), {
      workflowStatus: workflowStatus || undefined,
      workflowCallType: workflowCallType ? String(workflowCallType) : undefined,
      handoffPayload:
        handoffPayload && typeof handoffPayload === "object"
          ? (handoffPayload as Record<string, string>)
          : undefined,
      contractorName: contractorName !== undefined ? String(contractorName) : undefined,
      contractorEta: contractorEta !== undefined ? String(contractorEta) : undefined,
      status: status || undefined,
    });

    return NextResponse.json({ log: updated });
  } catch (error) {
    console.error("Call log PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
