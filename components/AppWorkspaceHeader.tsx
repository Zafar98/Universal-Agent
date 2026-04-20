"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

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
        background: "rgba(2,8,23,0.9)",
        borderBottom: "1px solid rgba(45,212,191,0.22)",
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
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandMark size={28} showWordmark />
          </Link>
          <nav style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              Dashboard
            </Link>
            <Link href="/admin" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              Admin
            </Link>
            <Link href="/" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              Test Call
            </Link>
            <Link href="/showcase/call" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              Demo call
            </Link>
            <Link href="/showcase/email" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              Demo Email
            </Link>
            <Link href="/how-to" style={{ textDecoration: "none", color: "#67e8f9", fontWeight: 600, fontSize: "14px" }}>
              How To Integrate
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ color: "#94a3b8", fontSize: "13px" }}>
            {business?.businessName || "Workspace"}
          </div>
          <button
            onClick={logout}
            style={{
              border: "1px solid rgba(45,212,191,0.28)",
              background: "rgba(15,23,42,0.92)",
              borderRadius: "999px",
              padding: "7px 12px",
              color: "#ccfbf1",
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
