import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/request-security";
import { getStripeClient } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const u = await requireUser();
    const rl = await distributedRateLimit(requestKey(req, "stripe-portal"), 10, 15 * 60 * 1000);
    if (!rl.ok) return new NextResponse("Te veel verzoeken. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

    const appUrl = process.env.APP_URL?.trim();
    if (!appUrl) return new NextResponse("APP_URL is niet geconfigureerd", { status: 503 });
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") return new NextResponse("APP_URL moet HTTPS gebruiken", { status: 503 });
    if (!u.stripeCustomerId) return new NextResponse("Geen Stripe-klant gevonden", { status: 400 });

    const stripe = await getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: new URL("/billing", baseUrl).toString(),
    });
    return NextResponse.redirect(session.url, 303);
  } catch (e: any) {
    if (e?.message === "CROSS_ORIGIN_REQUEST") return new NextResponse("Ongeldige herkomst van verzoek", { status: 403 });
    return new NextResponse(e?.message || "Portal mislukt", { status: 500 });
  }
}
