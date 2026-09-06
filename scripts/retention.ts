import { PrismaClient } from '@prisma/client';import { DEFAULT_RETENTION_POLICY,retentionCutoff } from '../lib/retention';
const db=new PrismaClient();
async function main(){const p=DEFAULT_RETENTION_POLICY;const docs=await db.document.deleteMany({where:{createdAt:{lt:retentionCutoff(new Date(),p.documentsDays)}}});const audit=await db.auditLog.deleteMany({where:{createdAt:{lt:retentionCutoff(new Date(),p.auditDays)}}});const rl=await db.rateLimitBucket.deleteMany({where:{expiresAt:{lt:new Date()}}});console.log(JSON.stringify({documents:docs.count,auditLogs:audit.count,rateLimitBuckets:rl.count,policy:p}));}
main().finally(()=>db.$disconnect());
