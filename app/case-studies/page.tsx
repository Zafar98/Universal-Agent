import React from "react";

const CASE_STUDIES = [
  {
    sector: "Housing Association",
    client: "City Housing Group",
    summary: "AI agent now handles 80% of calls and emails, freeing staff for complex cases. Reduced response times by 60%.",
    highlights: [
      "24/7 emergency repair triage",
      "Automated complaint handling",
      "Contractor dispatch integration",
    ],
  },
  {
    sector: "Hotel",
    client: "Seaview Hotel",
    summary: "Launched a custom agent in under two weeks. Guests love the instant service, and staff are less stressed.",
    highlights: [
      "Instant guest check-in/out",
      "Concierge requests via phone/email",
      "Booking and reservation automation",
    ],
  },
  {
    sector: "Restaurant",
    client: "Urban Eats",
    summary: "AI agent manages table bookings and order queries, reducing missed calls and improving customer satisfaction.",
    highlights: [
      "Table booking automation",
      "Order and allergen queries",
      "Event enquiry handling",
    ],
  },
  {
    sector: "Utilities",
    client: "PowerGrid UK",
    summary: "Automated outage reports and billing queries, reducing call centre load by 50%.",
    highlights: [
      "Outage reporting",
      "Billing dispute triage",
      "Engineer scheduling integration",
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 32 }}>Case Studies & Industries</h1>
      <p style={{ color: "#64748b", fontSize: 18, marginBottom: 40 }}>
        See how our AI agents deliver results across sectors. Every solution is bespoke, but the impact is always measurable.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 36 }}>
        {CASE_STUDIES.map((cs, idx) => (
          <div key={idx} style={{ background: "#f1f5f9", borderRadius: 16, padding: 28, boxShadow: "0 2px 16px #0ea5e911" }}>
            <div style={{ color: "#0ea5e9", fontWeight: 700, fontSize: 18 }}>{cs.sector}</div>
            <div style={{ fontWeight: 900, fontSize: 22, margin: "6px 0 10px" }}>{cs.client}</div>
            <div style={{ color: "#334155", fontSize: 16, marginBottom: 12 }}>{cs.summary}</div>
            <ul style={{ color: "#0ea5e9", fontSize: 15, margin: 0, paddingLeft: 20 }}>
              {cs.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
