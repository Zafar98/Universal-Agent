import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";
import { getBusinessAccountByTenantId } from "@/lib/businessAuthStore";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getPriceIdForPlan(plan: string): string | null {
  const normalized = plan.toLowerCase();
  if (normalized === "enterprise") {
    return process.env.STRIPE_PRICE_ENTERPRISE || null;
  }
  if (normalized === "growth") {
    return process.env.STRIPE_PRICE_GROWTH || null;
  }
  if (normalized === "starter") {
    return process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_DEMO_PRICE_ID || null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const principal = await getAuthenticatedBusinessFromRequest(request);
    if (!principal || principal.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getBusinessAccountByTenantId(principal.tenantId);
    if (!account) {
      return NextResponse.json({ error: "Business account not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const selectedPlan = String(body.selectedPlan || account.selectedPlan || "starter");
    const priceId = getPriceIdForPlan(selectedPlan);
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID for this plan is not configured." },
        { status: 503 }
      );
    }

    const appUrl = process.env.APP_URL || request.nextUrl.origin;
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: account.email || undefined,
      subscription_data: {
        metadata: {
          businessId: account.id,
          tenantId: account.tenantId,
          selectedPlan,
        },
      },
      metadata: {
        businessId: account.id,
        tenantId: account.tenantId,
        selectedPlan,
      },
      success_url: `${appUrl}/dashboard/setup?subscribed=1`,
      cancel_url: `${appUrl}/dashboard/setup?cancelled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Subscription checkout API error:", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
