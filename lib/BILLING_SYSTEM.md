/**
 * Billing System Overview & Integration Guide
 * 
 * This document outlines the complete usage-based billing system for the platform.
 * All customers are charged based on their plan tier and usage of calls, emails, and SMS.
 */

/**
 * PRICING TIERS
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ STARTER - £399/month                                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Features:                                                                   │
 * │  • Email-only automation (500 emails/month included)                        │
 * │  • Shared inbox monitoring                                                  │
 * │  • Auto-drafted and sent responses                                          │
 * │  • Email support                                                            │
 * │                                                                             │
 * │ Included Limits:                                                            │
 * │  • Email: 500/month (£0.50 per additional)                                 │
 * │  • Voice Calls: 0 (not available)                                          │
 * │  • SMS: 0 (not available)                                                  │
 * │  • Overage charges apply automatically to excess emails                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ GROWTH - £599/month                                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Features:                                                                   │
 * │  • Full voice + email + SMS automation                                      │
 * │  • Up to 3 business lines                                                   │
 * │  • Advanced routing                                                         │
 * │  • Website widget                                                           │
 * │  • Phone number provisioning                                                │
 * │  • Priority support                                                         │
 * │                                                                             │
 * │ Included Limits (per month):                                                │
 * │  • Calls: 300 (£1.50 per additional)                                       │
 * │  • Minutes: 1,000 (£0.10 per additional)                                   │
 * │  • Emails: 2,000 (£0.25 per additional)                                    │
 * │  • SMS: 500 (£0.15 per additional)                                         │
 * │  • Overage charges calculated and billed monthly                           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ ENTERPRISE - £999/month                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Features:                                                                   │
 * │  • Everything in Growth                                                     │
 * │  • Multi-site deployment                                                    │
 * │  • API & webhooks                                                           │
 * │  • Dedicated support                                                        │
 * │  • Custom integrations                                                      │
 * │  • SLA guarantees                                                           │
 * │                                                                             │
 * │ Included Limits (per month):                                                │
 * │  • Calls: 1,000 (£0.75 per additional - discounted)                        │
 * │  • Minutes: 5,000 (£0.05 per additional - discounted)                      │
 * │  • Emails: 10,000 (£0.10 per additional)                                   │
 * │  • SMS: 2,000 (£0.08 per additional - discounted)                          │
 * │  • Overage charges calculated and billed monthly                           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * INTEGRATION POINTS
 * 
 * 1. VOICE CALLS
 *    - Location: /app/api/realtime/session/route.ts
 *    - Validation: validateVoiceCall() called before session creation
 *    - Tracking: recordCallStart() + recordCallEnd(durationMinutes)
 *    - Overage: Applied if call count or minutes exceed plan limits
 * 
 * 2. EMAILS
 *    - Location: (email sending service)
 *    - Validation: validateEmailSend() before sending
 *    - Tracking: recordEmailSent() with overage charge
 *    - Overage: Charged per email over limit
 * 
 * 3. SMS
 *    - Location: (SMS sending service)
 *    - Validation: validateSmsSend() before sending
 *    - Tracking: recordSmsSent() with overage charge
 *    - Overage: Charged per SMS over limit
 */

/**
 * DATABASE SCHEMA
 * 
 * usage_records: Monthly usage aggregate
 *   - business_id (PK)
 *   - month (YYYY-MM) (PK)
 *   - voice_calls (INTEGER)
 *   - voice_minutes (INTEGER)
 *   - emails_sent (INTEGER)
 *   - sms_sent (INTEGER)
 *   - voice_call_overages (INTEGER)
 *   - voice_minute_overages (INTEGER)
 *   - email_overages (INTEGER)
 *   - sms_overages (INTEGER)
 *   - overage_charges (INTEGER, in pence)
 * 
 * billing_events: Audit trail of all usage
 *   - id (PK, UUID)
 *   - business_id
 *   - event_type (call_start, call_end, email_sent, sms_sent)
 *   - metric (voice_calls, voice_minutes, emails, sms_messages)
 *   - amount (quantity)
 *   - overage_charge (amount in pence if this event caused overage)
 *   - timestamp
 *   - metadata (JSONB for additional context)
 */

