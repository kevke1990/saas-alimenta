import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe";

function planFromPrice(priceId: string) {
  return db.stripePlan.findFirst({ where: { stripePriceId: priceId } });
}

function mapPlan(planKey?: string | null) {
  if (planKey === "enterprise") return "ENTERPRISE" as const;
  if (planKey?.startsWith("practice")) return "PRACTICE" as const;
  if (planKey === "pro") return "PRO" as const;
  return "FREE" as const;
}

function mapStatus(status: Stripe.Subscription.Status) {
  if (status === "trialing") return "TRIALING" as const;
  if (status === "active") return "ACTIVE" as const;
  if (status === "past_due") return "PAST_DUE" as const;
  if (status === "canceled") return "CANCELED" as const;
  return "INCOMPLETE" as const;
}

async function syncSubscription(s: Stripe.Subscription) {
  const customer = String(s.customer);
  const user = await db.user.findFirst({ where: { stripeCustomerId: customer } });
  if (!user) return;

  const item = s.items.data[0];
  const priceId = String(item?.price?.id || "");
  const plan = priceId ? await planFromPrice(priceId) : null;
  const mapped = mapStatus(s.status);
  const end = Number((s as any).current_period_end || 0);
  const subscriptionEndsAt = end > 0 ? new Date(end * 1000) : null;
  const planValue = s.status === "canceled" || s.status === "incomplete_expired" ? "FREE" : mapPlan(plan?.key);

  await db.user.update({
    where: { id: user.id },
    data: {
      plan: planValue,
      stripeSubscriptionId: s.id,
      subscriptionStatus: mapped,
      subscriptionEndsAt,
    },
  });

  await db.subscription.upsert({
    where: { userId: user.id },
    update: {
      stripeSubscriptionId: s.id,
      stripePriceId: priceId,
      status: mapped,
      currentPeriodEnd: subscriptionEndsAt,
    },
    create: {
      userId: user.id,
      stripeSubscriptionId: s.id,
      stripePriceId: priceId,
      status: mapped,
      currentPeriodEnd: subscriptionEndsAt,
    },
  });
}

async function markPaymentFailed(inv: Stripe.Invoice) {
  const customer = String(inv.customer);
  const user = await db.user.findFirst({ where: { stripeCustomerId: customer } });
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });

  const subscriptionId = String((inv as any).subscription || "");
  if (subscriptionId) {
    await db.subscription.updateMany({
      where: { userId: user.id, stripeSubscriptionId: subscriptionId },
      data: { status: "PAST_DUE" },
    });
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  try {
    const stripe = await getStripeClient();
    const secret = await getWebhookSecret();
    if (!secret) return new NextResponse("Webhook secret ontbreekt", { status: 500 });

    const event = stripe.webhooks.constructEvent(body, sig, secret);
    if (await db.stripeEvent.findUnique({ where: { eventId: event.id } })) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await markPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = String((invoice as any).subscription || "");
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }
    }

    try {
      await db.stripeEvent.create({ data: { eventId: event.id, type: event.type } });
    } catch (error: any) {
      if (error?.code === "P2002") return NextResponse.json({ received: true, duplicate: true });
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Invalid webhook", { status: 400 });
  }
}
