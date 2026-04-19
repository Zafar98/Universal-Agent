import { TenantConfig } from "@/lib/tenantConfig";

export type ExtractedCaseData = {
  name?: string;
  email?: string;
  phone?: string;
  reference?: string;
  date?: string;
  time?: string;
  quantity?: string;
  itemsOrdered?: string[];
  location?: string;
  urgency?: string;
  notes?: string;
  [key: string]: string | string[] | undefined;
};

function extractNameFromTranscript(transcript: string): string | undefined {
  const match = transcript.match(
    /(?:my name is|i'm|call me|this is|speaking to|name's?|the name|it's|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  return match ? match[1].split(/\s+/)[0] : undefined;
}

function extractPhoneFromTranscript(transcript: string): string | undefined {
  const phoneMatch = transcript.match(/(?:\+?1\s?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}/);
  return phoneMatch ? phoneMatch[0] : undefined;
}

function extractEmailFromTranscript(transcript: string): string | undefined {
  const emailMatch = transcript.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : undefined;
}

function extractDateFromTranscript(transcript: string): string | undefined {
  const datePatterns = [
    /(?:for\s+)?(?:on\s+)?(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?)\s+(?:of\s+)?([a-z]+)/i,
    /([a-z]+)\s+(\d{1,2})/i,
    /(?:tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
  ];

  for (const pattern of datePatterns) {
    const match = transcript.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

function extractTimeFromTranscript(transcript: string): string | undefined {
  const timeMatch = transcript.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m|p\.m)?/i);
  return timeMatch ? timeMatch[0] : undefined;
}

function extractQuantityFromTranscript(transcript: string, keyword: string): string | undefined {
  const pattern = new RegExp(`(?:for|${keyword})\\s+([0-9]+)`, "i");
  const match = transcript.match(pattern);
  return match ? match[1] : undefined;
}

function extractItemsFromTranscript(transcript: string): string[] | undefined {
  const itemMatches = transcript.match(/(?:order|i want|i'd like|like to order)\s+(.+?)(?:\.|,|and|for)/gi);
  if (!itemMatches) return undefined;

  return itemMatches.map((m) =>
    m
      .replace(/^(?:order|i want|i'd like|like to order)\s+/i, "")
      .replace(/\s+(?:\.|,|and|for).*$/, "")
      .trim()
  );
}

function extractReferenceFromTranscript(transcript: string): string | undefined {
  const refMatch = transcript.match(
    /(?:reference|booking|reservation|order|ticket|case|confirmation|number|id)\s+(?:number|id|#)?\s*([A-Za-z0-9-]+)/i
  );
  return refMatch ? refMatch[1] : undefined;
}

function extractLocationFromTranscript(transcript: string): string | undefined {
  const locMatch = transcript.match(/(?:postcode|address|area|location|to|deliver to|at|for)\s+(.+?)(?:\.|,|$)/i);
  return locMatch ? locMatch[1].trim() : undefined;
}

function getRequiredFieldsForBusinessModel(
  tenantConfig: TenantConfig | null | undefined,
  issueType?: string
): (keyof ExtractedCaseData)[] {
  const modelId = tenantConfig?.businessModelId;

  switch (modelId) {
    case "restaurant":
      if (issueType === "reservation") return ["name", "phone", "date", "time", "quantity"];
      if (issueType === "order") return ["phone", "itemsOrdered", "location"];
      break;

    case "hotel":
      if (issueType === "reservation") return ["name", "phone", "email", "date"];
      if (issueType === "general") return ["reference", "name", "phone"];
      break;

    case "housing-association":
      return ["name", "phone", "reference", "location"];

    case "healthcare":
      if (issueType === "appointment") return ["name", "phone", "email", "date"];
      break;

    case "concierge":
      return ["reference", "name", "phone"];
  }

  return ["name", "phone"];
}

export function extractCaseDataFromTranscript(
  transcript: string,
  tenantConfig?: TenantConfig | null,
  issueType?: string
): ExtractedCaseData {
  return {
    name: extractNameFromTranscript(transcript),
    phone: extractPhoneFromTranscript(transcript),
    email: extractEmailFromTranscript(transcript),
    date: extractDateFromTranscript(transcript),
    time: extractTimeFromTranscript(transcript),
    reference: extractReferenceFromTranscript(transcript),
    quantity: extractQuantityFromTranscript(transcript, "party|people|guests|persons"),
    itemsOrdered: extractItemsFromTranscript(transcript),
    location: extractLocationFromTranscript(transcript),
  };
}

export function getCollectionCompleteness(
  caseData: ExtractedCaseData,
  tenantConfig?: TenantConfig | null,
  issueType?: string
): { complete: boolean; missing: (keyof ExtractedCaseData)[] } {
  const required = getRequiredFieldsForBusinessModel(tenantConfig, issueType);
  const missing = required.filter((field) => !caseData[field]);

  return {
    complete: missing.length === 0,
    missing,
  };
}

export function buildMissingDetailsPrompt(
  missing: (keyof ExtractedCaseData)[],
  tenantConfig?: TenantConfig | null
): string {
  if (missing.length === 0) return "";

  const friendlyNames: Record<string, string> = {
    name: "your name",
    phone: "phone number",
    email: "email address",
    date: "date",
    time: "time",
    quantity: "party size",
    itemsOrdered: "items you'd like to order",
    location: "delivery address",
    reference: "booking reference number",
  };

  const missingLabels = missing.map((f) => friendlyNames[String(f)] || String(f));
  return `Before I confirm, I just need: ${missingLabels.join(", ")}. Can you provide that?`;
}

export function buildConfirmationSummary(caseData: ExtractedCaseData, tenantConfig?: TenantConfig | null): string {
  const parts: string[] = [];

  if (caseData.name) parts.push(`Name: ${caseData.name}`);
  if (caseData.phone) parts.push(`Phone: ${caseData.phone}`);
  if (caseData.email) parts.push(`Email: ${caseData.email}`);
  if (caseData.date) parts.push(`Date: ${caseData.date}`);
  if (caseData.time) parts.push(`Time: ${caseData.time}`);
  if (caseData.quantity) parts.push(`Party size: ${caseData.quantity}`);
  if (caseData.itemsOrdered && caseData.itemsOrdered.length > 0) {
    parts.push(`Items: ${caseData.itemsOrdered.join(", ")}`);
  }
  if (caseData.reference) parts.push(`Reference: ${caseData.reference}`);
  if (caseData.location) parts.push(`Location: ${caseData.location}`);

  return parts.length > 0 ? parts.join(". ") + "." : "";
}
