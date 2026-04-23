import React from "react";

export function DemoReliabilityBadge() {
  // In a real app, fetch these stats from an API or status endpoint
  const stats = {
    uptime: "99.99%",
    last24h: "100% success",
    avgResponse: "<1s",
  };

  return (
    <div
      className="flex items-center gap-2 bg-green-700/90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md border border-green-400/40"
      title="Demo system reliability (last 30 days)"
      aria-label="Demo system reliability badge"
      style={{ position: "fixed", bottom: 24, left: 24, zIndex: 50 }}
    >
      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
      <span>Demo Uptime: {stats.uptime}</span>
      <span className="mx-2">|</span>
      <span>Last 24h: {stats.last24h}</span>
      <span className="mx-2">|</span>
      <span>Avg Resp: {stats.avgResponse}</span>
    </div>
  );
}