/**
 * API ENDPOINTS
 * 
 * GET /api/billing/usage
 *   Returns current month usage, limits, overages, and charges for authenticated business
 * 
 * POST /api/billing/check-usage
 *   Validates if a proposed usage amount would exceed limits
 *   Request: { metric, amount }
 *   Response: { allowed, withinLimit, overageAmount, overageCharge }
 * 
 * POST /api/billing/record-usage
 *   Records a usage event and calculates overage charges
 *   Request: { metric, amount, eventType, metadata }
 *   Response: { ok, event, usage, overage }
 * 
 * GET /api/billing/history?month=2024-01
 *   Gets billing history and events for a specific month
 */

/**
 * CLIENT FEATURES
 * 
 * Pages:
 * - /billing: Main billing dashboard showing current usage, limits, overages
 * - /subscription: Subscription selection page with all plan details
 * 
 * Components:
 * - UsageDashboard: Displays usage metrics with progress bars and overage warnings
 * 
 * Hooks:
 * - useUsage: (recommended) Hook to fetch and cache usage data
 */

/**
 * WORKFLOW: User Makes a Call
 * 
 * 1. User initiates call via website widget
 * 2. Client calls POST /api/realtime/session with tenantId
 * 3. Server fetches account and validates subscription status
 * 4. Server calls validateVoiceCall(tenantId) 
 *    - If starter plan: reject with 403
 *    - If over limit: reject with 429 or allow with overage notification
 * 5. If validation passes, create OpenAI realtime session
 * 6. Return client token to user
 * 7. Client initiates audio stream
 * 8. When call ends, client should notify server of duration
 * 9. Server calls recordCallEnd(businessId, tenantId, durationMinutes)
 * 10. Usage updated and overage charges calculated if needed
 */

/**
 * WORKFLOW: Monthly Billing Cycle
 * 
 * Start of Month (Day 1):
 * - usage_records table still has previous month's data
 * - New month can be created when first usage event comes in
 * 
 * During Month:
 * - Each usage event creates billing_events record
 * - usage_records updated with running totals
 * - Overage charges accumulated as events are recorded
 * 
 * End of Month:
 * - usage_records.overage_charges = total overage charges for month
 * - Stripe invoice created for base_price + overage_charges
 * - (Future) Webhook from Stripe processes payment
 * - Next month: resetOverageCharges() can be called to clear overages
 */

/**
 * EXAMPLE SCENARIOS
 * 
 * Scenario 1: Starter Plan Email User
 * - Plan: Starter (500 emails/month)
 * - Sends: 550 emails
 * - Charged: £399 (base) + (50 × £0.50) = £424
 * 
 * Scenario 2: Growth Plan Power User
 * - Plan: Growth (300 calls, 1000 min, 2000 emails, 500 SMS)
 * - Usage: 320 calls, 1100 min, 2500 emails, 600 SMS
 * - Overages:
 *   - Calls: 20 × £1.50 = £30
 *   - Minutes: 100 × £0.10 = £10
 *   - Emails: 500 × £0.25 = £125
 *   - SMS: 100 × £0.15 = £15
 * - Charged: £599 (base) + £180 (overages) = £779
 * 
 * Scenario 3: Enterprise Plan
 * - Plan: Enterprise (1000 calls, 5000 min, 10000 emails, 2000 SMS)
 * - Usage: 1200 calls, 5500 min, 12000 emails, 2100 SMS
 * - Overages:
 *   - Calls: 200 × £0.75 = £150
 *   - Minutes: 500 × £0.05 = £25
 *   - Emails: 2000 × £0.10 = £200
 *   - SMS: 100 × £0.08 = £8
 * - Charged: £999 (base) + £383 (overages) = £1,382
 */

export const BILLING_SYSTEM_DOCUMENTED = true;
