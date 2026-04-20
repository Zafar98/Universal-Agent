import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDashboardRequestAuthorized } from "@/lib/sessionAuth";

function isBypassPath(pathname: string) {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/blocked") return true;
  if (pathname === "/privacy" || pathname === "/terms") return true;
  if (pathname.startsWith("/api/security/blocked-check")) return true;
  if (pathname.startsWith("/api/auth/logout")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isBypassPath(pathname)) {
    try {
      const checkUrl = new URL("/api/security/blocked-check", request.url);
      const response = await fetch(checkUrl, {
        method: "GET",
        headers: {
          "x-original-user-agent": request.headers.get("user-agent") || "",
          "x-client-fingerprint": request.headers.get("x-client-fingerprint") || "",
          "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
          "x-real-ip": request.headers.get("x-real-ip") || "",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as { blocked?: boolean };
        if (data.blocked) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Access denied by security policy.", blocked: true },
              { status: 403 }
            );
          }

          const blockedUrl = new URL("/blocked", request.url);
          blockedUrl.searchParams.set("source", pathname);
          return NextResponse.redirect(blockedUrl);
        }
      }
    } catch {
      // Fail open to avoid accidental outage if block-check endpoint is unavailable.
    }
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
