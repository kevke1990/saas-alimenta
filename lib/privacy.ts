import crypto from "crypto";
import { db } from "./db";
import { decryptDocument } from "./document-store";

export const PRIVACY_POLICY_VERSION = "2026.2";
export const RIGHTS = ["ACCESS", "RECTIFICATION", "RESTRICTION", "OBJECTION", "PORTABILITY", "ERASURE"] as const;
export function hashToken(v: string) { return crypto.createHash("sha256").update(v).digest("hex"); }
export function randomToken() { return crypto.randomBytes(32).toString("hex"); }
export function hashIp(ip: string | null) { if (!ip) return null; return crypto.createHash("sha256").update(`${process.env.PRIVACY_HASH_SALT || "alimenta"}:${ip}`).digest("hex"); }

export async function buildClientExport(userId: string, clientId: string) {
  const client = await db.client.findFirst({ where: { id: clientId, userId }, include: { cases: { include: { calculations: true } }, calendarEvents: true, usageEvents: true, privacyRequests: true, consentRecords: true, documents: true, mailMessages: true } });
  if (!client) return null;
  return {
    exportVersion: "2.1",
    generatedAt: new Date().toISOString(),
    purpose: "AVG inzage/dataportabiliteit — persoonsgegevens van de betrokkene",
    client: { id: client.id, name: client.name, reference: client.reference, email: client.email, phone: client.phone, status: client.status, notes: client.notes, createdAt: client.createdAt, updatedAt: client.updatedAt },
    cases: client.cases,
    calendarEvents: client.calendarEvents,
    usageEvents: client.usageEvents,
    privacyRequests: client.privacyRequests,
    consentRecords: client.consentRecords,
    documents: client.documents.map(d => ({ id: d.id, name: d.name, mimeType: d.mimeType, sizeBytes: d.sizeBytes, sha256: d.sha256, source: d.source, createdAt: d.createdAt, updatedAt: d.updatedAt, contentBase64: decryptDocument(d.storageCipher).toString("base64") })),
    mailMessages: client.mailMessages,
  };
}

export async function buildAccountExport(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { clients: { include: { cases: { include: { calculations: true } }, calendarEvents: true, usageEvents: true, privacyRequests: true, consentRecords: true, documents: true, mailMessages: true } }, subscriptions: true, auditLogs: true, mailIdentities: true, mailLogs: true, branding: true, customDomains: true, consentRecords: true, privacyRequests: true, tasks: true, aiRuns: true, passkeys: true } });
  if (!user) return null;
  return {
    exportVersion: "2.1",
    generatedAt: new Date().toISOString(),
    purpose: "AVG dataportabiliteit — eigen accountgegevens",
    user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName, role: user.role, plan: user.plan, emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt, updatedAt: user.updatedAt },
    clients: user.clients.map(c => ({ ...c, documents: c.documents.map(d => ({ id: d.id, name: d.name, mimeType: d.mimeType, sizeBytes: d.sizeBytes, sha256: d.sha256, source: d.source, createdAt: d.createdAt, updatedAt: d.updatedAt })) })),
    subscriptions: user.subscriptions,
    auditLogs: user.auditLogs,
    mailIdentities: user.mailIdentities,
    mailLogs: user.mailLogs,
    branding: user.branding,
    customDomains: user.customDomains,
    consentRecords: user.consentRecords,
    privacyRequests: user.privacyRequests,
    tasks: user.tasks,
    aiRuns: user.aiRuns,
    passkeys: user.passkeys.map(p => ({ id: p.id, credentialId: p.credentialId, name: p.name, createdAt: p.createdAt, lastUsedAt: p.lastUsedAt })),
  };
}

export async function eraseClientData(userId: string, clientId: string) {
  return db.$transaction(async tx => {
    const client = await tx.client.findFirst({ where: { id: clientId, userId } });
    if (!client) return null;
    const now = new Date().toISOString();
    const cases = await tx.case.findMany({ where: { userId, clientId }, select: { id: true } });
    await tx.auditLog.updateMany({ where: { userId, metadata: { path: ["clientId"], equals: clientId } }, data: { metadata: { action: "CLIENT_DATA_ERASED", subjectHash: hashToken(clientId), erasedAt: now } as any } });
    await tx.document.deleteMany({ where: { userId, clientId } });
    await tx.mailMessage.deleteMany({ where: { userId, clientId } });
    await tx.privacyRequest.deleteMany({ where: { userId, clientId } });
    await tx.consentRecord.deleteMany({ where: { userId, clientId } });
    await tx.usageEvent.deleteMany({ where: { userId, clientId } });
    await tx.calendarEvent.deleteMany({ where: { userId, clientId } });
    if (cases.length) await tx.case.deleteMany({ where: { userId, clientId } });
    await tx.client.delete({ where: { id: clientId } });
    return { id: clientId, erasedAt: now, casesErased: cases.length };
  });
}

export async function eraseAccountData(userId: string) {
  return db.$transaction(async tx => {
    const membership = await tx.$queryRaw<Array<{ organizationId: string }>>`SELECT "organizationId" FROM "OrganizationMember" WHERE "userId" = ${userId} LIMIT 1`;
    await tx.auditLog.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
    if (membership[0]) {
      const remaining = await tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "OrganizationMember" WHERE "organizationId" = ${membership[0].organizationId}`;
      if (Number(remaining[0]?.count ?? 0) === 0) await tx.$executeRaw`DELETE FROM "Organization" WHERE "id" = ${membership[0].organizationId}`;
    }
    return { erasedAt: new Date().toISOString() };
  });
}
