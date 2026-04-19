import { NextResponse } from "next/server";
import { listTenantConfigs } from "@/lib/tenantConfig";

export async function GET() {
  return NextResponse.json({ tenants: listTenantConfigs() });
}
