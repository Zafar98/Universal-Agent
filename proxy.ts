import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDashboardRequestAuthorized } from "@/lib/sessionAuth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/api/call-logs");

  if (!needsAuth) {
    return NextResponse.next();
  }

  if (await isDashboardRequestAuthorized(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/call-logs")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/call-logs/:path*"],
};
