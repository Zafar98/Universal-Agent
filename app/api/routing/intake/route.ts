import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { resolveTenantConfig } from "@/lib/tenantConfig";
import { getEffectiveBusinessWorkspace } from "@/lib/businessWorkspaceStore";
import { routeIncomingCall } from "@/lib/callRouting";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedBusinessFromRequest(request);
    const body = await request.json().catch(() => ({}));

    const tenantId = String(body.tenantId || session?.tenantId || "");
    const account = await getBusinessAccountByTenantId(tenantId);
    const fallbackTenant = resolveTenantConfig(tenantId || undefined);

    const workspace = await getEffectiveBusinessWorkspace({
      tenantId: session?.tenantId || account?.tenantId || fallbackTenant.id,
      businessName: session?.businessName || account?.businessName || fallbackTenant.name,
      businessModelId: session?.businessModelId || account?.businessModelId || fallbackTenant.businessModelId,
    });

    const routing = await routeIncomingCall({
      workspace,
      intake: {
        callerName: body.callerName,
        callerPhone: body.callerPhone,
        callReason: body.callReason,
        dialedDepartmentHint: body.dialedDepartmentHint,
      },
    });

    return NextResponse.json({
      workspace,
      routing,
    });
  } catch (error) {
    console.error("Routing intake error:", error);
    return NextResponse.json({ error: "Unable to route the incoming call" }, { status: 500 });
  }
}