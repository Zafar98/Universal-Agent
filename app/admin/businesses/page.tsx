"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VoiceId = string;

type LeadAgent = {
  name: string;
  role: string;
  objective: string;
  voiceStyle: string;
  realtimeVoice: VoiceId;
};

type Department = {
  id: string;
  name: string;
  agentName: string;
  purpose: string;
  queueTarget: string;
  realtimeVoice: VoiceId;
  supportedCalls: string[];
  escalationRules: string[];
};

type Workflow = {
  callType: string;
  tasks: string[];
  handoffPayloadFields: string[];
};

type Workspace = {
  id: string;
  name: string;
  businessModelId: string;
  businessModelName: string;
  overview: string;
  openingLine?: string;
  primaryBusinessUnit: string;
  leadAgent: LeadAgent;
  departments: Department[];
  workflowPlaybook: Workflow[];
  createdAt: string;
  updatedAt: string;
};

type BusinessRecord = {
  id: string;
  tenantId: string;
  businessName: string;
  businessModelId: string;
  agentCount: number;
  selectedPlan: string;
  selectedIntegration: string;
  subscriptionStatus: string;
  integrationReady: boolean;
  activationCompletedAt: string | null;
  createdAt: string;
  monthlyCost: number;
  workspace: Workspace;
};

type Template = {
  id: string;
  tenantId: string;
  name: string;
  summary: string;
  overview: string;
};

type SessionResponse = {
  authenticated?: boolean;
  business?: {
    isAdmin?: boolean;
  };
};

type EditorDepartment = {
  id: string;
  name: string;
  agentName: string;
  purpose: string;
  queueTarget: string;
  realtimeVoice: VoiceId;
  supportedCallsText: string;
  escalationRulesText: string;
};

type EditorWorkflow = {
  callType: string;
  tasksText: string;
  handoffFieldsText: string;
};

type EditorState = {
  businessId: string;
  tenantId: string;
  businessName: string;
  businessModelId: string;
  agentCount: number;
  selectedPlan: string;
  selectedIntegration: string;
  subscriptionStatus: string;
  overview: string;
  openingLine: string;
  primaryBusinessUnit: string;
  leadAgent: LeadAgent;
  departments: EditorDepartment[];
  workflows: EditorWorkflow[];
};

type CreateFormState = {
  businessName: string;
  businessModelId: string;
  agentCount: number;
  selectedPlan: string;
  selectedIntegration: string;
  subscriptionStatus: string;
  email: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(15,23,42,0.78)",
  color: "#e2e8f0",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/) 
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapBusinessToEditorState(business: BusinessRecord): EditorState {
  return {
    businessId: business.id,
    tenantId: business.tenantId,
    businessName: business.businessName,
    businessModelId: business.businessModelId,
    agentCount: business.agentCount,
    selectedPlan: business.selectedPlan,
    selectedIntegration: business.selectedIntegration,
    subscriptionStatus: business.subscriptionStatus,
    overview: business.workspace.overview,
    openingLine: business.workspace.openingLine || "",
    primaryBusinessUnit: business.workspace.primaryBusinessUnit,
    leadAgent: { ...business.workspace.leadAgent },
    departments: business.workspace.departments.map((department) => ({
      id: department.id,
      name: department.name,
      agentName: department.agentName,
      purpose: department.purpose,
      queueTarget: department.queueTarget,
      realtimeVoice: department.realtimeVoice,
      supportedCallsText: department.supportedCalls.join("\n"),
      escalationRulesText: department.escalationRules.join("\n"),
    })),
    workflows: business.workspace.workflowPlaybook.map((workflow) => ({
      callType: workflow.callType,
      tasksText: workflow.tasks.join("\n"),
      handoffFieldsText: workflow.handoffPayloadFields.join("\n"),
    })),
  };
}

