import { NextResponse } from "next/server";
import { listBusinessModels } from "@/lib/tenantConfig";

export async function GET() {
  return NextResponse.json({ businessModels: listBusinessModels() });
}