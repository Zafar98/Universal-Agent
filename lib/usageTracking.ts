/**
 * Integration helpers for recording usage in realtime call operations
 */

import { recordUsageEvent } from "@/lib/usageTrackingStore";
import { validateVoiceCall, validateVoiceMinutes } from "@/lib/usageValidation";

/**
 * Record a voice call start
 */
export async function recordCallStart(businessId: string, tenantId: string, metadata?: Record<string, any>) {
  return await recordUsageEvent(
    businessId,
    tenantId,
    "voice_calls",
    1,
    "call_start",
    0,
    { ...metadata, recordedAt: new Date().toISOString() }
  );
}

/**
 * Record call end with duration
 */
export async function recordCallEnd(
  businessId: string,
  tenantId: string,
  durationMinutes: number,
  metadata?: Record<string, any>
) {
  // Record the minutes used
  const result = await recordUsageEvent(
    businessId,
    tenantId,
    "voice_minutes",
    Math.ceil(durationMinutes),
    "call_end",
    0,
    { ...metadata, duration: durationMinutes, recordedAt: new Date().toISOString() }
  );

  return result;
}

/**
 * Record an email sent
 */
export async function recordEmailSent(
  businessId: string,
  tenantId: string,
  overageCharge?: number,
  metadata?: Record<string, any>
) {
  return await recordUsageEvent(
    businessId,
    tenantId,
    "emails",
    1,
    "email_sent",
    overageCharge,
    { ...metadata, recordedAt: new Date().toISOString() }
  );
}

/**
 * Record an SMS sent
 */
export async function recordSmsSent(
  businessId: string,
  tenantId: string,
  overageCharge?: number,
  metadata?: Record<string, any>
) {
  return await recordUsageEvent(
    businessId,
    tenantId,
    "sms_messages",
    1,
    "sms_sent",
    overageCharge,
    { ...metadata, recordedAt: new Date().toISOString() }
  );
}
