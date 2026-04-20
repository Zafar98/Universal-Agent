export function getOpeningLineForTenant(tenant: TenantConfig): string {
  if (tenant.businessModelId === "housing-association") {
    return "Developers Housing repairs and tenancy desk, how can I help today?";
  }

  if (tenant.businessModelId === "hotel") {
    return "Grand Harbor Hotel reservations and guest services, how may I assist you?";
  }

  if (tenant.businessModelId === "concierge") {
    return "Grand Harbor Concierge desk, what can I arrange for you now?";
  }

  if (tenant.businessModelId === "restaurant") {
    return "Sunset Bistro bookings and orders, what can I prepare for you today?";
  }

  if (tenant.businessModelId === "utilities") {
    return "City Energy support desk, how can I help with your supply or account today?";
  }

  if (tenant.businessModelId === "borough-council") {
    return "Borough Council support line, how can I help with your council service today?";
  }

  return "How can I help you today?";
}
export type BusinessModelId =
  | "housing-association"
  | "restaurant"
  | "hotel"
  | "concierge"
  | "utilities"
  | "healthcare"
  | "borough-council";

export type BusinessUnit =
  | "Repairs"
  | "Customer Care"
  | "Billing"
  | "General Support"
  | "Escalations"
  | "Reservations"
  | "Orders"
  | "Front of House"
  | "Night Concierge";

export interface AgentProfile {
  name: string;
  role: string;
  objective: string;
  voiceStyle: string;
  realtimeVoice: string;
}

export interface BusinessCallWorkflow {
  callType: string;
  tasks: string[];
  handoffPayloadFields: string[];
}

export const SUPPORTED_REALTIME_VOICES = [
  "alloy",
  "ash",
  "cedar",
  "echo",
  "marin",
  "sage",
  "verse",
] as const;

export type RealtimeVoice = (typeof SUPPORTED_REALTIME_VOICES)[number];
const BRITISH_DEFAULT_REALTIME_VOICE: RealtimeVoice = "ash";
const BRITISH_APPROVED_VOICES: ReadonlySet<RealtimeVoice> = new Set(["ash", "cedar", "marin"]);

export interface DepartmentProfile {
  id: string;
  name: string;
  agentName: string;
  purpose: string;
  queueTarget: string;
  realtimeVoice: string;
  supportedCalls: string[];
  escalationRules: string[];
}

export interface TenantConfig {
  id: string;
  name: string;
  businessModelId: BusinessModelId;
  businessModelName: string;
  overview: string;
  openingLine?: string;
  primaryBusinessUnit: BusinessUnit;
  leadAgent: AgentProfile;
  departments: DepartmentProfile[];
  workflowPlaybook: BusinessCallWorkflow[];
}

export interface BusinessModelTemplate {
  id: BusinessModelId;
  name: string;
  summary: string;
  overview: string;
  openingLine?: string;
  defaultPrimaryBusinessUnit: BusinessUnit;
  leadAgent: AgentProfile;
  departments: DepartmentProfile[];
  workflowPlaybook: BusinessCallWorkflow[];
}

