import React from "react";

export function SecurityComplianceBadge() {
  return (
    <div
      className="flex items-center gap-2 bg-blue-900/90 text-blue-100 px-3 py-1 rounded-full text-xs font-semibold shadow border border-blue-400/40"
      title="Security & Compliance"
      aria-label="Security and compliance badge"
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}
    >
      <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1" />
      <span>SOC 2 Type II</span>
      <span className="mx-2">|</span>
      <span>GDPR Ready</span>
      <span className="mx-2">|</span>
      <span>End-to-End Encryption</span>
    </div>
  );
}
