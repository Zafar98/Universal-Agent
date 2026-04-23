import React from "react";

const FAQS = [
  {
    q: "How does the AI voice/email agent work?",
    a: "Our AI agent answers calls and emails for your business, handling common queries, booking appointments, and escalating complex issues to your team."
  },
  {
    q: "Can I customize the agent for my industry?",
    a: "Yes, our platform supports industry-specific workflows and can be tailored to your business needs."
  },
  {
    q: "What is the pricing model?",
    a: "We charge a one-time setup fee, a monthly subscription, and a per-call overage for high volume. See our Pricing page for details."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use enterprise-grade encryption and comply with GDPR and other relevant standards."
  },
  {
    q: "How do I get started?",
    a: "Book a consultation or try our demo. Our team will guide you through onboarding and integration."
  }
];

export default function FAQSection() {
  return (
    <section id="faq" style={{ maxWidth: 800, margin: "60px auto", padding: 24 }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Frequently Asked Questions</h2>
      <div>
        {FAQS.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: "#0ea5e9" }}>{item.q}</div>
            <div style={{ fontSize: 16, color: "#334155", marginTop: 6 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
