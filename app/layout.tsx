import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppWorkspaceHeader } from "@/components/AppWorkspaceHeader";
import { PublicNav } from "@/components/PublicNav";
import { GlobalCursorFx } from "@/components/GlobalCursorFx";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universal Agent – Autonomous Voice Platform",
  description:
    "Universal Agent powers real-time voice agents for housing associations, hotels, restaurants, and concierge teams. One platform, every business line.",
  openGraph: {
    title: "Universal Agent – Autonomous Voice Platform",
    description:
      "Real-time voice agents for housing, hotels, restaurants, and concierge. Handle calls end-to-end in one intelligent voice.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal Agent – Autonomous Voice Platform",
    description: "Real-time voice agents for every business line.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="ua-ambient-layer" aria-hidden="true" />
        <GlobalCursorFx />
        <PublicNav />
        <AppWorkspaceHeader />
        <main className="ua-page-shell" style={{ flex: 1 }}>{children}</main>
        <footer
          style={{
            background: "rgba(5,10,24,0.98)",
            borderTop: "1px solid rgba(148,163,184,0.14)",
            padding: "40px 20px 24px",
            fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "32px",
            }}
          >
            {/* Brand column */}
            <div style={{ gridColumn: "span 1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  UA
                </div>
                <span style={{ color: "#e0f2fe", fontWeight: 800, fontSize: "15px" }}>Universal Agent</span>
              </div>
              <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                Autonomous voice agents for housing, hotels, restaurants, and concierge teams.
              </p>
            </div>

            {/* Product column */}
            <div>
              <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                Product
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { href: "/", label: "Live Demo" },
                  { href: "/subscription", label: "Pricing" },
                  { href: "/signup", label: "Get Started" },
                  { href: "/login", label: "Sign In" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ color: "#94a3b8", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Business lines column */}
            <div>
              <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                Business Lines
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["Housing Association", "Hotel", "Hotel Concierge", "Restaurant"].map((label) => (
                  <span key={label} style={{ color: "#94a3b8", fontSize: "13px" }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Legal column */}
            <div>
              <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                Legal
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { href: "/terms", label: "Terms & Conditions" },
                  { href: "/privacy", label: "Privacy Policy" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ color: "#94a3b8", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                  >
                    {link.label}
                  </Link>
                ))}
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>legal@universalagent.local</span>
              </div>
            </div>
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "32px auto 0",
              paddingTop: "20px",
              borderTop: "1px solid rgba(148,163,184,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <span style={{ color: "#475569", fontSize: "12px" }}>
              © {new Date().getFullYear()} Universal Agent. All rights reserved.
            </span>
            <span style={{ color: "#334155", fontSize: "12px" }}>
              Built for housing · hospitality · food service
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
