
"use client";

import { IntegrationsSection } from "./IntegrationsSection";
import Link from "next/link";
import { StatCard } from "./StatCard";
import { CapabilityCard } from "./CapabilityCard";
import type { Capability, UseCase, HowItWorksStep } from "./types";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
const NewsletterSignup = dynamic(() => import("./NewsletterSignup").then(mod => mod.NewsletterSignup), { ssr: false });

const HowItWorksSection = React.lazy(() => import("./LandingPageHowItWorksSection"));
const IndustryUseCasesSection = React.lazy(() => import("./LandingPageIndustryUseCasesSection"));

const CAPABILITIES: Capability[] = [
  {
    icon: "🤖",
    title: "Custom AI Agents",
    colour: "#38bdf8",
    description:
      "We design, build, and deploy AI agents tailored to your business workflows, brand, and customer needs.",
    points: [
      "Bespoke agent logic and integrations",
      "Voice, email, web, and API channels",
      "Secure, reliable, and always available",
      "Continuous improvement and support",
    ],
  },
  {
    icon: "📞",
    title: "Voice & Call Handling",
    colour: "#a78bfa",
    description:
      "Agents answer, resolve, and log calls 24/7, escalating only what needs a human.",
    points: [
      "Natural conversation and verification",
      "Booking, triage, and escalation",
      "Call logging and analytics",
      "Multi-language support",
    ],
  },
  {
    icon: "📧",
    title: "Email & Message Automation",
    colour: "#22d3ee",
    description:
      "Agents triage, draft, and resolve emails and messages automatically, closing routine issues.",
    points: [
      "Shared inbox monitoring",
      "Auto-drafted replies",
      "Complaint, billing, and booking handling",
    ],
  },
];

const USE_CASES: UseCase[] = [
  { icon: "🏠", sector: "Housing", example: "Repairs, rent, anti-social behaviour, tenancy queries" },
  { icon: "🏨", sector: "Hotel", example: "Reservations, guest services, event bookings, lost property" },
  { icon: "🍽️", sector: "Restaurant", example: "Table bookings, order queries, allergen questions, event enquiries" },
  { icon: "⚡", sector: "Utilities", example: "Outage reports, billing disputes, account changes, engineer scheduling" },
  { icon: "🏛️", sector: "Council", example: "Council tax, housing benefits, waste services, licensing" },
  { icon: "🏢", sector: "Corporate", example: "Multi-department support, internal helpdesk, policy queries" },
];