export default function AdminBusinessesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [voices, setVoices] = useState<VoiceId[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    businessName: "",
    businessModelId: "housing-association",
    agentCount: 1,
    selectedPlan: "starter",
    selectedIntegration: "website-widget",
    subscriptionStatus: "pending_payment",
    email: "",
  });

  async function loadBusinesses() {
    const [sessionResponse, businessesResponse] = await Promise.all([
      fetch("/api/auth/session"),
      fetch("/api/admin/businesses"),
    ]);

    const sessionData = (await sessionResponse.json().catch(() => ({}))) as SessionResponse;
    if (!sessionResponse.ok || !sessionData.authenticated || !sessionData.business?.isAdmin) {
      router.replace("/admin/login");
      return;
    }

    const data = await businessesResponse.json().catch(() => ({}));
    if (!businessesResponse.ok) {
      throw new Error(data.error || "Unable to load businesses.");
    }

    const nextBusinesses = Array.isArray(data.businesses) ? (data.businesses as BusinessRecord[]) : [];
    setBusinesses(nextBusinesses);
    setTemplates(Array.isArray(data.templates) ? (data.templates as Template[]) : []);
    setVoices(Array.isArray(data.voices) ? (data.voices as VoiceId[]) : []);

    if (nextBusinesses.length > 0) {
      const activeBusiness = nextBusinesses.find((item) => item.id === selectedBusinessId) || nextBusinesses[0];
      setSelectedBusinessId(activeBusiness.id);
      setEditor(mapBusinessToEditorState(activeBusiness));
    } else {
      setSelectedBusinessId("");
      setEditor(null);
    }
  }

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        await loadBusinesses();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load businesses.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [router]);

  const filteredBusinesses = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return businesses;
    }

    return businesses.filter((business) => {
      return (
        business.businessName.toLowerCase().includes(needle) ||
        business.tenantId.toLowerCase().includes(needle) ||
        business.businessModelId.toLowerCase().includes(needle)
      );
    });
  }, [businesses, search]);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId]
  );

  const updateEditor = (patch: Partial<EditorState>) => {
    setEditor((current) => (current ? { ...current, ...patch } : current));
  };

  const selectBusiness = (business: BusinessRecord) => {
    setSelectedBusinessId(business.id);
    setEditor(mapBusinessToEditorState(business));
    setError("");
    setSuccess("");
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          ...createForm,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to create business.");
      }
      await loadBusinesses();
      if (data.business) {
        selectBusiness(data.business as BusinessRecord);
      }
      setCreateForm((current) => ({ ...current, businessName: "", email: "" }));
      setSuccess("Business created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create business.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedBusiness) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "duplicate",
          sourceTenantId: selectedBusiness.tenantId,
          businessName: `${selectedBusiness.businessName} Copy`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to duplicate business.");
      }
      await loadBusinesses();
      if (data.business) {
        selectBusiness(data.business as BusinessRecord);
      }
      setSuccess("Business duplicated.");
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : "Unable to duplicate business.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (resetFromTemplate = false) => {
    if (!editor) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: editor.businessId,
          tenantId: editor.tenantId,
          businessName: editor.businessName,
          businessModelId: editor.businessModelId,
          agentCount: editor.agentCount,
          selectedPlan: editor.selectedPlan,
          selectedIntegration: editor.selectedIntegration,
          subscriptionStatus: editor.subscriptionStatus,
          resetFromTemplate,
          workspace: {
            overview: editor.overview,
            openingLine: editor.openingLine,
            primaryBusinessUnit: editor.primaryBusinessUnit,
            leadAgent: editor.leadAgent,
            departments: editor.departments.map((department) => ({
              id: department.id,
              name: department.name,
              agentName: department.agentName,
              purpose: department.purpose,
              queueTarget: department.queueTarget,
              realtimeVoice: department.realtimeVoice,
              supportedCalls: splitLines(department.supportedCallsText),
              escalationRules: splitLines(department.escalationRulesText),
            })),
            workflowPlaybook: editor.workflows.map((workflow) => ({
              callType: workflow.callType,
              tasks: splitLines(workflow.tasksText),
              handoffPayloadFields: splitLines(workflow.handoffFieldsText),
            })),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to save business.");
      }
      await loadBusinesses();
      if (data.business) {
        selectBusiness(data.business as BusinessRecord);
      }
      setSuccess(resetFromTemplate ? "Business reset from template." : "Business saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save business.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#050816", color: "#cbd5e1" }}>
        Loading business builder...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 520px at 8% 0%, rgba(56,189,248,0.14), transparent 62%), linear-gradient(145deg, #050816 0%, #0b1020 55%, #111827 100%)",
        color: "#e2e8f0",
        padding: "24px 16px 48px",
        fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Business Builder
            </div>
            <h1 style={{ margin: "10px 0 6px", fontSize: 34 }}>Create, duplicate, and tune businesses</h1>
            <p style={{ margin: 0, color: "#94a3b8", maxWidth: 720, lineHeight: 1.6 }}>
              Launch businesses from templates, change agent voice and opening line, and edit departments and workflows without code.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/admin" style={{ color: "#e0f2fe", textDecoration: "none", border: "1px solid rgba(103,232,249,0.32)", padding: "10px 14px", borderRadius: 10 }}>
              Back to Admin
            </Link>
            <Link href="/dashboard" style={{ color: "#e0f2fe", textDecoration: "none", border: "1px solid rgba(103,232,249,0.32)", padding: "10px 14px", borderRadius: 10 }}>
              Business Dashboard
            </Link>
          </div>
        </div>

        {error ? <div style={{ marginBottom: 14, background: "rgba(239,68,68,0.14)", border: "1px solid rgba(248,113,113,0.4)", color: "#fecaca", padding: "12px 14px", borderRadius: 12 }}>{error}</div> : null}
        {success ? <div style={{ marginBottom: 14, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(52,211,153,0.4)", color: "#bbf7d0", padding: "12px 14px", borderRadius: 12 }}>{success}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 18, padding: 16 }}>
              <div style={{ color: "#e0f2fe", fontWeight: 800, marginBottom: 12 }}>New Business</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Business Name</label>
                  <input style={inputStyle} value={createForm.businessName} onChange={(event) => setCreateForm((current) => ({ ...current, businessName: event.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Template</label>
                  <select style={inputStyle} value={createForm.businessModelId} onChange={(event) => setCreateForm((current) => ({ ...current, businessModelId: event.target.value }))}>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Plan</label>
                    <select style={inputStyle} value={createForm.selectedPlan} onChange={(event) => setCreateForm((current) => ({ ...current, selectedPlan: event.target.value }))}>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select style={inputStyle} value={createForm.subscriptionStatus} onChange={(event) => setCreateForm((current) => ({ ...current, subscriptionStatus: event.target.value }))}>
                      <option value="pending_payment">Pending</option>
                      <option value="trialing">Trialing</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past Due</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Integration</label>
                    <select style={inputStyle} value={createForm.selectedIntegration} onChange={(event) => setCreateForm((current) => ({ ...current, selectedIntegration: event.target.value }))}>
                      <option value="website-widget">Website Widget</option>
                      <option value="phone-number">Phone Number</option>
                      <option value="api-webhooks">API & Webhooks</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Agent Count</label>
                    <input type="number" min={1} max={50} style={inputStyle} value={createForm.agentCount} onChange={(event) => setCreateForm((current) => ({ ...current, agentCount: Number(event.target.value || 1) }))} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input style={inputStyle} value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <button onClick={() => void handleCreate()} disabled={saving} style={{ border: "none", borderRadius: 12, padding: "12px 14px", background: "linear-gradient(135deg, #06b6d4, #2563eb)", color: "white", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Working..." : "Create Business"}
                </button>
                <button onClick={() => void handleDuplicate()} disabled={saving || !selectedBusiness} style={{ border: "1px solid rgba(56,189,248,0.4)", borderRadius: 12, padding: "12px 14px", background: "rgba(14,165,233,0.12)", color: "#e0f2fe", fontWeight: 800, cursor: saving || !selectedBusiness ? "not-allowed" : "pointer" }}>
                  Duplicate Selected Business
                </button>
              </div>
            </div>

            <div style={{ background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 18, padding: 16 }}>
              <div style={{ color: "#e0f2fe", fontWeight: 800, marginBottom: 12 }}>Businesses</div>
              <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Search businesses" value={search} onChange={(event) => setSearch(event.target.value)} />
              <div style={{ display: "grid", gap: 8, maxHeight: 720, overflow: "auto" }}>
                {filteredBusinesses.map((business) => {
                  const active = business.id === selectedBusinessId;
                  return (
                    <button key={business.id} onClick={() => selectBusiness(business)} style={{ textAlign: "left", borderRadius: 14, border: active ? "1px solid rgba(56,189,248,0.52)" : "1px solid rgba(148,163,184,0.12)", background: active ? "rgba(14,165,233,0.16)" : "rgba(255,255,255,0.03)", color: "#e2e8f0", padding: "12px 12px", cursor: "pointer" }}>
                      <div style={{ fontWeight: 700 }}>{business.businessName}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{business.tenantId}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 11 }}>
                        <span style={{ color: "#67e8f9" }}>{business.businessModelId}</span>
                        <span style={{ color: "#fde68a" }}>{business.selectedPlan}</span>
                        <span style={{ color: business.integrationReady ? "#86efac" : "#fca5a5" }}>{business.integrationReady ? "Ready" : "Pending"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 18, padding: 18 }}>
            {editor ? (
              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Business Editor</div>
                    <h2 style={{ margin: "8px 0 4px", fontSize: 28 }}>{editor.businessName}</h2>
                    <div style={{ color: "#94a3b8" }}>{editor.tenantId}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "start", flexWrap: "wrap" }}>
                    <button onClick={() => void handleSave(true)} disabled={saving} style={{ border: "1px solid rgba(251,191,36,0.4)", borderRadius: 10, padding: "10px 12px", background: "rgba(245,158,11,0.12)", color: "#fde68a", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>Reset From Template</button>
                    <button onClick={() => void handleSave(false)} disabled={saving} style={{ border: "none", borderRadius: 10, padding: "10px 14px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Business Name</label>
                    <input style={inputStyle} value={editor.businessName} onChange={(event) => updateEditor({ businessName: event.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Template</label>
                    <select style={inputStyle} value={editor.businessModelId} onChange={(event) => updateEditor({ businessModelId: event.target.value })}>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Plan</label>
                    <select style={inputStyle} value={editor.selectedPlan} onChange={(event) => updateEditor({ selectedPlan: event.target.value })}>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select style={inputStyle} value={editor.subscriptionStatus} onChange={(event) => updateEditor({ subscriptionStatus: event.target.value })}>
                      <option value="pending_payment">Pending</option>
                      <option value="trialing">Trialing</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past Due</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Integration</label>
                    <select style={inputStyle} value={editor.selectedIntegration} onChange={(event) => updateEditor({ selectedIntegration: event.target.value })}>
                      <option value="website-widget">Website Widget</option>
                      <option value="phone-number">Phone Number</option>
                      <option value="api-webhooks">API & Webhooks</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Agent Count</label>
                    <input type="number" min={1} max={50} style={inputStyle} value={editor.agentCount} onChange={(event) => updateEditor({ agentCount: Number(event.target.value || 1) })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Primary Unit</label>
                    <input style={inputStyle} value={editor.primaryBusinessUnit} onChange={(event) => updateEditor({ primaryBusinessUnit: event.target.value })} />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Overview</label>
                    <textarea style={{ ...inputStyle, minHeight: 96 }} value={editor.overview} onChange={(event) => updateEditor({ overview: event.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Opening Line</label>
                    <input style={inputStyle} value={editor.openingLine} onChange={(event) => updateEditor({ openingLine: event.target.value })} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(148,163,184,0.16)", paddingTop: 16 }}>
                  <div style={{ color: "#e0f2fe", fontWeight: 800, marginBottom: 12 }}>Lead Agent</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Agent Name</label>
                      <input style={inputStyle} value={editor.leadAgent.name} onChange={(event) => updateEditor({ leadAgent: { ...editor.leadAgent, name: event.target.value } })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <input style={inputStyle} value={editor.leadAgent.role} onChange={(event) => updateEditor({ leadAgent: { ...editor.leadAgent, role: event.target.value } })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Voice</label>
                      <select style={inputStyle} value={editor.leadAgent.realtimeVoice} onChange={(event) => updateEditor({ leadAgent: { ...editor.leadAgent, realtimeVoice: event.target.value } })}>
                        {voices.map((voice) => <option key={voice} value={voice}>{voice}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Voice Style</label>
                      <input style={inputStyle} value={editor.leadAgent.voiceStyle} onChange={(event) => updateEditor({ leadAgent: { ...editor.leadAgent, voiceStyle: event.target.value } })} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={labelStyle}>Objective</label>
                    <textarea style={{ ...inputStyle, minHeight: 84 }} value={editor.leadAgent.objective} onChange={(event) => updateEditor({ leadAgent: { ...editor.leadAgent, objective: event.target.value } })} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(148,163,184,0.16)", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ color: "#e0f2fe", fontWeight: 800 }}>Departments</div>
                    <button onClick={() => updateEditor({ departments: [...editor.departments, { id: `department-${editor.departments.length + 1}`, name: "New Department", agentName: "Agent", purpose: "", queueTarget: "", realtimeVoice: voices[0] || "ash", supportedCallsText: "", escalationRulesText: "" }] })} style={{ border: "1px solid rgba(56,189,248,0.4)", borderRadius: 10, padding: "8px 10px", background: "rgba(14,165,233,0.12)", color: "#e0f2fe", cursor: "pointer" }}>Add Department</button>
                  </div>
                  <div style={{ display: "grid", gap: 14 }}>
                    {editor.departments.map((department, index) => (
                      <div key={`${department.id}-${index}`} style={{ border: "1px solid rgba(148,163,184,0.14)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                          <strong>Department {index + 1}</strong>
                          <button onClick={() => updateEditor({ departments: editor.departments.filter((_, itemIndex) => itemIndex !== index) })} style={{ border: "none", background: "transparent", color: "#fda4af", cursor: "pointer" }}>Remove</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                          <input style={inputStyle} placeholder="Department name" value={department.name} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} />
                          <input style={inputStyle} placeholder="Agent name" value={department.agentName} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, agentName: event.target.value } : item) })} />
                          <select style={inputStyle} value={department.realtimeVoice} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, realtimeVoice: event.target.value } : item) })}>
                            {voices.map((voice) => <option key={voice} value={voice}>{voice}</option>)}
                          </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <input style={inputStyle} placeholder="Queue target" value={department.queueTarget} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, queueTarget: event.target.value } : item) })} />
                          <input style={inputStyle} placeholder="Department id" value={department.id} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, id: event.target.value } : item) })} />
                        </div>
                        <textarea style={{ ...inputStyle, minHeight: 80, marginTop: 12 }} placeholder="Purpose" value={department.purpose} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, purpose: event.target.value } : item) })} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <textarea style={{ ...inputStyle, minHeight: 88 }} placeholder="Supported calls, one per line" value={department.supportedCallsText} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, supportedCallsText: event.target.value } : item) })} />
                          <textarea style={{ ...inputStyle, minHeight: 88 }} placeholder="Escalation rules, one per line" value={department.escalationRulesText} onChange={(event) => updateEditor({ departments: editor.departments.map((item, itemIndex) => itemIndex === index ? { ...item, escalationRulesText: event.target.value } : item) })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(148,163,184,0.16)", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ color: "#e0f2fe", fontWeight: 800 }}>Workflow Playbook</div>
                    <button onClick={() => updateEditor({ workflows: [...editor.workflows, { callType: "New workflow", tasksText: "", handoffFieldsText: "" }] })} style={{ border: "1px solid rgba(56,189,248,0.4)", borderRadius: 10, padding: "8px 10px", background: "rgba(14,165,233,0.12)", color: "#e0f2fe", cursor: "pointer" }}>Add Workflow</button>
                  </div>
                  <div style={{ display: "grid", gap: 14 }}>
                    {editor.workflows.map((workflow, index) => (
                      <div key={`${workflow.callType}-${index}`} style={{ border: "1px solid rgba(148,163,184,0.14)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                          <strong>Workflow {index + 1}</strong>
                          <button onClick={() => updateEditor({ workflows: editor.workflows.filter((_, itemIndex) => itemIndex !== index) })} style={{ border: "none", background: "transparent", color: "#fda4af", cursor: "pointer" }}>Remove</button>
                        </div>
                        <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Call type" value={workflow.callType} onChange={(event) => updateEditor({ workflows: editor.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, callType: event.target.value } : item) })} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <textarea style={{ ...inputStyle, minHeight: 96 }} placeholder="Tasks, one per line" value={workflow.tasksText} onChange={(event) => updateEditor({ workflows: editor.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, tasksText: event.target.value } : item) })} />
                          <textarea style={{ ...inputStyle, minHeight: 96 }} placeholder="Handoff payload fields, one per line" value={workflow.handoffFieldsText} onChange={(event) => updateEditor({ workflows: editor.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, handoffFieldsText: event.target.value } : item) })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "#94a3b8" }}>Create a business or select one from the list.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
