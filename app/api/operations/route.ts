import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import {
  listAllBusinessOperations,
  listAllHandoffQueueItems,
  listBusinessOperations,
  listHandoffQueueItems,
} from "@/lib/businessOperationsStore";
import { reconcileExternalStatusesForTenant } from "@/lib/externalStatusReconciliation";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedTenantId = request.nextUrl.searchParams.get("tenantId") || "";
  const forceReconcile = request.nextUrl.searchParams.get("reconcile") === "force";

  if (session.isAdmin) {
    if (requestedTenantId) {
      const reconciliation = await reconcileExternalStatusesForTenant({
        tenantId: requestedTenantId,
        force: forceReconcile,
      }).catch((error) => ({
        tenantId: requestedTenantId,
        checked: 0,
        updated: 0,
        escalated: 0,
        skipped: true,
        reason: error instanceof Error ? error.message : "reconciliation failed",
      }));

      const [operations, handoffs] = await Promise.all([
        listBusinessOperations(requestedTenantId),
        listHandoffQueueItems(requestedTenantId),
      ]);
      return NextResponse.json({ operations, handoffs, reconciliation });
    }

    const [operations, handoffs] = await Promise.all([
      listAllBusinessOperations(),
      listAllHandoffQueueItems(),
    ]);
    return NextResponse.json({ operations, handoffs });
  }

  const reconciliation = await reconcileExternalStatusesForTenant({
    tenantId: session.tenantId,
    force: forceReconcile,
  }).catch((error) => ({
    tenantId: session.tenantId,
    checked: 0,
    updated: 0,
    escalated: 0,
    skipped: true,
    reason: error instanceof Error ? error.message : "reconciliation failed",
  }));

  const [operations, handoffs] = await Promise.all([
    listBusinessOperations(session.tenantId),
    listHandoffQueueItems(session.tenantId),
  ]);

  return NextResponse.json({ operations, handoffs, reconciliation });
}
