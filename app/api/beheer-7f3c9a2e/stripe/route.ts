import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { auditSecurity } from "@/lib/team-security";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/request-security";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { getStripeClient } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";

export async function GET() {
  try {
    await requireAdmin();
    const cfg = await db.stripeConfig.findFirst();
    const plans = await db.stripePlan.findMany({ orderBy: { annualAmountCents: "asc" } });
    return NextResponse.json({
      configured: !!cfg?.secretKeyCipher || !!process.env.STRIPE_SECRET_KEY,
      mode: cfg?.mode || "test",
      webhookEndpoint: `${process.env.APP_URL || ""}/api/stripe/webhook`,
      plans: plans.map((p) => ({ ...p, hasPrice: !!p.stripePriceId })),
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Forbidden", { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const admin = await requireAdmin();
    const rl = await distributedRateLimit(requestKey(req, "stripe-admin"), 30, 15 * 60 * 1000);
    if (!rl.ok) return new NextResponse("Te veel Stripe-beheeracties. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

    const appUrl = process.env.APP_URL?.trim();
    if (!appUrl) return new NextResponse("APP_URL is niet geconfigureerd", { status: 503 });
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") return new NextResponse("APP_URL moet HTTPS gebruiken", { status: 503 });

    const b = await req.json();
    const action = String(b.action || "");

    if (action === "saveCredentials") {
      const key = String(b.secretKey || "").trim();
      const wh = String(b.webhookSecret || "").trim();
      if (!key && !process.env.STRIPE_SECRET_KEY) throw new Error("Stripe secret key is verplicht");
      if (key && !/^(sk_(test|live)_)/.test(key)) throw new Error("Ongeldige Stripe secret key");
      if (wh && !wh.startsWith("whsec_")) throw new Error("Ongeldige Stripe webhook secret");
      const mode = key.startsWith("sk_live_") ? "live" : "test";
      const old = await db.stripeConfig.findFirst();
      if (old?.mode && old.mode !== mode) await db.stripePlan.updateMany({ data: { stripeProductId: null, stripePriceId: null } });
      await db.stripeConfig.upsert({
        where: { id: "singleton" },
        update: { mode, secretKeyCipher: key ? encryptSecret(key) : undefined, webhookSecretCipher: wh ? encryptSecret(wh) : undefined, webhookEndpoint: new URL("/api/stripe/webhook", baseUrl).toString(), configuredAt: new Date() },
        create: { id: "singleton", mode, secretKeyCipher: key ? encryptSecret(key) : null, webhookSecretCipher: wh ? encryptSecret(wh) : null, webhookEndpoint: new URL("/api/stripe/webhook", baseUrl).toString(), configuredAt: new Date() },
      });
      await auditSecurity(admin.id, "STRIPE_CREDENTIALS_UPDATED", { mode });
      return NextResponse.json({ ok: true });
    }

    if (action === "syncProducts") {
      const stripe = await getStripeClient();
      for (const [key, p] of Object.entries(PRICING)) {
        const existing = await db.stripePlan.findUnique({ where: { key } });
        let product: any = existing?.stripeProductId ? await stripe.products.retrieve(existing.stripeProductId).catch(() => null) : null;
        if (!product || product.deleted) product = await stripe.products.create({ name: `Alimenta Pro — ${p.name}`, description: p.description, metadata: { plan: key } });
        let price: any = existing?.stripePriceId ? await stripe.prices.retrieve(existing.stripePriceId).catch(() => null) : null;
        if (!price || !price.active || price.unit_amount !== Math.round(p.annual * 100) || price.currency !== "eur") {
          const oldPriceId = existing?.stripePriceId;
          if (oldPriceId) await stripe.prices.update(oldPriceId, { active: false }).catch(() => null);
          price = await stripe.prices.create({ currency: "eur", unit_amount: Math.round(p.annual * 100), recurring: { interval: "year" }, product: product.id, metadata: { plan: key } });
        }
        await db.stripePlan.upsert({ where: { key }, update: { name: p.name, annualAmountCents: Math.round(p.annual * 100), stripeProductId: product.id, stripePriceId: price.id, active: true }, create: { key, name: p.name, annualAmountCents: Math.round(p.annual * 100), stripeProductId: product.id, stripePriceId: price.id, active: true } });
      }
      await auditSecurity(admin.id, "STRIPE_PRODUCTS_SYNCED", { planCount: Object.keys(PRICING).length });
      return NextResponse.json({ ok: true });
    }

    if (action === "test") {
      const stripe = await getStripeClient();
      const a = await stripe.balance.retrieve();
      await auditSecurity(admin.id, "STRIPE_CONNECTION_TESTED", {});
      return NextResponse.json({ ok: true, available: a.available.map((x) => ({ currency: x.currency, amount: x.amount })) });
    }

    return new NextResponse("Onbekende actie", { status: 400 });
  } catch (e: any) {
    if (e?.message === "CROSS_ORIGIN_REQUEST") return new NextResponse("Ongeldige herkomst van verzoek", { status: 403 });
    return new NextResponse(e?.message || "Stripe beheeractie mislukt", { status: 400 });
  }
}
