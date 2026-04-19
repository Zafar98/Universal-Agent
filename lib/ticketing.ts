import { CallLog } from "@/lib/callLogStore";

function hasZendeskConfig(): boolean {
  return Boolean(
    process.env.ZENDESK_SUBDOMAIN &&
      process.env.ZENDESK_EMAIL &&
      process.env.ZENDESK_API_TOKEN
  );
}

function getZendeskAuthHeader(): string {
  const email = process.env.ZENDESK_EMAIL!;
  const apiToken = process.env.ZENDESK_API_TOKEN!;
  return Buffer.from(`${email}/token:${apiToken}`).toString("base64");
}

export type ExternalTicketStatus = "open" | "pending" | "solved" | "unknown";

export async function createExternalTicket(callLog: CallLog): Promise<string> {
  if (!hasZendeskConfig()) {
    return callLog.ticketId;
  }

  const subdomain = process.env.ZENDESK_SUBDOMAIN!;
  const authHeader = getZendeskAuthHeader();

  const payload = {
    ticket: {
      subject: `[${callLog.businessUnit}] ${callLog.issueType.toUpperCase()} | ${callLog.urgency.toUpperCase()} urgency`,
      comment: {
        body: `Call summary: ${callLog.summary}\n\nSession: ${callLog.sessionId}\nDuration: ${callLog.durationSeconds}s\nIssue: ${callLog.issueType}\nUrgency: ${callLog.urgency}\nBusiness Unit: ${callLog.businessUnit}`,
      },
      priority:
        callLog.urgency === "high"
          ? "high"
          : callLog.urgency === "medium"
            ? "normal"
            : "low",
      tags: ["voice-agent", "auto-ticket", callLog.issueType, callLog.businessUnit.toLowerCase().replace(/\s+/g, "-")],
    },
  };

  const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Zendesk ticket creation failed:", text);
    return callLog.ticketId;
  }

  const data = await response.json();
  const zendeskId = data?.ticket?.id;
  return zendeskId ? `ZD-${zendeskId}` : callLog.ticketId;
}

export async function fetchExternalTicketStatus(ticketId: string): Promise<ExternalTicketStatus> {
  if (!hasZendeskConfig()) {
    return "unknown";
  }

  const match = ticketId.match(/^ZD-(\d+)$/);
  if (!match) {
    return "unknown";
  }

  const subdomain = process.env.ZENDESK_SUBDOMAIN!;
  const authHeader = getZendeskAuthHeader();

  const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets/${match[1]}.json`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return "unknown";
  }

  const data = await response.json();
  const status = String(data?.ticket?.status || "").toLowerCase();

  if (status === "open" || status === "new") {
    return "open";
  }

  if (status === "pending" || status === "hold") {
    return "pending";
  }

  if (status === "solved" || status === "closed") {
    return "solved";
  }

  return "unknown";
}
