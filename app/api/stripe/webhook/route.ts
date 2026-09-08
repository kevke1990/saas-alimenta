import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe";
import { mapStripeStatus, periodEnd, planForSubscription } from "@/lib/stripe-subscription";
import { stripeWebhookAction } from "@/lib/stripe-events";

function planFromPrice(priceId: string) { return db.stripePlan.findFirst({ where: { stripePriceId: priceId } }); }

async function syncSubscription(s: Stripe.Subscription) {
  const customer = String(s.customer);
  const user = await db.user.findFirst({ where: { stripeCustomerId: customer } });
  if (!user) return;
  const item = s.items.data[0];
  const priceId = String(item?.price?.id || "");
  const plan = priceId ? await planFromPrice(priceId) : null;
  const mapped = mapStripeStatus(s.status);
  const subscriptionEndsAt = periodEnd((s as any).current_period_end);
  const planValue = planForSubscription(s.status, plan?.key);
  await db.user.update({ where: { id: user.id }, data: { plan: planValue, stripeSubscriptionId: s.id, subscriptionStatus: mapped, subscriptionEndsAt } });
  await db.subscription.upsert({ where: { userId: user.id }, update: { stripeSubscriptionId: s.id, stripePriceId: priceId, status: mapped, currentPeriodEnd: subscriptionEndsAt }, create: { userId: user.id, stripeSubscriptionId: s.id, stripePriceId: priceId, status: mapped, currentPeriodEnd: subscriptionEndsAt } });
}

async function markPaymentFailed(inv: Stripe.Invoice) {
  const customer = String(inv.customer);
  const user = await db.user.findFirst({ where: { stripeCustomerId: customer } });
  if (!user) return;
  await db.user.update({ where: { id: user.id }, data: { subscriptionStatus: "PAST_DUE" } });
  const subscriptionId = String((inv as any).subscription || "");
  if (subscriptionId) await db.subscription.updateMany({ where: { userId: user.id, stripeSubscriptionId: subscriptionId }, data: { status: "PAST_DUE" } });
}

export async function POST(req: Request) {
  const body = await req.text(); const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let claimedEventId: string | null = null;
  try {
    const stripe = await getStripeClient(); const secret = await getWebhookSecret();
    if (!secret) return new NextResponse("Webhook secret ontbreekt", { status: 500 });
    const event = stripe.webhooks.constructEvent(body, sig, secret);

    try {
      await db.stripeEvent.create({ data: { eventId: event.id, type: event.type } });
      claimedEventId = event.id;
    } catch (error: any) {
      if (error?.code === "P2002") return NextResponse.json({ received: true, duplicate: true });
      throw error;
    }

    switch (stripeWebhookAction(event.type)) {
      case "SYNC_SUBSCRIPTION": {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.subscription) await syncSubscription(await stripe.subscriptions.retrieve(String(session.subscription)));
        } else if (event.type === "invoice.payment_succeeded") {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = String((invoice as any).subscription || "");
          if (subscriptionId) await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId));
        } else {
          await syncSubscription(event.data.object as Stripe.Subscription);
        }
        break;
      }
      case "MARK_PAYMENT_FAILED":
        await markPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "IGNORE":
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    if (claimedEventId) {
      try { await db.stripeEvent.delete({ where: { eventId: claimedEventId } }); } catch { /* allow Stripe retry if cleanup itself fails */ }
    }
    return new NextResponse(e?.message || "Invalid webhook", { status: 400 });
  }
}
