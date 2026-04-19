/**
 * Post-Call Actions
 *
 * Everything that should happen automatically after a call ends:
 *  1. Outbound webhook delivery to the business's configured endpoint (HMAC-signed)
 *  2. Caller follow-up notification (SMS / email) with outcome summary
 *  3. Staff / contractor urgent alert when urgency === "high"
 */

import crypto from "crypto";
import nodemailer from "nodemailer";
import { CallLog } from "@/lib/callLogStore";
import { IntegrationConfig } from "@/lib/businessAuthStore";
import { buildExternalSafeCallPayload } from "@/lib/privacyRedaction";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function canSendEmail(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USERNAME &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM_EMAIL
  );
}

function buildEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function buildHmacSignature(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function urgencyLabel(urgency: CallLog["urgency"]): string {
  return urgency === "high" ? "🔴 Urgent" : urgency === "medium" ? "🟡 Medium" : "🟢 Low";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── 1. Outbound Webhook Delivery ────────────────────────────────────────────

export interface WebhookDeliveryResult {
  delivered: boolean;
  statusCode?: number;
  error?: string;
}

export async function deliverCallWebhook(
  integrationConfig: IntegrationConfig,
  log: CallLog,
  businessModelId?: string
): Promise<WebhookDeliveryResult> {
  const { webhookUrl, webhookSecret } = integrationConfig;

  if (!webhookUrl) {
    return { delivered: false, error: "No webhook URL configured" };
  }

  const payload = {
    event: "call.completed",
    timestamp: new Date().toISOString(),
    call: buildExternalSafeCallPayload(log, { businessModelId }),
  };

  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "UniversalAgent/1.0",
    "X-UA-Event": "call.completed",
    "X-UA-Delivery-ID": crypto.randomUUID(),
    "X-UA-Timestamp": payload.timestamp,
  };

  if (webhookSecret) {
    headers["X-UA-Signature"] = `sha256=${buildHmacSignature(webhookSecret, body)}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });

    return {
      delivered: response.ok,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[postCallActions] Webhook delivery failed:", message);
    return { delivered: false, error: message };
  }
}

// ─── 2. Caller Follow-up Notification ────────────────────────────────────────

export interface CallerNotificationResult {
  sent: boolean;
  channel: "email" | "sms" | "skipped";
  reason?: string;
}

export async function notifyCaller(
  log: CallLog,
  businessEmail?: string | null
): Promise<CallerNotificationResult> {
  const hasEmail = Boolean(log.callerPhone === "" && businessEmail && canSendEmail());
  // For now we send to the business email as a stand-in for caller follow-up
  // until a real caller email/phone field is captured during the call
  const recipientEmail = businessEmail || process.env.SMTP_FROM_EMAIL;

  if (!canSendEmail() || !recipientEmail) {
    return { sent: false, channel: "skipped", reason: "Email not configured" };
  }

  const subject = `Your call has been logged — ${log.workflowCallType || log.issueType}`;
  const body = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
      <h2 style="color:#0369a1">Your call has been logged</h2>
      <p>Thank you for calling <strong>${log.tenantName}</strong>. Here's a summary of your call:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Reference</td><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${log.ticketId}</strong></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Issue type</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${log.issueType}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Department</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${log.departmentName}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Status</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${log.workflowStatus.replace(/_/g, " ")}</td></tr>
        <tr><td style="padding:8px;color:#64748b">Duration</td><td style="padding:8px">${formatDuration(log.durationSeconds)}</td></tr>
      </table>
      <p style="color:#475569"><strong>Summary:</strong> ${log.summary}</p>
      <p style="color:#94a3b8;font-size:13px">Keep your reference number <strong>${log.ticketId}</strong> for any follow-up queries.</p>
    </div>
  `;

  try {
    const transporter = buildEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: recipientEmail,
      subject,
      html: body,
      text: `Your call has been logged.\n\nReference: ${log.ticketId}\nIssue: ${log.issueType}\nDepartment: ${log.departmentName}\nStatus: ${log.workflowStatus}\nSummary: ${log.summary}`,
    });
    return { sent: true, channel: "email" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[postCallActions] Caller notification failed:", message);
    return { sent: false, channel: "email", reason: message };
  }
}

// ─── 3. Staff / Contractor Urgent Alert ──────────────────────────────────────

export interface StaffAlertResult {
  sent: boolean;
  channel: "email" | "webhook" | "skipped";
  reason?: string;
}

export async function alertStaffIfUrgent(
  log: CallLog,
  staffEmail: string | null | undefined,
  staffAlertWebhookUrl: string | null | undefined
): Promise<StaffAlertResult> {
  if (log.urgency !== "high" && !log.handoffRecommended) {
    return { sent: false, channel: "skipped", reason: "Not urgent, no alert needed" };
  }

  // Try webhook alert first (faster for Slack, Teams, PagerDuty etc.)
  if (staffAlertWebhookUrl) {
    const payload = {
      text: `${urgencyLabel(log.urgency)} — New call requires attention`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${urgencyLabel(log.urgency)} Call Alert — ${log.tenantName}*\n\n*Issue:* ${log.issueType} | *Department:* ${log.departmentName}\n*Caller:* ${log.callerName || "Unknown"} ${log.callerPhone ? `(${log.callerPhone})` : ""}\n*Emotion:* ${log.detectedEmotion}\n*Handoff needed:* ${log.handoffRecommended ? "Yes" : "No"}\n*Ticket:* ${log.ticketId}\n\n${log.summary}`,
          },
        },
      ],
    };

    try {
      const response = await fetch(staffAlertWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8_000),
      });

      if (response.ok) {
        return { sent: true, channel: "webhook" };
      }
    } catch {
      // Fall through to email
    }
  }

  // Fall back to email
  if (staffEmail && canSendEmail()) {
    const subject = `${urgencyLabel(log.urgency)} Call Alert — ${log.tenantName} | ${log.ticketId}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
        <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:16px;border-radius:4px;margin-bottom:16px">
          <strong style="color:#dc2626">${urgencyLabel(log.urgency)} — Immediate attention may be required</strong>
        </div>
        <h2 style="margin:0 0 16px">Call Alert — ${log.tenantName}</h2>
        <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;width:40%">Ticket</td><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${log.ticketId}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Issue type</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${log.issueType}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Department</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${log.departmentName}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Urgency</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${log.urgency}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Caller Emotion</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${log.detectedEmotion}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Handoff needed</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${log.handoffRecommended ? "Yes" : "No"}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Caller</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${log.callerName || "Unknown"} ${log.callerPhone ? `· ${log.callerPhone}` : ""}</td></tr>
          <tr><td style="padding:8px;color:#64748b">Duration</td><td style="padding:8px">${formatDuration(log.durationSeconds)}</td></tr>
        </table>
        <p><strong>Summary:</strong> ${log.summary}</p>
        ${log.handoffPayload && Object.keys(log.handoffPayload).length > 0 ? `
          <p><strong>Handoff details:</strong></p>
          <ul>${Object.entries(log.handoffPayload).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join("")}</ul>
        ` : ""}
        <p><strong>Transcript:</strong></p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:12px;font-size:13px">
          ${log.transcript.map((t) => `<p style="margin:4px 0"><strong style="color:${t.speaker === "agent" ? "#059669" : "#0369a1"}">${t.speaker === "agent" ? "Agent" : "Caller"}:</strong> ${t.text}</p>`).join("")}
        </div>
      </div>
    `;

    try {
      const transporter = buildEmailTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: staffEmail,
        subject,
        html,
        text: `URGENT CALL ALERT\nTicket: ${log.ticketId}\nIssue: ${log.issueType}\nUrgency: ${log.urgency}\nCaller: ${log.callerName} ${log.callerPhone}\nSummary: ${log.summary}`,
      });
      return { sent: true, channel: "email" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[postCallActions] Staff alert failed:", message);
      return { sent: false, channel: "email", reason: message };
    }
  }

  return { sent: false, channel: "skipped", reason: "No staff contact configured" };
}

// ─── 4. Missed Call Callback Scheduler ───────────────────────────────────────

export interface CallbackScheduleResult {
  scheduled: boolean;
  reason?: string;
}

export async function scheduleCallbackIfNeeded(
  log: CallLog,
  staffAlertWebhookUrl: string | null | undefined,
  staffEmail: string | null | undefined
): Promise<CallbackScheduleResult> {
  // Trigger callback scheduling if handoff is recommended and caller has a phone number
  if (!log.handoffRecommended || !log.callerPhone) {
    return { scheduled: false, reason: "Callback not needed or no caller phone" };
  }

  const callbackPayload = {
    event: "callback.requested",
    timestamp: new Date().toISOString(),
    callback: {
      callerName: log.callerName,
      callerPhone: log.callerPhone,
      reason: log.summary,
      originalTicketId: log.ticketId,
      urgency: log.urgency,
      preferredDepartment: log.departmentName,
      requestedAt: new Date().toISOString(),
    },
  };

  // Send to staff webhook (Slack/Teams/etc)
  if (staffAlertWebhookUrl) {
    try {
      const response = await fetch(staffAlertWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📞 Callback Requested`,
          attachments: [
            {
              color: "warning",
              fields: [
                { title: "Caller", value: `${log.callerName || "Unknown"} — ${log.callerPhone}`, short: true },
                { title: "Department", value: log.departmentName, short: true },
                { title: "Reason", value: log.summary, short: false },
                { title: "Ticket", value: log.ticketId, short: true },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (response.ok) return { scheduled: true };
    } catch {
      // Fall through
    }
  }

  // Email fallback
  if (staffEmail && canSendEmail()) {
    try {
      const transporter = buildEmailTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: staffEmail,
        subject: `📞 Callback Requested — ${log.callerName || log.callerPhone} | ${log.ticketId}`,
        text: `A callback has been requested.\n\nCaller: ${log.callerName || "Unknown"}\nPhone: ${log.callerPhone}\nReason: ${log.summary}\nTicket: ${log.ticketId}\nDepartment: ${log.departmentName}`,
        html: `<div style="font-family:Arial,sans-serif"><h2>📞 Callback Requested</h2><p><strong>Caller:</strong> ${log.callerName || "Unknown"} — <a href="tel:${log.callerPhone}">${log.callerPhone}</a></p><p><strong>Reason:</strong> ${log.summary}</p><p><strong>Ticket:</strong> ${log.ticketId}</p><p><strong>Department:</strong> ${log.departmentName}</p></div>`,
      });
      return { scheduled: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { scheduled: false, reason: message };
    }
  }

  // Log the payload regardless so it's available in system logs
  console.info("[postCallActions] Callback payload (no delivery channel):", JSON.stringify(callbackPayload));
  return { scheduled: false, reason: "No delivery channel configured" };
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface PostCallActionResults {
  webhook: WebhookDeliveryResult | null;
  callerNotification: CallerNotificationResult | null;
  staffAlert: StaffAlertResult | null;
  callbackScheduled: CallbackScheduleResult | null;
}

export async function runPostCallActions(options: {
  log: CallLog;
  integrationConfig?: IntegrationConfig;
  businessModelId?: string;
  businessEmail?: string | null;
  staffEmail?: string | null;
  staffAlertWebhookUrl?: string | null;
}): Promise<PostCallActionResults> {
  const { log, integrationConfig, businessModelId, businessEmail, staffEmail, staffAlertWebhookUrl } = options;

  const [webhook, callerNotification, staffAlert, callbackScheduled] = await Promise.allSettled([
    integrationConfig ? deliverCallWebhook(integrationConfig, log, businessModelId) : Promise.resolve(null),
    notifyCaller(log, businessEmail),
    alertStaffIfUrgent(log, staffEmail, staffAlertWebhookUrl),
    scheduleCallbackIfNeeded(log, staffAlertWebhookUrl, staffEmail),
  ]);

  const results: PostCallActionResults = {
    webhook: webhook.status === "fulfilled" ? webhook.value : null,
    callerNotification: callerNotification.status === "fulfilled" ? callerNotification.value : null,
    staffAlert: staffAlert.status === "fulfilled" ? staffAlert.value : null,
    callbackScheduled: callbackScheduled.status === "fulfilled" ? callbackScheduled.value : null,
  };

  console.info("[postCallActions] Results for", log.ticketId, JSON.stringify(results));
  return results;
}
