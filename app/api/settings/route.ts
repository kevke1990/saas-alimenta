import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireSameOrigin } from "@/lib/request-security";

const clean = (v: unknown, max = 250) => String(v ?? "").trim().slice(0, max) || null;

export async function GET() {
  try {
    const u = await requireUser();
    const branding = await db.branding.findUnique({ where: { userId: u.id } });
    return NextResponse.json({
      account: { name: u.name, email: u.email, accountType: u.accountType, phone: u.phone, addressLine1: u.addressLine1, postalCode: u.postalCode, city: u.city, country: u.country },
      practice: { companyName: u.companyName, kvkNumber: u.kvkNumber, vatNumber: u.vatNumber, website: u.website, practiceType: u.practiceType, billingAddressLine1: u.billingAddressLine1, billingPostalCode: u.billingPostalCode, billingCity: u.billingCity },
      branding: branding ? { companyName: branding.companyName, logoUrl: branding.logoUrl, faviconUrl: branding.faviconUrl, primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor, accentColor: branding.accentColor, reportTitle: branding.reportTitle, footerText: branding.footerText, emailFromName: branding.emailFromName, emailReplyTo: branding.emailReplyTo } : null,
      plan: u.plan,
      subscriptionStatus: u.subscriptionStatus,
    });
  } catch { return new NextResponse("Unauthorized", { status: 401 }); }
}

export async function PUT(req: Request) {
  try {
    requireSameOrigin(req);
    const u = await requireUser();
    const body = await req.json();
    const account = body.account || {};
    const practice = body.practice || {};
    const branding = body.branding || {};
    const updated = await db.user.update({ where: { id: u.id }, data: {
      name: clean(account.name, 100) || u.name,
      phone: clean(account.phone, 50),
      addressLine1: clean(account.addressLine1, 200),
      postalCode: clean(account.postalCode, 20),
      city: clean(account.city, 100),
      country: clean(account.country, 100) || "Nederland",
      companyName: clean(practice.companyName, 150),
      kvkNumber: clean(practice.kvkNumber, 30),
      vatNumber: clean(practice.vatNumber, 40),
      website: clean(practice.website, 200),
      practiceType: clean(practice.practiceType, 100),
      billingAddressLine1: clean(practice.billingAddressLine1, 200),
      billingPostalCode: clean(practice.billingPostalCode, 20),
      billingCity: clean(practice.billingCity, 100),
    }});
    await db.branding.upsert({ where: { userId: u.id }, create: { userId: u.id, companyName: clean(branding.companyName, 150) || updated.companyName || updated.name || "Alimenta Pro", logoUrl: clean(branding.logoUrl, 500), faviconUrl: clean(branding.faviconUrl, 500), primaryColor: clean(branding.primaryColor, 20) || "#1d4ed8", secondaryColor: clean(branding.secondaryColor, 20) || "#0f172a", accentColor: clean(branding.accentColor, 20) || "#e0f2fe", reportTitle: clean(branding.reportTitle, 200), footerText: clean(branding.footerText, 500), emailFromName: clean(branding.emailFromName, 150), emailReplyTo: clean(branding.emailReplyTo, 200) }, update: { companyName: clean(branding.companyName, 150) || updated.companyName || updated.name || "Alimenta Pro", logoUrl: clean(branding.logoUrl, 500), faviconUrl: clean(branding.faviconUrl, 500), primaryColor: clean(branding.primaryColor, 20) || "#1d4ed8", secondaryColor: clean(branding.secondaryColor, 20) || "#0f172a", accentColor: clean(branding.accentColor, 20) || "#e0f2fe", reportTitle: clean(branding.reportTitle, 200), footerText: clean(branding.footerText, 500), emailFromName: clean(branding.emailFromName, 150), emailReplyTo: clean(branding.emailReplyTo, 200) } });
    await db.auditLog.create({ data: { userId: u.id, action: "ACCOUNT_SETTINGS_UPDATED", metadata: { sections: Object.keys(body) } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "CROSS_ORIGIN_REQUEST") return new NextResponse("Ongeldige herkomst van verzoek", { status: 403 });
    return new NextResponse(e?.message || "Instellingen opslaan mislukt", { status: 400 });
  }
}