const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: "1",
    title: "You subscribe and share your setup details",
    detail:
      "Pick a plan, tell us about your departments, workflows, and what your agent should know. We configure everything before go-live.",
  },
  {
    step: "2",
    title: "We build and deploy your agent",
    detail:
      "Your agent is trained on your business logic, connected to your inbox or phone number, and deployed. Typical setup takes days, not months.",
  },
  {
    step: "3",
    title: "The agent handles your workload 24/7",
    detail:
      "Calls are answered, emails resolved, tickets created, and contractors dispatched — autonomously. You see everything in your dashboard in real time.",
  },
  {
    step: "4",
    title: "You only touch the exceptions",
    detail:
      "The agent escalates only what genuinely needs a human. Complex complaints, legal risk, or distressed callers are flagged immediately.",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen font-sans text-slate-200 overflow-x-hidden" role="main">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-br from-[#030712] via-[#0b1220] to-[#0f172a] py-20 px-5" role="banner" aria-label="Hero section">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-6 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-sky-50" tabIndex={0} aria-label="We build and install your digital workforce—custom AI business agents, tailored to your operations.">
            Your <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Digital Workforce</span>, Designed for You
          </h1>
          <p className="mb-8 text-lg text-sky-200 max-w-2xl leading-relaxed">
            We design, build, and maintain custom AI-powered business agents—digital employees that work 24/7, tailored to your unique workflows, brand, and operations. You describe the job, we deliver the agent. No templates, no DIY—just a digital workforce built for your business.
          </p>
          <nav className="flex flex-wrap gap-3 items-center mb-10" aria-label="Primary call to action">
            <Link
              href="/quote"
              className="rounded-xl px-7 py-3 font-extrabold text-lg bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 animate-gradient-x"
              aria-label="Request a custom agent demo"
              tabIndex={0}
              style={{ marginRight: "2px" }}
            >
              <span aria-hidden="true">Request a custom agent demo →</span>
              <span className="sr-only">Demo agent</span>
            </Link>
            <Link
              href="/product"
              className="rounded-xl px-6 py-3 font-bold text-base border border-slate-400/40 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition"
              aria-label="View agent solutions"
            >
              Agent solutions
            </Link>
          </nav>
          {/* stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-3xl">
            {[
              { value: "24/7", label: "Always available" },
              { value: "< 1s", label: "Call answer time" },
              { value: "100%", label: "Interactions logged" },
              { value: "0", label: "Missed calls" },
            ].map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </header>

      {/* ── Why Choose Us ───────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-gradient-to-b from-yellow-900/10 to-blue-950/40" aria-labelledby="why-choose-us-heading">
        <h2 id="why-choose-us-heading" className="text-3xl md:text-4xl font-extrabold text-center text-yellow-300 mb-6 tracking-tight">Why Choose Asistoria?</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl mb-2">🚀</div>
            <h3 className="font-bold text-lg mb-1 text-yellow-100">Built for Modern Business</h3>
            <p className="text-yellow-50">We’re a new team focused on practical, reliable automation—no hype, just results.</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🧑‍💻</div>
            <h3 className="font-bold text-lg mb-1 text-yellow-100">Transparent & Accessible</h3>
            <p className="text-yellow-50">Clear pricing, honest communication, and no hidden fees. We’re here to earn your trust from day one.</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🌱</div>
            <h3 className="font-bold text-lg mb-1 text-yellow-100">Growing With You</h3>
            <p className="text-yellow-50">Early adopters get direct input into our roadmap and special launch pricing.</p>
          </div>
        </div>
      </section>
      <section className="py-16 px-5 bg-gradient-to-b from-[#0b1220] to-[#030712] via-[#7c3aed1a]" aria-labelledby="core-capabilities-heading">
        <h2 id="core-capabilities-heading" className="sr-only">Core Capabilities</h2>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="uppercase tracking-widest font-extrabold text-cyan-300 text-xs mb-2">Your Digital Employee, Your Way</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-sky-100 mb-2 tracking-tight">We build, deploy, and maintain your custom business agent</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: "🤖",
                title: "Digital Employees",
                colour: "#38bdf8",
                description:
                  "We design and install AI-powered digital employees that work 24/7, tailored to your business. No templates—each agent is built for your unique workflows, brand, and customer needs.",
                points: [
                  "Bespoke agent logic and integrations",
                  "Voice, email, web, and API channels",
                  "Secure, reliable, and always available",
                  "Continuous improvement and support",
                ],
              },
              {
                icon: "🛠️",
                title: "Tailored Workflow Automation",
                colour: "#a3e635",
                description:
                  "We automate your business processes—support, onboarding, booking, compliance, triage, sales, and more. You describe the job, we build the agent.",
                points: [
                  "Business process automation",
                  "CRM, helpdesk, and custom integrations",
                  "Multi-step workflows",
                  "Human handoff/escalation",
                ],
              },
              {
                icon: "🧑‍💼",
                title: "Solution Provider",
                colour: "#fbbf24",
                description:
                  "We are your digital workforce partner. We design, build, deploy, and maintain your agents—so you can focus on your business, not the tech.",
                points: [
                  "Full-service design and deployment",
                  "Ongoing support and maintenance",
                  "Custom analytics and reporting",
                  "Continuous improvement based on your feedback",
                ],
              },
              {
                icon: "📞",
                title: "Voice & Call Handling",
                colour: "#a78bfa",
                description:
                  "Agents answer, resolve, and log calls 24/7, escalating only what needs a human.",
                points: [
                  "Natural conversation and verification",
                  "Booking, triage, and escalation",
                  "Call logging and analytics",
                  "Multi-language support",
                ],
              },
              {
                icon: "✉️",
                title: "Email & Message Automation",
                colour: "#22d3ee",
                description:
                  "Agents triage, draft, and resolve emails and messages automatically, closing routine issues.",
                points: [
                  "Shared inbox monitoring",
                  "Auto-drafted replies",
                  "Complaint, billing, and booking handling",
                ],
              },
              {
                icon: "🌐",
                title: "Web & API Integrations",
                colour: "#fbbf24",
                description:
                  "Connect your agent to your website, CRM, ticketing, or any system with our flexible APIs and widgets.",
                points: [
                  "Website widget & chat",
                  "REST API & webhooks",
                  "Custom triggers and actions",
                ],
              },
              {
                icon: "📊",
                title: "Analytics & Insights",
                colour: "#f472b6",
                description:
                  "Track every interaction, outcome, and improvement. Full audit logs and dashboards included.",
                points: [
                  "Real-time dashboards",
                  "SLA and performance tracking",
                  "Export and reporting tools",
                ],
              },
            ].map((cap) => (
              <CapabilityCard key={cap.title} {...cap} />
            ))}
          </div>
        </div>
      </section>


      {/* ── How it works (lazy) ─────────────────────────────────────── */}
      <div id="how-it-works">
        <Suspense fallback={<div className="text-center py-10">Loading how it works…</div>}>
          <HowItWorksSection howItWorks={HOW_IT_WORKS} />
        </Suspense>
      </div>

      {/* ── Industry use cases (lazy) ──────────────────────────────── */}
      <Suspense fallback={<div className="text-center py-10">Loading industry use cases…</div>}>
        <IndustryUseCasesSection useCases={USE_CASES} />
      </Suspense>

      {/* Integrations section */}
      <IntegrationsSection />

      {/* ── Early Adopter CTA ────────────────────────────────────────── */}
      <section className="py-12 px-5 bg-gradient-to-r from-green-900/30 to-blue-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-green-200 mb-3">Build your agent today</h2>
          <p className="text-green-100 mb-5">Ready to automate your business? Request a free consultation and see what a custom agent can do for you.</p>
          <Link href="/quote" className="inline-block rounded-xl px-7 py-3 font-extrabold text-lg bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 animate-gradient-x">
            Request Free Consultation
          </Link>
        </div>
      </section>
      <section
        style={{
          padding: "64px 20px",
          background:
            "radial-gradient(900px 400px at 50% 50%, rgba(14,165,233,0.16), transparent 60%), linear-gradient(180deg, #030712 0%, #0b1220 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "38px",
              fontWeight: 900,
              color: "#e0f2fe",
              letterSpacing: "-0.025em",
            }}
          >
            Ready to install your digital employee?
          </h2>
          <p style={{ margin: "0 0 28px", color: "#93c5fd", fontSize: "17px", lineHeight: 1.7 }}>
            We build, deploy, and maintain a digital agent that works for your business 24/7. Describe your workflow, and we’ll deliver a digital employee that fits your operations—no technical skills required.
          </p>
          <div className="flex gap-3 justify-center flex-wrap mt-6" role="group" aria-label="Call to action buttons">
            <Link
              href="/quote"
              className="rounded-xl px-7 py-3 font-extrabold text-base bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Request a custom agent demo"
              tabIndex={0}
            >
              <span aria-hidden="true">Request a custom agent demo →</span>
              <span className="sr-only">Demo agent</span>
            </Link>
            <Link
              href="/product"
              className="rounded-xl px-7 py-3 font-bold text-base border border-slate-400/40 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition"
              aria-label="Agent solutions"
            >
              Agent solutions
            </Link>
            <Link
              href="/how-to"
              className="rounded-xl px-7 py-3 font-bold text-base border border-yellow-300/40 bg-yellow-900/20 text-yellow-100 hover:bg-yellow-900/30 transition"
              aria-label="Integration guide"
            >
              Integration guide
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup - now more prominent */}
      <section className="py-12 px-5 bg-gradient-to-b from-blue-950 to-blue-900/80 sticky top-0 z-30">
        <div className="max-w-xl mx-auto">
          <h3 className="text-2xl font-bold text-blue-100 mb-2 text-center">Stay in the loop</h3>
          <p className="text-blue-200 mb-4 text-center">Get product updates, AI news, and exclusive offers. No spam.</p>
          <NewsletterSignup />
        </div>
      </section>
          {/* ── Roadmap Section ─────────────────────────────────────────── */}
          <section className="py-16 px-5 bg-gradient-to-b from-blue-900/10 to-blue-950/30">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-sky-200 mb-4 text-center">What’s Next?</h2>
              <ul className="list-disc list-inside text-blue-100 space-y-2">
                <li>Voice call agent demo (live now!)</li>
                <li>Email automation (live now!)</li>
                <li>Website widget integration (coming soon)</li>
                <li>API & webhook support (coming soon)</li>
                <li>Multi-language support (planned)</li>
                <li>More industry templates (planned)</li>
              </ul>
            </div>
          </section>
          {/* ── Contact Section ─────────────────────────────────────────── */}
          <section className="py-12 px-5 bg-gradient-to-b from-slate-900/40 to-slate-950/80">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">Contact Us</h2>
              <p className="text-slate-300 mb-4">Questions, partnership ideas, or want to build something unique? Email <a href="mailto:hello@asistoria.com" className="underline text-blue-300">hello@asistoria.com</a> or <Link href="/quote" className="underline text-blue-300">request a free agent consultation</Link>.</p>
            </div>
          </section>
    </main>
  );
}
