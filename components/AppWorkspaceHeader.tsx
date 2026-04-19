"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SessionBusiness = {
  isAdmin?: boolean;
  businessName: string;
};

export function AppWorkspaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [business, setBusiness] = useState<SessionBusiness | null>(null);

  const shouldRender = useMemo(
    () => pathname.startsWith("/dashboard") || pathname.startsWith("/admin"),
    [pathname]
  );

  useEffect(() => {
    if (!shouldRender) {
      setBusiness(null);
      return;
    }

    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setBusiness(data?.business || null);
      } catch {
        if (!active) return;
        setBusiness(null);
      }
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, [shouldRender]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(pathname.startsWith("/admin") ? "/admin/login" : "/login");
    router.refresh();
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        backdropFilter: "blur(10px)",
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--primary-strong)", fontWeight: 800 }}>
            Universal Agent
          </Link>
          <nav style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "#1f3a75", fontWeight: 600, fontSize: "14px" }}>
              Dashboard
            </Link>
            <Link href="/admin" style={{ textDecoration: "none", color: "#1f3a75", fontWeight: 600, fontSize: "14px" }}>
              Admin
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {business?.businessName || "Workspace"}
          </div>
          <button
            onClick={logout}
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface)",
              borderRadius: "999px",
              padding: "7px 12px",
              color: "#21447f",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
