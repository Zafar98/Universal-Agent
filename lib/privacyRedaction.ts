import { CallLog, CallTranscriptEntry } from "@/lib/callLogStore";

export interface RedactionOptions {
  businessModelId?: string;
  summaryWordLimit?: number;
}

function getSummaryWordLimit(input?: number): number {
  const envLimit = Number.parseInt(process.env.EXTERNAL_TRANSCRIPT_SUMMARY_WORD_LIMIT || "150", 10);
  const value = input || envLimit;
  if (!Number.isFinite(value) || value <= 0) {
    return 150;
  }
  return Math.min(400, value);
}

function maskName(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return "";
  }
  return "[REDACTED_NAME]";
}

function maskPhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 4) {
    return "";
  }
  return `***-***-${digits.slice(-4)}`;
}

export function redactPIIText(raw: string, options?: RedactionOptions): string {
  let text = String(raw || "");

  text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
  text = text.replace(/(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g, "[REDACTED_PHONE]");
  text = text.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_FINANCIAL]");
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_ID]");

  // Common account/policy style identifiers
  text = text.replace(
    /\b(policy|claim|account|invoice|billing|member|patient|reference|mrn|nhs)\s*(number|id|ref)?\s*[:#-]?\s*([a-z0-9-]{5,})\b/gi,
    "$1 $2: [REDACTED_IDENTIFIER]"
  );

  // Date of birth patterns
  text = text.replace(/\b(?:dob|date\s*of\s*birth)\s*[:#-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi, "DOB: [REDACTED_DOB]");

  const isHealthcare = (options?.businessModelId || "").toLowerCase() === "healthcare";
  const strictHealthcare = String(process.env.ENABLE_STRICT_HEALTHCARE_REDACTION || "true").toLowerCase() !== "false";

  if (isHealthcare && strictHealthcare) {
    text = text.replace(
      /\b(diagnosis|condition|medication|prescription|symptom|allergy|treatment|insurance|insurer)\b\s*[:#-]?\s*([^,.\n]{2,120})/gi,
      "$1: [REDACTED_MEDICAL]"
    );
  }

  return text;
}

export function summarizeTranscriptForExternal(
  transcript: CallTranscriptEntry[],
  options?: RedactionOptions
): string {
  const cleaned = (transcript || [])
    .filter((entry) => entry.speaker === "user")
    .map((entry) => redactPIIText(entry.text, options).trim())
    .filter(Boolean)
    .join(" ");

  if (!cleaned) {
    return "Caller connected but provided limited actionable details.";
  }

  const words = cleaned.split(/\s+/);
  const capped = words.slice(0, getSummaryWordLimit(options?.summaryWordLimit));
  return capped.join(" ");
}

function redactTranscript(transcript: CallTranscriptEntry[], options?: RedactionOptions): CallTranscriptEntry[] {
  return (transcript || []).map((entry) => ({
    ...entry,
    text: redactPIIText(entry.text, options),
  }));
}

function redactRecordValues(
  record: Record<string, string | string[] | undefined> | null | undefined,
  options?: RedactionOptions
): Record<string, string | string[] | undefined> {
  if (!record) {
    return {};
  }

  const output: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      output[key] = value.map((item) => redactPIIText(String(item), options));
      continue;
    }
    output[key] = value ? redactPIIText(String(value), options) : value;
  }

  return output;
}

export function buildExternalSafeCallPayload(log: CallLog, options?: RedactionOptions) {
  const redactedTranscript = redactTranscript(log.transcript, options);
  const transcriptSummary = summarizeTranscriptForExternal(log.transcript, options);

  return {
    id: log.id,
    ticketId: log.ticketId,
    sessionId: log.sessionId,
    tenantId: log.tenantId,
    tenantName: log.tenantName,
    startedAt: log.startedAt,
    endedAt: log.endedAt,
    durationSeconds: log.durationSeconds,
    issueType: log.issueType,
    urgency: log.urgency,
    businessUnit: log.businessUnit,
    departmentId: log.departmentId,
    departmentName: log.departmentName,
    detectedEmotion: log.detectedEmotion,
    handoffRecommended: log.handoffRecommended,
    workflowStatus: log.workflowStatus,
    workflowCallType: log.workflowCallType,
    callerName: maskName(log.callerName),
    callerPhone: maskPhone(log.callerPhone),
    summary: redactPIIText(log.summary, options),
    transcriptSummary,
    transcript: redactedTranscript,
    handoffPayload: redactRecordValues(log.handoffPayload, options),
    caseData: redactRecordValues(log.caseData, options),
  };
}
