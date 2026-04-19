import { NextRequest, NextResponse } from "next/server";
import { authenticateBusiness, createBusinessSession } from "@/lib/businessAuthStore";
import {
  buildDashboardSessionCookie,
  createAdminSessionToken,
  isAdminCredentials,
} from "@/lib/sessionAuth";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email or phone and password are required" },
        { status: 400 }
      );
    }

    if (isAdminCredentials(String(identifier), String(password))) {
      const response = NextResponse.json({ ok: true, admin: true });
      response.cookies.set(buildDashboardSessionCookie(createAdminSessionToken()));
      return response;
    }

    const account = await authenticateBusiness({
      identifier: String(identifier),
      password: String(password),
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid email, phone, or password" }, { status: 401 });
    }

    if (!account.verifiedAt) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    const session = await createBusinessSession(account);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(buildDashboardSessionCookie(session.sessionToken));

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
