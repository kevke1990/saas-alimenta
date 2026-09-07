import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { auditSecurity } from "@/lib/team-security";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/request-security";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function config() {
  const rows = await db.$queryRaw<any[]>`SELECT * FROM "AppConfig" WHERE "id" = 'singleton' LIMIT 1`;
  return rows[0] ?? null;
}

function publicConfig(c: any) {
  if (!c) return { mail: {}, ai: {} };
  return {
    mail: {
      provider: c.mailProvider,
      fromName: c.mailFromName ?? "",
      fromEmail: c.mailFromEmail ?? "",
      replyTo: c.mailReplyTo ?? "",
      configured: !!c.mailApiKeyCipher,
      webhookConfigured: !!c.mailWebhookSecretCipher,
    },
    ai: {
      enabled: !!c.aiEnabled,
      provider: c.aiProvider,
      model: c.aiModel ?? "",
      baseUrl: c.aiBaseUrl ?? "",
      hasKey: !!c.aiApiKeyCipher,
      systemPrompt: c.aiSystemPrompt ?? "",
      temperature: c.aiTemperature ?? 0.2,
      maxTokens: c.aiMaxTokens ?? 4000,
    },
  };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    const [users, clients, cases, subscriptions, activeSubscriptions, pastDue, recentUsers, recentCases, logs, aiRuns, stripe, app] = await Promise.all([
      db.user.count(), db.client.count(), db.case.count(), db.subscription.count(),
      db.user.count({ where: { subscriptionStatus: { in: ["ACTIVE", "TRIALING"] } } }),
      db.user.count({ where: { subscriptionStatus: "PAST_DUE" } }),
      db.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, email: true, companyName: true, plan: true, role: true, lockedAt: true, subscriptionStatus: true, subscriptionEndsAt: true, stripeCustomerId: true, stripeSubscriptionId: true, createdAt: true, lastLoginAt: true, _count: { select: { clients: true, cases: true } } } }),
      db.case.findMany({ orderBy: { updatedAt: "desc" }, take: 20, select: { id: true, name: true, status: true, reviewStatus: true, updatedAt: true, user: { select: { email: true, name: true } }, client: { select: { name: true } } } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, userId: true, action: true, metadata: true, createdAt: true } }),
      db.aiRun.findMany({ orderBy: { startedAt: "desc" }, take: 20, select: { id: true, userId: true, operation: true, model: true, status: true, startedAt: true, finishedAt: true, error: true } }),
      db.stripeConfig.findFirst(), config(),
    ]);
    return NextResponse.json({
      admin: { email: admin.email },
      stats: { users, clients, cases, subscriptions, activeSubscriptions, pastDue },
      users: recentUsers,
      cases: recentCases,
      logs,
      aiRuns,
      stripe: { configured: !!stripe?.secretKeyCipher || !!process.env.STRIPE_SECRET_KEY, mode: stripe?.mode ?? "test", webhookEndpoint: `${process.env.APP_URL ?? ""}/api/stripe/webhook` },
      config: publicConfig(app),
      server: { nodeEnv: process.env.NODE_ENV, appUrlConfigured: !!process.env.APP_URL, sessionConfigured: !!process.env.SESSION_SECRET },
    });
  } catch (e: any) { return new NextResponse(e?.message || "Forbidden", { status: 403 }); }
}

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const admin = await requireAdmin();
    const rl = await distributedRateLimit(requestKey(req, "admin-portal"), 120, 15 * 60 * 1000);
    if (!rl.ok) return new NextResponse("Te veel beheeracties. Probeer later opnieuw.", { status: 429 });
    const b = await req.json();
    const action = String(b.action || "");

    if (action === "setUserPlan") {
      const userId = String(b.userId || "");
      const plan = String(b.plan || "FREE");
      const allowed = ["FREE", "PRO", "PRACTICE", "ENTERPRISE"];
      if (!userId || !allowed.includes(plan)) throw new Error("Ongeldig plan");
      await db.user.update({ where: { id: userId }, data: { plan: plan as any, subscriptionStatus: plan === "FREE" ? null : "ACTIVE" } });
      await auditSecurity(admin.id, "ADMIN_USER_PLAN_CHANGED", { targetUserId: userId, plan });
      return NextResponse.json({ ok: true });
    }

    if (action === "lockUser" || action === "unlockUser") {
      const userId = String(b.userId || "");
      if (userId === admin.id) throw new Error("Je kunt je eigen beheeraccount niet blokkeren");
      await db.user.update({ where: { id: userId }, data: { lockedAt: action === "lockUser" ? new Date() : null } });
      await auditSecurity(admin.id, action === "lockUser" ? "ADMIN_USER_LOCKED" : "ADMIN_USER_UNLOCKED", { targetUserId: userId });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancelSubscription") {
      const userId = String(b.userId || "");
      const atPeriodEnd = b.atPeriodEnd !== false;
      const user = await db.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true, plan: true } });
      if (!user) throw new Error("Gebruiker niet gevonden");
      if (user.stripeSubscriptionId) {
        const stripe = await getStripeClient();
        if (atPeriodEnd) await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
        else await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      }
      await db.user.update({ where: { id: userId }, data: { subscriptionStatus: atPeriodEnd ? "ACTIVE" : "CANCELED", ...(atPeriodEnd ? {} : { plan: "FREE" }) } });
      await auditSecurity(admin.id, "ADMIN_SUBSCRIPTION_CANCELED", { targetUserId: userId, atPeriodEnd });
      return NextResponse.json({ ok: true });
    }

    if (action === "saveMail") {
      const provider = String(b.provider || "POSTMARK").trim().toUpperCase();
      const fromName = String(b.fromName || "").trim();
      const fromEmail = String(b.fromEmail || "").trim();
      const replyTo = String(b.replyTo || "").trim();
      const apiKey = String(b.apiKey || "").trim();
      const webhookSecret = String(b.webhookSecret || "").trim();
      if (!fromEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) throw new Error("Geldig afzenderadres is verplicht");
      await db.$executeRaw`UPDATE "AppConfig" SET "mailProvider"=${provider}, "mailFromName"=${fromName || null}, "mailFromEmail"=${fromEmail}, "mailReplyTo"=${replyTo || null}, "mailApiKeyCipher"=${apiKey ? encryptSecret(apiKey) : null}, "mailWebhookSecretCipher"=${webhookSecret ? encryptSecret(webhookSecret) : null}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"='singleton'`;
      await auditSecurity(admin.id, "ADMIN_MAIL_CONFIG_UPDATED", { provider, fromEmail });
      return NextResponse.json({ ok: true });
    }

    if (action === "saveAi") {
      const provider = String(b.provider || "OPENAI").trim().toUpperCase();
      const model = String(b.model || "").trim();
      const baseUrl = String(b.baseUrl || "").trim();
      const apiKey = String(b.apiKey || "").trim();
      const systemPrompt = String(b.systemPrompt || "").trim();
      const temperature = Math.max(0, Math.min(2, Number(b.temperature ?? 0.2)));
      const maxTokens = Math.max(256, Math.min(32000, Number(b.maxTokens ?? 4000)));
      await db.$executeRaw`UPDATE "AppConfig" SET "aiEnabled"=${Boolean(b.enabled)}, "aiProvider"=${provider}, "aiModel"=${model || null}, "aiBaseUrl"=${baseUrl || null}, "aiApiKeyCipher"=${apiKey ? encryptSecret(apiKey) : null}, "aiSystemPrompt"=${systemPrompt || null}, "aiTemperature"=${temperature}, "aiMaxTokens"=${maxTokens}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"='singleton'`;
      await auditSecurity(admin.id, "ADMIN_AI_CONFIG_UPDATED", { provider, model, enabled: Boolean(b.enabled) });
      return NextResponse.json({ ok: true });
    }

    if (action === "syncStripe") {
      const stripe = await getStripeClient();
      const balance = await stripe.balance.retrieve();
      await auditSecurity(admin.id, "ADMIN_STRIPE_HEALTH_CHECK", {});
      return NextResponse.json({ ok: true, available: balance.available.map(x => ({ currency: x.currency, amount: x.amount })) });
    }

    throw new Error("Onbekende beheeractie");
  } catch (e: any) {
    if (e?.message === "CROSS_ORIGIN_REQUEST") return new NextResponse("Ongeldige herkomst van verzoek", { status: 403 });
    return new NextResponse(e?.message || "Beheeractie mislukt", { status: 400 });
  }
}
