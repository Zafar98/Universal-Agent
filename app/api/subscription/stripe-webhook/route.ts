import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBusinessAccountById,
  updateBusinessSubscriptionState,
} from "@/lib/businessAuthStore";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") || "";
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const businessId = String(checkoutSession.metadata?.businessId || "");
      if (!businessId) {
        return NextResponse.json({ received: true });
      }

      const account = await getBusinessAccountById(businessId);
      if (!account) {
        return NextResponse.json({ error: "Business account not found." }, { status: 404 });
      }

      let subscriptionEnd: string | null = null;
      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id;
      if (subscriptionId) {
        const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
        const subscription = subscriptionResponse as unknown as Stripe.Subscription;
        const currentPeriodEnd =
          typeof (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end === "number"
            ? (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
            : null;

        subscriptionEnd = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null;
      }

      await updateBusinessSubscriptionState({
        businessId: account.id,
        selectedPlan: String(checkoutSession.metadata?.selectedPlan || account.selectedPlan),
        subscriptionStatus: "active",
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionEndsAt: subscriptionEnd,
        activationCompletedAt: account.activationCompletedAt || new Date().toISOString(),
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const businessId = String(subscription.metadata?.businessId || "");
      if (businessId) {
        await updateBusinessSubscriptionState({
          businessId,
          subscriptionStatus: "canceled",
          subscriptionEndsAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
