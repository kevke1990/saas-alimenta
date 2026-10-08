import { PrismaClient, Prisma } from "@prisma/client";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

const db = new PrismaClient();

function assertDemoEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is geblokkeerd in NODE_ENV=production.");
  }
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Demo seed vereist expliciet DEMO_MODE=true.");
  }
}

async function createDemoCase(user: any, client: any, name: string, data: any) {
  const calculation = runCalculationEngineV2(data, "2026.1");
  const resultJson = JSON.parse(JSON.stringify(calculation.result)) as Prisma.InputJsonValue;

  const existing = await db.case.findFirst({ where: { userId: user.id, name } });
  if (existing) {
    await db.case.update({ where: { id: existing.id }, data: { data, result: resultJson, status: "CALCULATED", calculationVersion: "2026.1" } });
    console.log(`Demo dossier bijgewerkt: ${existing.id}`);
    return;
  }

  const c = await db.case.create({
    data: {
      userId: user.id, clientId: client.id, name, status: "CALCULATED",
      calculationVersion: "2026.1", data, result: resultJson,
      metadata: { effectiveDate: "2026-06-15", notes: "Trema 2026 Referentiedossier - Pilot data." }
    }
  });

  await db.calculation.create({ data: { caseId: c.id, engineVersion: "2", normVersion: "2026.1", inputSnapshot: data, result: resultJson } });
  console.log(`Demo dossier aangemaakt: ${c.id}`);
}

async function main() {
  assertDemoEnvironment();
  const email = (process.env.ADMIN_EMAIL || "admin@example.nl").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Admin ${email} bestaat nog niet. Voer eerst prisma/seed.ts uit.`);

  const reference = "DEMO-ALIMENTA-001";
  const client = await db.client.upsert({
    where: { userId_reference: { userId: user.id, reference } },
    update: { name: "Demo cliënt — fictief" },
    create: { userId: user.id, name: "Demo cliënt — fictief", reference, notes: "Volledig fictieve demo-data. Niet gebruiken voor een echte berekening." }
  });

  const case1 = {
    referenceYear: 2026,
    calculationDate: "2026-06-15",
    parents: [
      { id: "A", role: "MAINTENANCE_DEBTOR", nbi: 3200, kgbVerified: true, household: "single" },
      { id: "B", role: "MAINTENANCE_CREDITOR", nbi: 2000 }
    ],
    children: [
      { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15 }
    ],
    need: { ownShareMonthly: 400 }
  };
  await createDemoCase(user, client, "DEMO — Dossier 1: Een kind (Standaard DK, 15% ZK, KGB)", case1);

  const case2 = {
    referenceYear: 2026,
    calculationDate: "2026-06-15",
    parents: [
      { id: "A", role: "MAINTENANCE_DEBTOR", nbi: 1500, household: "single" },
      { id: "B", role: "MAINTENANCE_CREDITOR", nbi: 2500 }
    ],
    children: [
      { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15 },
      { id: "c2", birthDate: "2018-01-01", careDiscountPercent: 35 }
    ],
    need: { ownShareMonthly: 800 }
  };
  await createDemoCase(user, client, "DEMO — Dossier 2: Twee kinderen (Verschillende ZK, tekort)", case2);

  const case3 = {
    referenceYear: 2026,
    calculationDate: "2026-06-15",
    parents: [
      { id: "A", role: "MAINTENANCE_DEBTOR", nbi: 5000, household: "single" },
      { id: "B", role: "MAINTENANCE_CREDITOR", nbi: 1500 }
    ],
    children: [
      { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15 }
    ],
    need: { ownShareMonthly: 600 },
    partnerSupport: {
      enabled: true,
      payerIndex: 0,
      historicalNBGI: 5000,
      historicalChildCosts: 600
    }
  };
  await createDemoCase(user, client, "DEMO — Dossier 3: Samenloop KA en PA (DK-verdeling)", case3);
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
