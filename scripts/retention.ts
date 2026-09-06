import { PrismaClient } from '@prisma/client';
import { DEFAULT_RETENTION_POLICY, retentionCutoff } from '../lib/retention';

const db = new PrismaClient();

async function main() {
  const p = DEFAULT_RETENTION_POLICY;
  const now = new Date();
  const documentCutoff = retentionCutoff(now, p.documentsDays);
  const auditCutoff = retentionCutoff(now, p.auditDays);
  const mailCutoff = retentionCutoff(now, p.mailDays);

  const [docs, audit, mailLogs, mailMessages, rl] = await db.$transaction([
    db.document.deleteMany({ where: { createdAt: { lt: documentCutoff } } }),
    db.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } }),
    db.mailLog.deleteMany({ where: { createdAt: { lt: mailCutoff } } }),
    db.mailMessage.deleteMany({ where: { createdAt: { lt: mailCutoff } } }),
    db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  console.log(JSON.stringify({
    documents: docs.count,
    auditLogs: audit.count,
    mailLogs: mailLogs.count,
    mailMessages: mailMessages.count,
    rateLimitBuckets: rl.count,
    policy: p,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
