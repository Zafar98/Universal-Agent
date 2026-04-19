import { StaffMember } from "@/lib/staffAssignmentStore";

export type NotificationChannel = "email" | "sms" | "slack" | "webhook";

export type NotificationTemplate = {
  channel: NotificationChannel;
  subject?: string;
  body: string;
};

export type HandoffNotificationPayload = {
  handoffId: string;
  department: string;
  priority: string;
  issueType: string;
  callerName: string;
  callerPhone: string;
  urgency: string;
  summary: string;
  dashboardUrl: string;
};

function buildEmailContent(payload: HandoffNotificationPayload): { subject: string; body: string } {
  const urgencyBadge = payload.urgency === "high" ? "🚨 URGENT" : payload.priority === "urgent" ? "⚠️ PRIORITY" : "ℹ️ Standard";

  const subject = `${urgencyBadge} New Escalation: ${payload.department} - ${payload.issueType}`;

  const body = `
New Handoff Assignment
========================

Priority: ${urgencyBadge}
Department: ${payload.department}
Issue Type: ${payload.issueType}
Caller: ${payload.callerName} (${payload.callerPhone})

Issue Summary:
${payload.summary}

---
View in Dashboard: ${payload.dashboardUrl}
Handoff ID: ${payload.handoffId}

Please take action as soon as possible.
  `.trim();

  return { subject, body };
}

function buildSlackContent(payload: HandoffNotificationPayload): string {
  const urgencyEmoji = payload.urgency === "high" ? "🚨" : payload.priority === "urgent" ? "⚠️" : "ℹ️";

  return `${urgencyEmoji} *New Handoff* | ${payload.department}
*Caller:* ${payload.callerName} (${payload.callerPhone})
*Issue:* ${payload.issueType}
*Urgency:* ${payload.urgency}
*Summary:* ${payload.summary}
<${payload.dashboardUrl}|View Details>`;
}

function buildSMSContent(payload: HandoffNotificationPayload): string {
  const urgencyPrefix = payload.urgency === "high" ? "[URGENT] " : "";
  return `${urgencyPrefix}New escalation: ${payload.department}. Caller: ${payload.callerName}. ${payload.summary.substring(0, 80)}...`. substring(0, 160);
}

export function buildNotificationContent(
  channel: NotificationChannel,
  payload: HandoffNotificationPayload
): NotificationTemplate {
  switch (channel) {
    case "email":
      const { subject, body } = buildEmailContent(payload);
      return { channel: "email", subject, body };

    case "slack":
      return { channel: "slack", body: buildSlackContent(payload) };

    case "sms":
      return { channel: "sms", body: buildSMSContent(payload) };

    case "webhook":
      return { channel: "webhook", body: JSON.stringify(payload) };

    default:
      return { channel, body: "" };
  }
}

export async function sendNotification(
  staff: StaffMember,
  payload: HandoffNotificationPayload,
  channels: NotificationChannel[] = ["email"]
): Promise<{ sent: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const channel of channels) {
    try {
      const notification = buildNotificationContent(channel, payload);

      switch (channel) {
        case "email":
          if (!staff.email) {
            errors.push("No email address for staff member");
            continue;
          }
          await sendEmailNotification(staff.email, notification.subject || "", notification.body);
          break;

        case "sms":
          if (!staff.phone) {
            errors.push("No phone number for staff member");
            continue;
          }
          await sendSMSNotification(staff.phone, notification.body);
          break;

        case "slack":
          await sendSlackNotification(payload.dashboardUrl, notification.body);
          break;

        case "webhook":
          const webhookUrl = process.env.HANDOFF_WEBHOOK_URL;
          if (webhookUrl) {
            await sendWebhookNotification(webhookUrl, JSON.parse(notification.body));
          }
          break;
      }
    } catch (error) {
      errors.push(`${channel}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    sent: errors.length === 0,
    errors,
  };
}

async function sendEmailNotification(to: string, subject: string, body: string): Promise<void> {
  const EmailService = (await import("@/lib/emailService")).default;
  await EmailService.send({
    to,
    subject,
    html: `<pre style="font-family: monospace; white-space: pre-wrap;">${body}</pre>`,
  });
}

async function sendSMSNotification(phone: string, message: string): Promise<void> {
  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;

  if (!smsApiUrl || !smsApiKey) {
    console.warn("SMS API not configured; skipping SMS notification");
    return;
  }

  await fetch(smsApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${smsApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: phone,
      message,
    }),
  });
}

async function sendSlackNotification(channelOrUrl: string, message: string): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || channelOrUrl;

  if (!slackWebhookUrl) {
    console.warn("Slack webhook not configured; skipping Slack notification");
    return;
  }

  await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: message,
    }),
  });
}

async function sendWebhookNotification(webhookUrl: string, payload: unknown): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
