import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/sessionAuth";
import { cookies } from "next/headers";
import { deleteBusinessSession } from "@/lib/businessAuthStore";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value || "";

  await deleteBusinessSession(sessionToken);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DASHBOARD_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
