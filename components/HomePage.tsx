"use client";

import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [selectedBusiness, setSelectedBusiness] = useState("housing");

  const businesses = [
    {
      id: "housing",
      icon: "🏠",
      name: "Housing",
      description: "Test repair requests, tenancy issues, and customer support for residential properties",
    },
    {
      id: "hotel",
      icon: "🏨",
      name: "Hotel",
      description: "Test reservations, guest services, and concierge requests for hospitality",
    },
    {
      id: "restaurant",
      icon: "🍽️",
      name: "Restaurant",
      description: "Test bookings, food orders, and customer inquiries for food service",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1a2d4d 50%, #0d1a2e 100%)",
        color: "#e5eefc",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(34,211,238,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header
          style={{
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI Voice Calls
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/login"
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.4)",
                background: "transparent",
                color: "#0ea5e9",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                color: "white",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Sign Up Free
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section
          style={{
            padding: "80px 24px 60px",
            textAlign: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
              background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI Voice Agent for Your Business
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "#cbd5e1",
              lineHeight: 1.6,
              maxWidth: 700,
              margin: "0 auto 40px",
            }}
          >
            Answer calls 24/7, handle customer requests, route urgent issues—all with AI. Start your free 60-second trial below, no sign-up needed.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                padding: "16px 32px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 20px 40px rgba(16,185,129,0.3)",
              }}
            >
              Start Free Trial Now
            </Link>
            <Link
              href="/subscription"
              style={{
                padding: "16px 32px",
                borderRadius: 12,
                border: "2px solid rgba(56,189,248,0.5)",
                background: "rgba(14,165,233,0.08)",
                color: "#0ea5e9",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              View Pricing
            </Link>
          </div>
        </section>

        {/* Business Types Section */}
        <section
          style={{
            padding: "60px 24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: 36,
              fontWeight: 900,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            Try Different Business Types
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              marginBottom: 40,
            }}
          >
            {businesses.map((business) => (
              <div
                key={business.id}
                onClick={() => setSelectedBusiness(business.id)}
                style={{
                  padding: 28,
                  borderRadius: 16,
                  border:
                    selectedBusiness === business.id
                      ? "2px solid rgba(56,189,248,0.8)"
                      : "1px solid rgba(148,163,184,0.1)",
                  background:
                    selectedBusiness === business.id
                      ? "rgba(14,165,233,0.12)"
                      : "rgba(15,23,42,0.6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 56, marginBottom: 12 }}>{business.icon}</div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 10,
                    color: "white",
                  }}
                >
                  {business.name}
                </h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 14 }}>
                  {business.description}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "40px 24px",
              borderRadius: 16,
              background: "rgba(14,165,233,0.08)",
              border: "1px solid rgba(56,189,248,0.2)",
            }}
          >
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Ready to try the {selectedBusiness === "housing" ? "Housing" : selectedBusiness === "hotel" ? "Hotel" : "Restaurant"} agent?
            </h3>
            <p style={{ color: "#cbd5e1", marginBottom: 20, fontSize: 16 }}>
              Click the button below to start a live 60-second trial. You'll experience the agent handling real customer interactions in real-time.
            </p>
            <Link
              href="/signup"
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              Start {selectedBusiness === "housing" ? "Housing" : selectedBusiness === "hotel" ? "Hotel" : "Restaurant"} Trial
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section
          style={{
            padding: "60px 24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: 36,
              fontWeight: 900,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            Why Choose Our AI Call System?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                title: "24/7 Availability",
                desc: "Your AI agent answers calls around the clock, even after business hours.",
              },
              {
                title: "Instant Responses",
                desc: "No waiting on hold. Customers get immediate assistance with their requests.",
              },
              {
                title: "Smart Routing",
                desc: "Issues are automatically categorized and routed to the right department or person.",
              },
              {
                title: "Detailed Transcripts",
                desc: "Every call is recorded and summarized so you never miss important details.",
              },
              {
                title: "Cost Effective",
                desc: "Reduce customer service costs while improving response times and satisfaction.",
              },
              {
                title: "Easy Integration",
                desc: "Works with your existing phone system, website, or communication platform.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  padding: 24,
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.5)",
                  border: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 14 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section
          style={{
            padding: "80px 24px",
            textAlign: "center",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: 44,
              fontWeight: 900,
              marginBottom: 20,
            }}
          >
            Ready to Transform Your Customer Service?
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "#cbd5e1",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Start with a free 60-second trial, no credit card required. Then subscribe to unlock unlimited AI-powered call handling for your business.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                padding: "18px 36px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 20px 40px rgba(16,185,129,0.3)",
              }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/subscription"
              style={{
                padding: "18px 36px",
                borderRadius: 12,
                border: "2px solid rgba(56,189,248,0.5)",
                background: "rgba(14,165,233,0.08)",
                color: "#0ea5e9",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Explore Pricing
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid rgba(148,163,184,0.1)",
            padding: "40px 24px",
            textAlign: "center",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            © 2026 AI Voice Calls. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/privacy" style={{ color: "#0ea5e9", textDecoration: "none" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: "#0ea5e9", textDecoration: "none" }}>
              Terms of Service
            </Link>
            <Link href="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>
              Sign In
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
