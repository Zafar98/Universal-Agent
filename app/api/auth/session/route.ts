import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, business: session });
}