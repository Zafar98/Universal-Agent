import { NextRequest, NextResponse } from "next/server";
import { authenticateBusiness, createBusinessSession } from "@/lib/businessAuthStore";
import { demoUserExistsByEmail } from "@/lib/demoUserStore";
import {
  buildDashboardSessionCookie,
  createAdminSessionToken,
  isAdminCredentials,
} from "@/lib/sessionAuth";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();
    const normalizedIdentifier = String(identifier || "").trim();
    const rawPassword = String(password || "");
    const trimmedPassword = rawPassword.trim();

    if (!normalizedIdentifier || !rawPassword) {
      return NextResponse.json(
        { error: "Email or phone and password are required" },
        { status: 400 }
      );
    }

    if (isAdminCredentials(normalizedIdentifier, rawPassword)) {
      const response = NextResponse.json({ ok: true, admin: true });
      response.cookies.set(buildDashboardSessionCookie(createAdminSessionToken()));
      return response;
    }

    let account = await authenticateBusiness({
      identifier: normalizedIdentifier,
      password: rawPassword,
    });

    if (!account && trimmedPassword !== rawPassword) {
      account = await authenticateBusiness({
        identifier: normalizedIdentifier,
        password: trimmedPassword,
      });
    }

    if (!account) {
      const looksLikeEmail = normalizedIdentifier.includes("@");
      if (looksLikeEmail && (await demoUserExistsByEmail(normalizedIdentifier))) {
        return NextResponse.json(
          {
            error:
              "That email exists in Demo accounts. Use the Demo login flow, or sign up for a business dashboard account.",
          },
          { status: 401 }
        );
      }
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
