import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/request-security";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const u = await requireUser();
    const rl = await distributedRateLimit(requestKey(req, "stripe-checkout"), 10, 15 * 60 * 1000);
    if (!rl.ok) return new NextResponse("Te veel betaalverzoeken. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

    const appUrl = process.env.APP_URL?.trim();
    if (!appUrl) return new NextResponse("APP_URL is niet geconfigureerd", { status: 503 });
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") return new NextResponse("APP_URL moet HTTPS gebruiken", { status: 503 });

    const form = await req.formData();
    const plan = String(form.get("plan") || "pro");
    const p = await db.stripePlan.findUnique({ where: { key: plan } });
    if (!p?.active || !p.stripePriceId) return new NextResponse("Dit plan is nog niet door de beheerder aan Stripe gekoppeld", { status: 400 });

    if (u.stripeSubscriptionId && u.subscriptionStatus && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(u.subscriptionStatus)) {
      return NextResponse.redirect(new URL("/billing?existing=1", baseUrl), 303);
    }

    const stripe = await getStripeClient();
    let customer = u.stripeCustomerId || undefined;
    if (!customer) {
      const c = await stripe.customers.create({ email: u.email, name: u.name || undefined, metadata: { userId: u.id } });
      customer = c.id;
      await db.user.update({ where: { id: u.id }, data: { stripeCustomerId: c.id } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: p.stripePriceId, quantity: 1 }],
      success_url: new URL("/billing?success=1", baseUrl).toString(),
      cancel_url: new URL("/billing?canceled=1", baseUrl).toString(),
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      client_reference_id: u.id,
      metadata: { userId: u.id, plan },
      subscription_data: { metadata: { userId: u.id, plan } },
    });
    if (!session.url) return new NextResponse("Stripe checkout heeft geen URL geretourneerd", { status: 502 });
    return NextResponse.redirect(session.url, 303);
  } catch (e: any) {
    if (e?.message === "CROSS_ORIGIN_REQUEST") return new NextResponse("Ongeldige herkomst van verzoek", { status: 403 });
    return new NextResponse(e?.message || "Stripe checkout mislukt", { status: 500 });
  }
}