const businessModelTemplates: BusinessModelTemplate[] = [
  {
    id: "housing-association",
    name: "Housing Association",
    summary:
      "Handles tenant verification, repair triage, complaints, tenancy support, and emergency escalation.",
    overview:
      "Built for housing associations that need a front-door agent to verify callers, create repair tickets, and route tenants into focused support teams.",
    defaultPrimaryBusinessUnit: "Repairs",
    leadAgent: {
      name: "Maya",
      role: "Front Door Housing Agent",
      objective:
        "Verify callers quickly, capture the problem clearly, create a ticket, and route the tenant into the correct department.",
      voiceStyle: "Warm, grounded, reassuring, practical",
      realtimeVoice: "cedar",
    },
    departments: [
      {
        id: "housing-repairs",
        name: "Repairs",
        agentName: "Reece",
        purpose:
          "Handles repairs, captures location and asset details, creates repair tickets, and prioritises emergencies.",
        queueTarget: "Repairs Desk",
        realtimeVoice: "cedar",
        supportedCalls: ["Leaks", "Heating failures", "Electrical issues", "Broken fixtures"],
        escalationRules: ["Flooding", "Electrical danger", "No heating in winter"],
      },
      {
        id: "housing-tenancy",
        name: "Tenancy Support",
        agentName: "Leah",
        purpose:
          "Handles tenancy queries, neighbour issues, move-in support, and resident account updates.",
        queueTarget: "Tenancy Team",
        realtimeVoice: "ash",
        supportedCalls: ["Tenancy questions", "Neighbour issues", "Move-in support", "Account updates"],
        escalationRules: ["Safeguarding indicators", "Anti-social behaviour reports"],
      },
      {
        id: "housing-complaints",
        name: "Complaints",
        agentName: "Nadia",
        purpose:
          "Handles service complaints, summarises dissatisfaction, and creates formal complaint cases.",
        queueTarget: "Customer Care",
        realtimeVoice: "sage",
        supportedCalls: ["Service complaints", "Missed appointments", "Follow-up dissatisfaction"],
        escalationRules: ["Repeated unresolved complaint", "Executive callback request"],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Emergency or urgent repair",
        tasks: [
          "Confirm exact location, hazard level, and immediate safety risk.",
          "Create a high-priority repair ticket with issue summary and photos requested if available.",
          "Escalate to emergency contractor queue and give ETA expectations to the tenant.",
        ],
        handoffPayloadFields: ["tenant_name", "postcode", "property_location", "hazard_level", "ticket_priority"],
      },
      {
        callType: "Routine tenancy request",
        tasks: [
          "Verify tenancy/account details before discussing account-specific information.",
          "Capture the request category and any deadlines (move-in, account update, neighbour issue).",
          "Route to tenancy support and send a concise handoff summary.",
        ],
        handoffPayloadFields: ["tenant_name", "account_reference", "request_category", "deadline", "callback_number"],
      },
      {
        callType: "Service complaint",
        tasks: [
          "Collect the complaint timeline and impacted service areas.",
          "Log desired resolution and previous contact attempts.",
          "Open a complaint case and schedule follow-up ownership.",
        ],
        handoffPayloadFields: ["tenant_name", "complaint_timeline", "previous_contact_count", "desired_resolution", "owner_team"],
      },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    summary:
      "Handles reservations, collection and delivery orders, front-of-house enquiries, and complaint recovery.",
    overview:
      "Built for restaurants that want a front-door agent to take reservations, place food orders, and keep each conversation inside the right service lane.",
    defaultPrimaryBusinessUnit: "Front of House",
    leadAgent: {
      name: "Gia",
      role: "Restaurant Reception Agent",
      objective:
        "Welcome callers, identify whether they need a reservation, order, or service support, and route them into the right department agent.",
      voiceStyle: "Friendly, brisk, polished, hospitality-led",
      realtimeVoice: "alloy",
    },
    departments: [
      {
        id: "restaurant-reservations",
        name: "Reservations",
        agentName: "Marco",
        purpose:
          "Books tables, handles party-size changes, confirms dietary notes, and manages waitlists.",
        queueTarget: "Reservations Desk",
        realtimeVoice: "alloy",
        supportedCalls: ["Table booking", "Reservation changes", "Large party booking", "Dietary requests"],
        escalationRules: ["Private dining request", "VIP booking", "Accessibility accommodation"],
      },
      {
        id: "restaurant-orders",
        name: "Orders",
        agentName: "Talia",
        purpose:
          "Takes food orders for collection or delivery, confirms address and timing, and creates order tickets.",
        queueTarget: "Kitchen Order Queue",
        realtimeVoice: "verse",
        supportedCalls: ["Delivery order", "Collection order", "Menu questions", "Order amendment"],
        escalationRules: ["Allergen concern", "Large catering order", "Payment failure"],
      },
      {
        id: "restaurant-guest-care",
        name: "Guest Care",
        agentName: "Elena",
        purpose:
          "Handles complaints, feedback, missing items, and refund follow-up without drifting into order taking.",
        queueTarget: "Guest Care",
        realtimeVoice: "sage",
        supportedCalls: ["Complaint", "Missing item", "Refund follow-up", "Service feedback"],
        escalationRules: ["Food safety concern", "Severe dissatisfaction", "Public complaint escalation"],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Table reservation or amendment",
        tasks: [
          "Collect date, time, party size, and guest name.",
          "Capture dietary and accessibility notes before confirmation.",
          "Create or update reservation and read back final details.",
        ],
        handoffPayloadFields: ["guest_name", "reservation_date", "reservation_time", "party_size", "dietary_notes"],
      },
      {
        callType: "Delivery or collection order",
        tasks: [
          "Confirm menu items, quantity, and allergen constraints.",
          "Capture fulfillment type, address, and target time window.",
          "Submit order ticket and provide order reference plus ETA.",
        ],
        handoffPayloadFields: ["guest_name", "order_items", "allergen_notes", "fulfillment_type", "address_or_pickup_time"],
      },
      {
        callType: "Guest recovery call",
        tasks: [
          "Acknowledge concern with empathy and summarize the issue clearly.",
          "Collect order or booking reference and the preferred resolution.",
          "Route to guest care lead for compensation or follow-up actions.",
        ],
        handoffPayloadFields: ["guest_name", "booking_or_order_reference", "service_issue", "preferred_resolution", "follow_up_owner"],
      },
    ],
  },
  {
    id: "hotel",
    name: "Hotel",
    summary:
      "Handles room bookings, guest services, event enquiries, and service recovery workflows.",
    overview:
      "Built for hotels that need a front-door agent to qualify booking intent, support in-stay requests, and route premium guests quickly.",
    defaultPrimaryBusinessUnit: "Front of House",
    leadAgent: {
      name: "Ava",
      role: "Hotel Reception Agent",
      objective:
        "Welcome callers, identify booking or in-stay needs, and route guests to the right specialist team with a premium service tone.",
      voiceStyle: "Polished, calm, premium hospitality",
      realtimeVoice: "echo",
    },
    departments: [
      {
        id: "hotel-reservations",
        name: "Reservations",
        agentName: "Luca",
        purpose:
          "Handles room bookings, date amendments, cancellation terms, and rate-plan guidance.",
        queueTarget: "Reservations Desk",
        realtimeVoice: "alloy",
        supportedCalls: ["Room booking", "Date change", "Cancellation policy", "Rate plan question"],
        escalationRules: ["VIP suite request", "Corporate contract rate", "Overbooking risk"],
      },
      {
        id: "hotel-guest-services",
        name: "Guest Services",
        agentName: "Noor",
        purpose:
          "Handles in-stay requests such as housekeeping, amenities, transport, and concierge support.",
        queueTarget: "Guest Services",
        realtimeVoice: "sage",
        supportedCalls: ["Housekeeping request", "Late checkout", "Transport booking", "Amenity request"],
        escalationRules: ["Security issue", "Medical assistance request", "Accessibility support"],
      },
      {
        id: "hotel-events",
        name: "Events & Groups",
        agentName: "Rina",
        purpose:
          "Handles conferences, group bookings, wedding enquiries, and event-package qualification.",
        queueTarget: "Events Sales",
        realtimeVoice: "verse",
        supportedCalls: ["Conference enquiry", "Wedding package", "Group block booking", "Corporate event"],
        escalationRules: ["High-value event", "Contract negotiation", "Urgent same-week event"],
      },
      {
        id: "hotel-night-concierge",
        name: "Night Concierge",
        agentName: "Theo",
        purpose:
          "Handles after-hours guest calls including late check-in, wake-up calls, room issues, transport, and urgent safety triage.",
        queueTarget: "Night Desk",
        realtimeVoice: "ash",
        supportedCalls: [
          "Late check-in",
          "Wake-up call",
          "Room issue or emergency maintenance",
          "Transport or taxi booking",
          "Quiet-hours noise complaint",
          "Medical or safety emergency",
        ],
        escalationRules: [
          "Medical emergency - call 999 and notify duty manager",
          "Security threat - notify duty manager and on-site security",
          "Fire or structural emergency - immediate escalation",
        ],
      },
    ],
    workflowPlaybook: [
      {
        callType: "New room booking",
        tasks: [
          "Collect stay dates, guest count, room preferences, and budget range.",
          "Confirm rate type, cancellation terms, and special requirements.",
          "Create booking hold/reservation and provide confirmation summary.",
        ],
        handoffPayloadFields: ["guest_name", "stay_dates", "guest_count", "room_type", "rate_plan"],
      },
      {
        callType: "In-stay guest request",
        tasks: [
          "Verify booking reference and active stay details.",
          "Classify request (housekeeping, maintenance, concierge, transport).",
          "Dispatch the right service team with room number and urgency.",
        ],
        handoffPayloadFields: ["guest_name", "booking_reference", "room_number", "request_type", "urgency"],
      },
      {
        callType: "Events and group enquiry",
        tasks: [
          "Capture event type, date window, attendee count, and budget.",
          "Collect required services (rooms, catering, AV, meeting spaces).",
          "Route to events specialist with a structured qualification brief.",
        ],
        handoffPayloadFields: ["contact_name", "event_type", "event_date_window", "attendee_count", "budget_range"],
      },
      {
        callType: "Night concierge request",
        tasks: [
          "Classify late-night request quickly (late check-in, wake-up call, room issue, transport, noise complaint, safety).",
          "Collect only minimum required fields: room/booking reference, request details, urgency, and timing.",
          "Action immediately or dispatch duty team; confirm exact next step and ETA; then close.",
        ],
        handoffPayloadFields: ["guest_name", "room_number", "request_type", "urgency", "action_taken"],
      },
    ],
  },
  {
    id: "concierge",
    name: "Night Concierge",
    summary:
      "Handles after-hours guest calls: late check-in, emergency maintenance, room service, transport, and quiet-hours complaints.",
    overview:
      "Purpose-built for hotel night shifts. One calm agent manages the full spectrum of after-hours requests without escalating unless there is a genuine safety issue.",
    defaultPrimaryBusinessUnit: "Night Concierge",
    leadAgent: {
      name: "Theo",
      role: "Night Concierge Agent",
      objective:
        "Handle every after-hours guest call quietly and efficiently. Acknowledge the request, collect the minimum needed details, act or log immediately, and close the call without unnecessary conversation.",
      voiceStyle: "Calm, unhurried, softly authoritative — appropriate for late-night callers",
      realtimeVoice: "ash",
    },
    departments: [
      {
        id: "concierge-night-desk",
        name: "Night Desk",
        agentName: "Theo",
        purpose:
          "Single overnight desk covering late check-in, room issues, requests, and quiet-hours complaints.",
        queueTarget: "Night Desk",
        realtimeVoice: "ash",
        supportedCalls: [
          "Late check-in",
          "Room issue or maintenance",
          "Room service order",
          "Transport or taxi booking",
          "Wake-up call request",
          "Quiet-hours noise complaint",
          "Lost & found item",
          "Medical or emergency triage",
        ],
        escalationRules: [
          "Fire or structural emergency — notify duty manager immediately",
          "Medical emergency — call 999 and notify duty manager",
          "Security threat — notify duty manager and on-site security",
        ],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Late check-in",
        tasks: [
          "Confirm guest name and booking reference.",
          "Verify estimated arrival time.",
          "Confirm room is held and communicate key-collection process.",
          "Log ETA for front desk handover notes.",
        ],
        handoffPayloadFields: ["guest_name", "booking_reference", "room_number", "eta", "key_collection_method"],
      },
      {
        callType: "Room issue or emergency maintenance",
        tasks: [
          "Verify room number and describe the issue.",
          "Assess urgency: safety-critical (water leak, no heat, electrical) vs comfort-only.",
          "Dispatch night maintenance for safety-critical issues; log comfort issues for morning.",
          "Confirm to guest what action has been taken and expected resolution time.",
        ],
        handoffPayloadFields: ["guest_name", "room_number", "issue_description", "urgency_level", "action_taken"],
      },
      {
        callType: "Room service or amenity request",
        tasks: [
          "Confirm room number and item requested.",
          "Note any dietary requirements or special instructions.",
          "Log order for kitchen or housekeeping and confirm delivery window to guest.",
        ],
        handoffPayloadFields: ["guest_name", "room_number", "items_requested", "special_instructions", "delivery_eta"],
      },
      {
        callType: "Transport or taxi booking",
        tasks: [
          "Confirm pick-up time, destination, and number of passengers.",
          "Book via preferred provider or advise guest of self-booking option.",
          "Confirm booking reference and meet-point to guest.",
        ],
        handoffPayloadFields: ["guest_name", "room_number", "pickup_time", "destination", "passenger_count"],
      },
      {
        callType: "Wake-up call request",
        tasks: [
          "Confirm room number and requested wake-up time.",
          "Log in wake-up call schedule and confirm back to guest.",
        ],
        handoffPayloadFields: ["guest_name", "room_number", "wakeup_time"],
      },
      {
        callType: "Quiet-hours noise complaint",
        tasks: [
          "Confirm complaining guest's room number and source of noise.",
          "Log noise complaint and contact offending room or area.",
          "Confirm action taken to complaining guest.",
        ],
        handoffPayloadFields: ["complainant_room", "noise_source_location", "complaint_time", "action_taken"],
      },
      {
        callType: "Medical or safety emergency",
        tasks: [
          "Stay calm, collect room number and nature of emergency.",
          "Advise caller to call 999 if life-threatening; confirm hotel address for emergency services.",
          "Immediately notify duty manager and on-site security.",
          "Log incident with timestamp for duty handover report.",
        ],
        handoffPayloadFields: ["room_number", "nature_of_emergency", "emergency_services_called", "duty_manager_notified", "timestamp"],
      },
    ],
  },
  {
    id: "utilities",
    name: "Energy Provider",
    summary:
      "Supports outages, billing, account changes, and safety-led field dispatch.",
    overview:
      "Built for UK energy providers that need fast classification across outages, billing, and account services.",
    defaultPrimaryBusinessUnit: "General Support",
    leadAgent: {
      name: "Jordan",
      role: "Energy Operations Agent",
      objective:
        "Identify supply issues quickly, reassure callers, and route them to outage, billing, or account services.",
      voiceStyle: "Calm under pressure, direct, informative, UK service-desk tone",
      realtimeVoice: "marin",
    },
    departments: [
      {
        id: "utilities-outages",
        name: "Outage Response",
        agentName: "Aiden",
        purpose: "Handles outage reports, ETA updates, and emergency dispatch decisions.",
        queueTarget: "Network Operations",
        realtimeVoice: "cedar",
        supportedCalls: ["Power outage", "Water outage", "Gas interruption", "Street fault reports"],
        escalationRules: ["Medical vulnerability", "Widespread outage", "Gas smell or safety risk"],
      },
      {
        id: "utilities-billing",
        name: "Billing",
        agentName: "Priya",
        purpose: "Resolves invoice questions, payment problems, and tariff disputes.",
        queueTarget: "Billing Team",
        realtimeVoice: "ash",
        supportedCalls: ["Bill explanation", "Payment support", "Tariff query", "Refunds"],
        escalationRules: ["Debt vulnerability", "Disputed high-value bill"],
      },
      {
        id: "utilities-account",
        name: "Account Services",
        agentName: "Marcus",
        purpose: "Handles move-ins, move-outs, meter readings, and ownership changes.",
        queueTarget: "Account Services",
        realtimeVoice: "ash",
        supportedCalls: ["Move home", "Meter reading", "Account setup", "Ownership changes"],
        escalationRules: ["Potential fraud", "Complex multi-property case"],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Outage report",
        tasks: [
          "Capture full address, affected utility, and first-observed outage time.",
          "Check for medical or safety vulnerability and escalate if present.",
          "Provide outage status, reference number, and expected update window.",
        ],
        handoffPayloadFields: ["account_name", "service_address", "affected_utility", "first_observed_time", "vulnerability_flag"],
      },
      {
        callType: "Billing issue",
        tasks: [
          "Verify account details and invoice period in question.",
          "Break down charge components and identify disputed items.",
          "Create billing case and route to specialist when policy override is needed.",
        ],
        handoffPayloadFields: ["account_name", "invoice_reference", "billing_period", "disputed_items", "case_owner"],
      },
      {
        callType: "Move-in or move-out",
        tasks: [
          "Collect effective date, property details, and meter readings.",
          "Confirm account owner and communication preference.",
          "Open account-service order and send completion checklist.",
        ],
        handoffPayloadFields: ["account_name", "property_address", "effective_date", "meter_readings", "contact_preference"],
      },
    ],
  },
  {
    id: "borough-council",
    name: "Borough Council",
    summary:
      "Handles council tax, housing and benefits, waste and streets, licensing, and formal complaints.",
    overview:
      "Built for borough councils that need a clear UK public-service front door for resident enquiries and escalations.",
    defaultPrimaryBusinessUnit: "General Support",
    leadAgent: {
      name: "Hannah",
      role: "Council Services Front-Door Agent",
      objective:
        "Triage resident enquiries quickly, collect required details, and route to the right council service with clear next steps.",
      voiceStyle: "Professional, respectful, plain-English UK public-service tone",
      realtimeVoice: "ash",
    },
    departments: [
      {
        id: "council-tax-revenues",
        name: "Council Tax & Revenues",
        agentName: "Oliver",
        purpose: "Handles council tax bills, payment support, account updates, and arrears contact guidance.",
        queueTarget: "Revenues Team",
        realtimeVoice: "ash",
        supportedCalls: ["Council tax bill query", "Payment support", "Payment plan request", "Account change"],
        escalationRules: ["Enforcement dispute", "Financial vulnerability", "High-balance complaint"],
      },
      {
        id: "council-housing-benefits",
        name: "Housing & Benefits",
        agentName: "Amelia",
        purpose: "Handles social housing enquiries, homelessness contact routing, and benefits status support.",
        queueTarget: "Housing & Benefits Team",
        realtimeVoice: "cedar",
        supportedCalls: ["Housing enquiry", "Benefits status", "Council housing application", "Temporary accommodation support"],
        escalationRules: ["Homelessness risk", "Safeguarding concern", "Urgent vulnerability"],
      },
      {
        id: "council-environment",
        name: "Waste, Streets & Environment",
        agentName: "Isaac",
        purpose: "Handles missed collections, fly-tipping reports, street lighting issues, and environmental incidents.",
        queueTarget: "Environment Operations",
        realtimeVoice: "marin",
        supportedCalls: ["Missed bin collection", "Fly-tipping report", "Street light fault", "Pest or environmental report"],
        escalationRules: ["Public health risk", "Road safety hazard", "Repeat unresolved incident"],
      },
      {
        id: "council-licensing",
        name: "Licensing & Permits",
        agentName: "Grace",
        purpose: "Handles resident permits, business licensing enquiries, and event or venue permit support.",
        queueTarget: "Licensing Team",
        realtimeVoice: "ash",
        supportedCalls: ["Resident permit", "Parking permit", "Business licence", "Event permit enquiry"],
        escalationRules: ["Regulatory complaint", "Urgent permit deadline", "Complex multi-department case"],
      },
      {
        id: "council-complaints",
        name: "General Enquiries & Complaints",
        agentName: "Noah",
        purpose: "Handles switchboard-style routing, service dissatisfaction capture, and formal complaint intake.",
        queueTarget: "Customer Contact Centre",
        realtimeVoice: "cedar",
        supportedCalls: ["General enquiry", "Service complaint", "Department routing", "Follow-up request"],
        escalationRules: ["Formal stage-two complaint", "Member or ombudsman contact", "Threatening behaviour"],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Council tax account or bill query",
        tasks: [
          "Verify resident identity and property address before discussing account details.",
          "Capture the bill period, disputed amount, and payment status.",
          "Create a revenues case with clear next-step timeline and reference.",
        ],
        handoffPayloadFields: ["resident_name", "service_address", "account_reference", "billing_period", "dispute_summary"],
      },
      {
        callType: "Missed collection or environmental report",
        tasks: [
          "Collect full location, issue category, and first-observed time.",
          "Check for immediate public safety or health risk indicators.",
          "Create an environment job and provide reference plus expected update window.",
        ],
        handoffPayloadFields: ["reporter_name", "location", "issue_category", "observed_time", "risk_flag"],
      },
      {
        callType: "Housing or benefits status enquiry",
        tasks: [
          "Verify identity and capture the housing or benefits reference if available.",
          "Summarize current request stage and urgent needs in plain language.",
          "Route to housing and benefits queue with callback target details.",
        ],
        handoffPayloadFields: ["resident_name", "reference_number", "request_type", "urgency", "callback_contact"],
      },
      {
        callType: "Urgent safeguarding or public-safety concern",
        tasks: [
          "Collect minimum required details and location immediately.",
          "If life-threatening, instruct caller to contact 999 without delay.",
          "Escalate to safeguarding or duty officer channels and confirm action taken.",
        ],
        handoffPayloadFields: ["caller_name", "incident_location", "risk_type", "emergency_services_contacted", "escalation_owner"],
      },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    summary:
      "Coordinates appointments, patient support, billing, and safe escalation for healthcare providers.",
    overview:
      "Built for healthcare organisations that need a calm, safe front-door experience with clearly bounded support agents.",
    defaultPrimaryBusinessUnit: "Customer Care",
    leadAgent: {
      name: "Sana",
      role: "Patient Access Agent",
      objective:
        "Triage patient admin calls, understand urgency, and route safely to the right operational team.",
      voiceStyle: "Gentle, clear, calm, confidence-building",
      realtimeVoice: "sage",
    },
    departments: [
      {
        id: "health-appointments",
        name: "Appointments",
        agentName: "Clara",
        purpose: "Handles booking, rescheduling, cancellations, and waitlist management.",
        queueTarget: "Scheduling Team",
        realtimeVoice: "alloy",
        supportedCalls: ["Book appointment", "Reschedule", "Cancel appointment", "Referral follow-up"],
        escalationRules: ["Urgent symptom language", "Missed critical appointment"],
      },
      {
        id: "health-billing",
        name: "Billing & Insurance",
        agentName: "Ethan",
        purpose: "Resolves payment questions, insurance queries, and claim documentation issues.",
        queueTarget: "Revenue Cycle",
        realtimeVoice: "ash",
        supportedCalls: ["Insurance query", "Invoice issue", "Payment plan", "Claim support"],
        escalationRules: ["Coverage denial complaint", "High-balance dispute"],
      },
      {
        id: "health-patient-care",
        name: "Patient Support",
        agentName: "Imani",
        purpose: "Handles concerns empathetically and escalates safeguarding or distress indicators.",
        queueTarget: "Patient Care Team",
        realtimeVoice: "sage",
        supportedCalls: ["General support", "Complaint", "Care concern", "Service feedback"],
        escalationRules: ["Distress or self-harm indicators", "Clinical urgency phrases"],
      },
    ],
    workflowPlaybook: [
      {
        callType: "Appointment management",
        tasks: [
          "Verify patient identifiers before discussing appointment details.",
          "Capture booking, reschedule, or cancellation request clearly.",
          "Confirm the final slot and send a reminder preference.",
        ],
        handoffPayloadFields: ["patient_name", "patient_identifier", "appointment_action", "requested_slot", "reminder_preference"],
      },
      {
        callType: "Billing and insurance",
        tasks: [
          "Confirm insurer, policy details, and invoice reference.",
          "Explain coverage or charge discrepancy in plain language.",
          "Escalate disputed balances with complete case notes.",
        ],
        handoffPayloadFields: ["patient_name", "insurer", "policy_number", "invoice_reference", "dispute_summary"],
      },
      {
        callType: "Patient concern",
        tasks: [
          "Listen actively and mirror emotional tone with reassurance.",
          "Identify safeguarding or urgent risk indicators.",
          "Route immediately to patient care escalation when needed.",
        ],
        handoffPayloadFields: ["patient_name", "concern_summary", "risk_indicator", "urgency", "escalation_owner"],
      },
    ],
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function listBusinessModelTemplates(): BusinessModelTemplate[] {
  return businessModelTemplates;
}

export function resolveBusinessModelTemplate(businessModelId: BusinessModelId): BusinessModelTemplate {
  return (
    businessModelTemplates.find((model) => model.id === businessModelId) ||
    businessModelTemplates[0]
  );
}

export function buildTenantConfigFromBusiness(input: {
  tenantId?: string;
  businessName: string;
  businessModelId: BusinessModelId;
}): TenantConfig {
  const template = resolveBusinessModelTemplate(input.businessModelId);

  return {
    id: input.tenantId || slugify(input.businessName),
    name: input.businessName,
    businessModelId: template.id,
    businessModelName: template.name,
    overview: template.overview,
    openingLine: template.openingLine,
    primaryBusinessUnit: template.defaultPrimaryBusinessUnit,
    leadAgent: template.leadAgent,
    departments: template.departments,
    workflowPlaybook: template.workflowPlaybook,
  };
}

export function isSupportedRealtimeVoice(value: string): value is RealtimeVoice {
  return (SUPPORTED_REALTIME_VOICES as readonly string[]).includes(value);
}

export function normalizeRealtimeVoice(value?: string): RealtimeVoice {
  const candidate = String(value || "").toLowerCase();
  if (!isSupportedRealtimeVoice(candidate)) {
    return BRITISH_DEFAULT_REALTIME_VOICE;
  }

  return BRITISH_APPROVED_VOICES.has(candidate) ? candidate : BRITISH_DEFAULT_REALTIME_VOICE;
}

export function getVerificationPolicyForTenant(tenant: TenantConfig): string {
  if (tenant.businessModelId === "housing-association") {
    return "Verification standard: collect exactly postcode and date of birth, explicitly confirm verification succeeded, and do not ask additional verification questions after both are captured.";
  }

  if (tenant.businessModelId === "hotel") {
    return "Verification standard: for reservations collect booking reference + surname, or phone number + check-in date. For in-stay/concierge requests collect room number + guest surname. For safety or medical emergencies, skip verification and act immediately.";
  }

  if (tenant.businessModelId === "concierge") {
    return "Verification standard: collect room number and guest surname. For safety or medical emergencies, skip verification and act immediately — never delay assistance for identity checks.";
  }

  if (tenant.businessModelId === "borough-council") {
    return "Verification standard: collect exactly 2 factors before account-specific support (full name plus postcode, or account reference plus postcode). For safeguarding or immediate public-safety concerns, skip verification and escalate immediately.";
  }

  return "Verification standard: collect at least 2 factors (for example name + phone/account reference, or booking reference + surname) and explicitly confirm verification succeeded.";
}

export function getTaskCompletionDirectiveForTenant(tenant: TenantConfig): string {
  if (tenant.businessModelId === "housing-association") {
    return "Housing-association directive: once the caller states the issue, classify it as emergency repair, routine tenancy support, or complaint; collect only required details; create and confirm the case reference; then end the call.";
  }

  if (tenant.businessModelId === "hotel") {
    return "Hotel directive: once the caller states the reason, complete the booking, in-stay, or concierge request immediately with exact confirmation details and ETA where relevant; then end the call.";
  }

  if (tenant.businessModelId === "concierge") {
    return "Hotel-concierge directive: once the caller states the need, action it immediately (wake-up call, amenities, transport, room assistance, or urgent escalation) and confirm expected delivery timing; then end the call.";
  }

  if (tenant.businessModelId === "restaurant") {
    return "Restaurant directive: once the caller states the request, complete the reservation or order with a final read-back (time or items, name, and contact); then end the call.";
  }

  if (tenant.businessModelId === "utilities") {
    return "Energy-provider directive: once the caller states the reason, classify as outage, billing, or account service; collect minimum required details; create and confirm a case reference; then end the call.";
  }

  if (tenant.businessModelId === "borough-council") {
    return "Borough-council directive: once the caller states the council service needed, route to the correct department, capture required facts, confirm case reference and timeline, and avoid legal advice; then end the call.";
  }

  return "Task directive: once the caller states the reason, collect minimum details, complete the operational task, confirm completion, then end the call.";
}

export function getCallClosingLineForTenant(tenant: TenantConfig): string {
  if (tenant.businessModelId === "housing-association") {
    return "Your request is now logged and in progress. Thank you for calling Developers Housing. Goodbye.";
  }

  if (tenant.businessModelId === "hotel") {
    return "Your hotel request is confirmed and arranged. Thank you for calling Grand Harbor Hotel. Goodbye.";
  }

  if (tenant.businessModelId === "concierge") {
    return "Your concierge request is arranged now. Thank you for calling Grand Harbor Concierge. Goodbye.";
  }

  if (tenant.businessModelId === "restaurant") {
    return "Your reservation or order is confirmed. Thank you for calling Sunset Bistro. Goodbye.";
  }

  if (tenant.businessModelId === "utilities") {
    return "Your energy request is now logged and in progress. Thank you for calling City Energy. Goodbye.";
  }

  if (tenant.businessModelId === "borough-council") {
    return "Your council request is now logged and in progress. Thank you for calling Borough Council. Goodbye.";
  }

  return "Your request is complete. Thanks for calling. Take care. Goodbye.";
}

export function resolveLeadVoiceForTenant(tenant: TenantConfig): string {
  return normalizeRealtimeVoice(tenant.leadAgent.realtimeVoice);
}

export function resolveDepartmentVoice(tenant: TenantConfig, departmentName?: string): string {
  const normalizedName = String(departmentName || "").toLowerCase();
  const match = tenant.departments.find(
    (department) => department.name.toLowerCase() === normalizedName
  );

  if (match?.realtimeVoice) {
    return normalizeRealtimeVoice(match.realtimeVoice);
  }

  return resolveLeadVoiceForTenant(tenant);
}

export function resolveDepartmentFromText(
  tenant: TenantConfig,
  text: string
): DepartmentProfile | null {
  const haystack = text.toLowerCase();

  let bestScore = 0;
  let bestDepartment: DepartmentProfile | null = null;

  for (const department of tenant.departments) {
    const phrases = [
      department.name,
      department.purpose,
      department.queueTarget,
      ...department.supportedCalls,
      ...department.escalationRules,
    ];

    const score = phrases.reduce((total, phrase) => {
      const tokens = phrase
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2);

      return total + tokens.filter((token) => haystack.includes(token)).length;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestDepartment = department;
    }
  }

  return bestScore > 0 ? bestDepartment : null;
}

export function buildDepartmentRoutingInstructions(tenant: TenantConfig): string {
  const departmentLines = tenant.departments
    .map(
      (department) =>
        `${department.name}: handled by ${department.agentName}. Voice model: ${normalizeRealtimeVoice(department.realtimeVoice)}. Scope: ${department.purpose}. Supported calls: ${department.supportedCalls.join(", ")}. Escalate when: ${department.escalationRules.join(", ")}.`
    )
    .join("\n");

  const workflowLines = tenant.workflowPlaybook
    .map(
      (workflow) =>
        `${workflow.callType}: ${workflow.tasks.map((task, index) => `Task ${index + 1}: ${task}`).join(" ")} Handoff payload required fields: ${workflow.handoffPayloadFields.join(", ")}.`
    )
    .join("\n");

  const verificationPolicy = getVerificationPolicyForTenant(tenant);
  const completionDirective = getTaskCompletionDirectiveForTenant(tenant);
  const closingLine = getCallClosingLineForTenant(tenant);
  const openingLine = getOpeningLineForTenant(tenant);
  return `You are the live voice agent for ${tenant.name}, a ${tenant.businessModelName} operation.\n\nYou are the front-door agent ${tenant.leadAgent.name}, whose job is to greet the caller, understand the need quickly, and route them into the correct department agent.\nFront-door voice model: ${normalizeRealtimeVoice(tenant.leadAgent.realtimeVoice)}.\n\nImportant behaviour rules:\n- Your first spoken sentence of every new call must be exactly: "${openingLine}"\n- Keep responses natural, short, and conversational.\n- Brevity rule: default to one short sentence (maximum 18 words).\n- If clarification is required, use at most two short sentences (maximum 30 words total).\n- Ask only one question at a time.\n- Do not list multiple options unless the caller asks for options.\n- Task-completion priority: identify intent, collect required details, perform the next action, confirm outcome, and close.\n- Turn budget: after verification, resolve most calls within 4 agent turns.\n- If enough details are already provided, do not ask extra questions; act and confirm.\n- As soon as the caller clearly states why they called, move straight to completion for this business type.\n- ${completionDirective}\n- Avoid exploratory chat, filler phrases, and repeated reassurance.\n- End each resolved call with a concrete next-step summary in one sentence.\n- Start every call with identity verification before account-specific help or transfers.\n- ${verificationPolicy}\n- If verification is incomplete or fails, do not transfer to a department agent and do not perform account-specific actions.\n- Stay within the scope of the chosen department once routed.\n- Do not answer with information from unrelated departments.\n- If the caller changes topic, acknowledge it briefly and reroute them to the correct department.\n- Confirm practical details needed for that department only.\n- Create or prepare a ticket, reservation, or order summary as appropriate for that department.\n- Mirror the caller's emotional state with empathy while remaining calm and professional.\n- For council and regulated-service calls, provide operational guidance only and do not give legal advice.\n- Do not mention being an agent model, prompts, tools, or internal routing.\n- If the caller wants to end the conversation, close immediately with this exact line: "${closingLine}"\n- When the task is completed, always end with this exact line: "${closingLine}"\n\nCall workflow by type (follow the relevant task sequence):\n${workflowLines}\n\nDepartment roster:\n${departmentLines}`;
}