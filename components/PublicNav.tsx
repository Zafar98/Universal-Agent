"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";


const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/showcase/email", label: "Demo" },
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/subscription", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dashboard and admin have their own header
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5,10,24,0.94)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(148,163,184,0.14)",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <BrandMark size={34} showWordmark />
        </Link>

        {/* Desktop nav links */}
        <div
          className="ua-nav-desktop"
          style={{ display: "flex", alignItems: "center", gap: "28px" }}
        >
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: pathname === link.href ? "#7dd3fc" : "#94a3b8",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: pathname === link.href ? 700 : 500,
                  transition: "color 140ms",
                  padding: "0 2px"
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA group */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link
              href="/showcase/call"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #2563eb 100%)",
                color: "white",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: "999px",
                boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                whiteSpace: "nowrap",
                marginRight: "4px",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              aria-label="Test the Agent live demo"
            >
              Test the Agent
            </Link>
            <Link
              href="/login"
              style={{
                color: "#bae6fd",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                padding: "7px 16px",
                borderRadius: "999px",
                border: "1px solid rgba(125,211,252,0.28)",
                whiteSpace: "nowrap",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
                color: "white",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: "999px",
                boxShadow: "0 4px 14px rgba(6,182,212,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="ua-nav-mobile-toggle"
          style={{
            background: "none",
            border: "1px solid rgba(125,211,252,0.28)",
            borderRadius: "8px",
            color: "#bae6fd",
            cursor: "pointer",
            padding: "6px 10px",
            fontSize: "18px",
            lineHeight: 1,
            display: "none",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen ? (
        <div
          style={{
            borderTop: "1px solid rgba(148,163,184,0.12)",
            padding: "14px 20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: pathname === link.href ? "#7dd3fc" : "#94a3b8",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
                padding: "6px 0"
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            style={{ color: "#bae6fd", textDecoration: "none", fontSize: "15px", fontWeight: 600, padding: "6px 0" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            onClick={() => setMobileOpen(false)}
            style={{
              background: "linear-gradient(135deg, #06b6d4, #2563eb)",
              color: "white",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 700,
              padding: "11px 20px",
              borderRadius: "999px",
              textAlign: "center",
              marginTop: "4px",
            }}
          >
            Get Started
          </Link>
        </div>
      ) : null}

      <style>{`
        @media (max-width: 680px) {
          .ua-nav-desktop { display: none !important; }
          .ua-nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
