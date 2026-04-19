import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { activateSubscription } from "@/lib/demoUserStore";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/**
 * POST /api/demo/stripe-webhook
 *
 * Receives Stripe webhook events.  The only event we act on is
 * `checkout.session.completed`, which marks the demo user as subscribed so
 * they get full, unlimited access.
 *
 * Stripe sends the raw body; we verify the signature using the
 * STRIPE_WEBHOOK_SECRET env var before processing.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error("Stripe not configured:", err);
    return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
  }

  const sig = request.headers.get("stripe-signature") || "";
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const demoUserId = checkoutSession.metadata?.demoUserId;

    if (demoUserId) {
      try {
        await activateSubscription(demoUserId);
        console.log(`Demo subscription activated for user ${demoUserId}`);
      } catch (err) {
        console.error(`Failed to activate subscription for user ${demoUserId}:`, err);
        // Return 500 so Stripe retries the webhook delivery
        return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
