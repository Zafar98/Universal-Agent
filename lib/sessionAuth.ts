import { NextRequest } from "next/server";
import { BusinessSession, getBusinessSession } from "@/lib/businessAuthStore";

export const DASHBOARD_COOKIE_NAME = "dashboard_session";
const ADMIN_SESSION_PREFIX = "admin::";

export type DashboardPrincipal =
  | (BusinessSession & { isAdmin?: false })
  | {
      isAdmin: true;
      sessionToken: string;
      businessId: "admin";
      businessName: string;
      tenantId: "__all__";
      businessModelId: "housing-association";
      agentCount: 0;
      selectedPlan: "enterprise";
      selectedIntegration: "api-webhooks";
      subscriptionStatus: "active";
      subscriptionEndsAt: null;
      integrationReady: true;
      activationCompletedAt: string;
      email: null;
      phone: null;
      verificationMethod: "email";
      expiresAt: string;
    };

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function getAdminCredentials() {
  return {
    identifier: process.env.ADMIN_LOGIN_IDENTIFIER || "admin@platform.local",
    password: process.env.ADMIN_LOGIN_PASSWORD || "admin123",
  };
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.DASHBOARD_SESSION_SECRET || "change-admin-session-secret";
}

export function createAdminSessionToken(): string {
  return `${ADMIN_SESSION_PREFIX}${getAdminSessionSecret()}`;
}

export function isAdminSessionToken(token: string): boolean {
  return token === createAdminSessionToken();
}

export function isAdminCredentials(identifier: string, password: string): boolean {
  const expected = getAdminCredentials();
  return identifier.trim().toLowerCase() === expected.identifier.toLowerCase() && password === expected.password;
}

function createAdminPrincipal(sessionToken: string): DashboardPrincipal {
  return {
    isAdmin: true,
    sessionToken,
    businessId: "admin",
    businessName: "Platform Admin",
    tenantId: "__all__",
    businessModelId: "housing-association",
    agentCount: 0,
    selectedPlan: "enterprise",
    selectedIntegration: "api-webhooks",
    subscriptionStatus: "active",
    subscriptionEndsAt: null,
    integrationReady: true,
    activationCompletedAt: new Date().toISOString(),
    email: null,
    phone: null,
    verificationMethod: "email",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  };
}

export async function getAuthenticatedBusinessFromRequest(
  request: NextRequest
): Promise<DashboardPrincipal | null> {
  const sessionToken = request.cookies.get(DASHBOARD_COOKIE_NAME)?.value || "";
  if (isAdminSessionToken(sessionToken)) {
    return createAdminPrincipal(sessionToken);
  }

  return getBusinessSession(sessionToken);
}

export async function getAuthenticatedBusinessFromCookies(
  cookieStore: CookieReader
): Promise<DashboardPrincipal | null> {
  const sessionToken = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value || "";
  if (isAdminSessionToken(sessionToken)) {
    return createAdminPrincipal(sessionToken);
  }

  return getBusinessSession(sessionToken);
}

export function buildDashboardSessionCookie(sessionToken: string) {
  return {
    name: DASHBOARD_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function isDashboardRequestAuthorized(request: NextRequest): Promise<boolean> {
  const session = await getAuthenticatedBusinessFromRequest(request);
  return Boolean(session);
}
