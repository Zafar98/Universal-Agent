"use client";

import { useEffect, useState } from "react";

interface Agent {
  id: string;
  departmentName: string;
  agentName: string;
  description?: string;
  isActive: boolean;
  isPremium: boolean;
  monthlyAgentCost: number;
}

interface AgentStats {
  plan: string;
  totalAgents: number;
  includedAgents: number;
  premiumAgents: number;
  canAddMore: boolean;
  nextAgentPrice: number;
}

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    departmentName: "",
    agentName: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(data.agents || []);
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  const handleAddAgent = async () => {
    if (!formData.departmentName.trim() || !formData.agentName.trim()) {
      setError("Department and agent names are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agents/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add agent");
      }

      const data = await res.json();
      setAgents([...agents, data.agent]);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalAgents: data.stats.totalAgents,
              premiumAgents: data.stats.premiumAgents,
            }
          : null
      );

      setFormData({ departmentName: "", agentName: "", description: "" });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
        Loading agents...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 800, color: "#e0f2fe" }}>
          AI Agents & Departments
        </h2>
        <p style={{ color: "#cbd5e1", margin: "0" }}>
          Manage your AI agents for different departments and support channels
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: "10px",
            backgroundColor: "rgba(15,23,42,0.4)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                Active Plan
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#a5f3fc", textTransform: "capitalize" }}>
                {stats.plan}
              </div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                Total Agents
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
                {stats.totalAgents}
              </div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                Included
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#22c55e" }}>
                {stats.includedAgents} agents
              </div>
            </div>
            {stats.premiumAgents > 0 && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                  Premium
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f59e0b" }}>
                  {stats.premiumAgents} agents
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#7f1d1d",
            border: "1px solid #dc2626",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Agents List */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "#e0f2fe" }}>
          Current Agents
        </h3>

        {agents.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              border: "1px dashed rgba(148,163,184,0.3)",
              borderRadius: "8px",
              color: "#64748b",
          }}
          >
            No agents created yet. Add your first agent below.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  padding: "16px",
                  border: "1px solid rgba(148,163,184,0.25)",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15,23,42,0.4)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "4px" }}>
                    {agent.agentName}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "4px" }}>
                    Department: {agent.departmentName}
                  </div>
                  {agent.description && (
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                      {agent.description}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {agent.isPremium ? (
                    <div style={{ color: "#f59e0b", fontSize: "13px", fontWeight: 600 }}>
                      Premium
                      <br />
                      £{agent.monthlyAgentCost.toFixed(0)}/mo
                    </div>
                  ) : (
                    <div style={{ color: "#22c55e", fontSize: "13px", fontWeight: 600 }}>
                      Included
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Agent Form */}
      <div style={{ marginBottom: "24px" }}>
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "14px",
              transition: "background 0.2s",
            }}
          >
            + Add New Agent
          </button>
        ) : (
          <div
            style={{
              padding: "20px",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "10px",
              backgroundColor: "rgba(30,58,138,0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 16px", color: "#e0f2fe", fontSize: "16px", fontWeight: 700 }}>
              Create New Agent
            </h4>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "13px", marginBottom: "4px", fontWeight: 600 }}>
                Department Name
              </label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="e.g., Support, Sales, Billing"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(148,163,184,0.3)",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "13px", marginBottom: "4px", fontWeight: 600 }}>
                Agent Name
              </label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                placeholder="e.g., Support Agent Alpha"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(148,163,184,0.3)",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "13px", marginBottom: "4px", fontWeight: 600 }}>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will this agent handle?"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(148,163,184,0.3)",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  minHeight: "60px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {stats && stats.totalAgents >= stats.includedAgents && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "6px",
                  color: "#fed7aa",
                  fontSize: "13px",
                }}
              >
                ⚠️ This agent will be a premium addition and cost £{stats.nextAgentPrice}/month
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleAddAgent}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "13px",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? "Creating..." : "Create Agent"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "rgba(148,163,184,0.2)",
                  color: "#cbd5e1",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      {stats && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.3)",
            borderRadius: "8px",
            color: "#a5f3fc",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          <strong>Plan Details:</strong> Your {stats.plan.toUpperCase()} plan includes <strong>{stats.includedAgents}</strong> agents. 
          {stats.premiumAgents > 0
            ? ` You have ${stats.premiumAgents} premium agent(s) costing £${stats.nextAgentPrice * stats.premiumAgents}/month total.`
            : ` You can add up to ${999 - stats.totalAgents} more agents as premium additions.`}
        </div>
      )}
    </div>
  );
}
