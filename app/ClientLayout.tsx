"use client";
import { useEffect } from "react";
import { AppWorkspaceHeader } from "@/components/AppWorkspaceHeader";
// import { PublicNav } from "@/components/PublicNav";
import { GlobalCursorFx } from "@/components/GlobalCursorFx";
import Footer from "@/components/Footer";
import { FloatingDemoWidget } from "@/components/FloatingDemoWidget";
import { DemoReliabilityBadge } from "@/components/DemoReliabilityBadge";
import { RealTimeDemoStatus } from "@/components/RealTimeDemoStatus";
import { SecurityComplianceBadge } from "@/components/SecurityComplianceBadge";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);
  return (
    <>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <div className="ua-ambient-layer" aria-hidden="true" />
      <GlobalCursorFx />
      {/* <PublicNav /> */}
      <AppWorkspaceHeader />
      <main className="ua-page-shell" style={{ flex: 1 }}>{children}</main>
      <Footer />
      <FloatingDemoWidget />
      {/* <DemoReliabilityBadge /> */}
      {/* <RealTimeDemoStatus /> */}
      {/* <SecurityComplianceBadge /> */}
    </>
  );
}
