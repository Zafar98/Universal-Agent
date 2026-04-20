"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BlockedIdentity = {
  id: string;
  identityType: string;
  identityValueHash: string;
  reason: string;
  severity: "medium" | "high";
  source: string;
  blockedAt: string;
  blockedBy: string;
  unblockedAt: string | null;
};

type BotRiskEvent = {
  id: string;
  ip: string;
  route: string;
  signalType: string;
  score: number;
  createdAt: string;
};

export default function AdminBansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState<BlockedIdentity[]>([]);
  const [riskEvents, setRiskEvents] = useState<BotRiskEvent[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json().catch(() => ({}));
        if (!sessionResponse.ok || !sessionData?.authenticated || !sessionData?.business?.isAdmin) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/security/bans");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || "Failed to load security bans.");
          return;
        }

        if (!active) {
          return;
        }

        setBlocked(Array.isArray(data.blocked) ? data.blocked : []);
        setRiskEvents(Array.isArray(data.riskEvents) ? data.riskEvents : []);
      } catch {
        setError("Unable to load security bans right now.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const onUnblock = async (id: string) => {
    const response = await fetch("/api/admin/security/bans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to unblock identity.");
      return;
    }

    setBlocked((prev) => prev.map((item) => (item.id === id ? { ...item, unblockedAt: new Date().toISOString() } : item)));
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading security controls...</div>;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <section style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "18px" }}>
          <h1 style={{ margin: 0, marginBottom: "8px", color: "#0f172a" }}>Security Bans</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            Review blocked identities, risk signals, and manually unblock false positives.
          </p>
          {error ? <p style={{ marginTop: "10px", color: "#b91c1c" }}>{error}</p> : null}
        </section>

        <section style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "18px" }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Blocked identities</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Type</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Hash</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Reason</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Blocked At</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>{row.identityType}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {row.identityValueHash.slice(0, 18)}...
                    </td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>{row.reason}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>{new Date(row.blockedAt).toLocaleString()}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>{row.unblockedAt ? "Unblocked" : "Active"}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                      {row.unblockedAt ? (
                        <span style={{ color: "#64748b" }}>-</span>
                      ) : (
                        <button
                          onClick={() => void onUnblock(row.id)}
                          style={{ border: "none", borderRadius: "8px", background: "#0f766e", color: "white", padding: "8px 10px", cursor: "pointer" }}
                        >
                          Unblock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "18px" }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Recent bot risk events</h2>
          <div style={{ display: "grid", gap: "8px" }}>
            {riskEvents.slice(0, 80).map((event) => (
              <div key={event.id} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  {event.signalType} · score {event.score}
                </div>
                <div style={{ color: "#475569", fontSize: "12px" }}>
                  {event.route} · {event.ip} · {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
