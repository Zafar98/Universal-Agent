import React, { useEffect, useState } from "react";

// This would hit a real status endpoint in production
async function fetchDemoStatus() {
  // Simulate API call
  return new Promise<{ status: "operational" | "degraded" | "down"; message: string }>((resolve) => {
    setTimeout(() => {
      resolve({ status: "operational", message: "All systems operational" });
    }, 300);
  });
}

export function RealTimeDemoStatus() {
  const [status, setStatus] = useState<"operational" | "degraded" | "down">("operational");
  const [message, setMessage] = useState("All systems operational");

  useEffect(() => {
    let mounted = true;
    async function poll() {
      const res = await fetchDemoStatus();
      if (mounted) {
        setStatus(res.status);
        setMessage(res.message);
      }
      setTimeout(poll, 15000); // poll every 15s
    }
    poll();
    return () => {
      mounted = false;
    };
  }, []);

  const color =
    status === "operational"
      ? "bg-green-500"
      : status === "degraded"
      ? "bg-yellow-400"
      : "bg-red-500";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1 rounded-full text-xs font-semibold shadow border border-white/10 ${color}`}
      aria-live="polite"
      aria-label="Real-time demo system status"
      title={message}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
      <span>{message}</span>
    </div>
  );
}
