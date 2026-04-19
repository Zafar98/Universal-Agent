import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenantConfig } from "@/lib/tenantConfig";
import { getAuthenticatedBusinessFromCookies } from "@/lib/sessionAuth";
import { getEffectiveBusinessWorkspace } from "@/lib/businessWorkspaceStore";

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await getAuthenticatedBusinessFromCookies(await cookies());

  if (!session) {
    redirect("/login");
  }

  if (
    !session.isAdmin &&
    session.subscriptionStatus !== "trialing" &&
    session.subscriptionStatus !== "active"
  ) {
    redirect("/dashboard/setup");
  }

  if (tenantId !== session.tenantId) {
    redirect(`/dashboard/${session.tenantId}`);
  }

  const tenant = await getEffectiveBusinessWorkspace({
    tenantId: session.tenantId,
    businessName: session.businessName,
    businessModelId: session.businessModelId,
  }).catch(() => resolveTenantConfig(tenantId));

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "linear-gradient(135deg, #f7faff 0%, #e8f0ff 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <div style={{ color: "#4f6ea8", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {tenant.businessModelName} Operating Model
            </div>
            <h1 style={{ margin: "6px 0 0", color: "#102349", fontSize: "34px" }}>{tenant.name}</h1>
            <p style={{ color: "#4d6898", marginTop: "10px", maxWidth: "760px" }}>{tenant.overview}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href={`/dashboard/${tenant.id}/audit`}
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "10px 14px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Audit Trail
            </Link>
            <Link
              href="/dashboard"
              style={{
                border: "1px solid #bfd1f5",
                borderRadius: "999px",
                background: "white",
                color: "#21447f",
                padding: "10px 14px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back to Portfolio
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns: "1.1fr 1.9fr",
            gap: "18px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              border: "1px solid #dbe7ff",
              boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
              padding: "18px",
            }}
          >
            <div style={{ color: "#5a73a8", fontSize: "13px", marginBottom: "8px" }}>Lead Agent</div>
            <div style={{ color: "#12284f", fontSize: "26px", fontWeight: 800 }}>{tenant.leadAgent.name}</div>
            <div style={{ color: "#315083", fontWeight: 700, marginTop: "4px" }}>{tenant.leadAgent.role}</div>
            <p style={{ color: "#49648f", marginTop: "12px", lineHeight: 1.5 }}>{tenant.leadAgent.objective}</p>

            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", background: "#f6f9ff", border: "1px solid #e0eaff" }}>
              <div style={{ color: "#5a73a8", fontSize: "12px", marginBottom: "6px" }}>Voice Style</div>
              <div style={{ color: "#17315f", fontWeight: 600 }}>{tenant.leadAgent.voiceStyle}</div>
            </div>

            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", background: "#f6f9ff", border: "1px solid #e0eaff" }}>
              <div style={{ color: "#5a73a8", fontSize: "12px", marginBottom: "6px" }}>Primary Routing</div>
              <div style={{ color: "#17315f", fontWeight: 600 }}>{tenant.primaryBusinessUnit}</div>
            </div>

            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <div style={{ color: "#9a3412", fontSize: "12px", marginBottom: "6px" }}>Public Inbound Line</div>
              <div style={{ color: "#7c2d12", fontWeight: 700 }}>/call/{tenant.id}</div>
              <p style={{ color: "#9a3412", fontSize: "12px", lineHeight: 1.5, margin: "8px 0 0" }}>
                Send callers to this business line so the intake router can identify the caller before answer and connect them to the best-fit department agent.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "18px",
              border: "1px solid #dbe7ff",
              boxShadow: "0 8px 22px rgba(16,24,40,0.06)",
              padding: "18px",
            }}
          >
            <div style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "18px", marginBottom: "14px" }}>
              Department Agents
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              {tenant.departments.map((department) => (
                <div
                  key={department.id}
                  style={{
                    border: "1px solid #e4ecff",
                    borderRadius: "16px",
                    padding: "16px",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)",
                  }}
                >
                  <div style={{ color: "#5a73a8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {department.name}
                  </div>
                  <div style={{ color: "#14305c", fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>
                    {department.agentName}
                  </div>
                  <p style={{ color: "#4a648f", marginTop: "10px", minHeight: "64px", lineHeight: 1.45 }}>
                    {department.purpose}
                  </p>

                  <div style={{ marginTop: "10px", color: "#20417c", fontWeight: 700 }}>Queue target: {department.queueTarget}</div>

                  <div style={{ marginTop: "12px" }}>
                    <div style={{ color: "#5a73a8", fontSize: "12px", marginBottom: "6px" }}>Supported Calls</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {department.supportedCalls.map((call) => (
                        <span
                          key={call}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "999px",
                            background: "#eef4ff",
                            color: "#23457d",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {call}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <div style={{ color: "#5a73a8", fontSize: "12px", marginBottom: "6px" }}>Escalation Rules</div>
                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#365582", lineHeight: 1.5 }}>
                      {department.escalationRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
