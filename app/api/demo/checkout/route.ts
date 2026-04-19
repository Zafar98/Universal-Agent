import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDemoSession, DEMO_COOKIE_NAME } from "@/lib/demoUserStore";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/**
 * POST /api/demo/checkout
 *
 * Creates a Stripe Checkout Session for the demo subscription plan.
 * The user must be authenticated as a demo user.
 *
 * Response: { checkoutUrl: string }
 */
export async function POST(request: NextRequest) {
  const priceId = process.env.STRIPE_DEMO_PRICE_ID;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!priceId) {
    return NextResponse.json(
      { error: "Subscription payments are not configured yet. Contact support." },
      { status: 503 }
    );
  }

  const token = request.cookies.get(DEMO_COOKIE_NAME)?.value || "";
  const session = token ? await getDemoSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "You must be signed in to subscribe." }, { status: 401 });
  }

  if (session.subscribed) {
    return NextResponse.json({ error: "You are already subscribed." }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Payment system is not configured. Contact support." },
      { status: 503 }
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.email,
    // Embed the demo user ID in metadata so the webhook can activate the account
    metadata: {
      demoUserId: session.userId,
    },
    success_url: `${appUrl}/demo?subscribed=1`,
    cancel_url: `${appUrl}/demo?cancelled=1`,
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
