import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculate } from "../lib/calculator";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.nl").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Admin ${email} bestaat nog niet. Voer eerst prisma/seed.ts uit.`);

  const reference = "DEMO-ALIMENTA-001";
  const client = await db.client.upsert({
    where: { userId_reference: { userId: user.id, reference } },
    update: { name: "Demo cliënt — fictief" },
    create: { userId: user.id, name: "Demo cliënt — fictief", reference, notes: "Volledig fictieve demo-data. Niet gebruiken voor een echte berekening." }
  });

  const data = {
    historicalNBGI: 5600,
    parents: [
      { nbi: 4000, kgb: 0, housingCosts: 1250, careDaysPerWeek: 2, income: { mode: "NBI" as const, netIncomeMonthly: 4000, salaryMonthly: 6200 } },
      { nbi: 2400, kgb: 350, housingCosts: 1050, careDaysPerWeek: 5, income: { mode: "NBI" as const, netIncomeMonthly: 2400, salaryMonthly: 3400 } }
    ],
    children: [
      { age: 8, residence: "B" as const, livesAtHome: true },
      { age: 5, residence: "B" as const, livesAtHome: true }
    ],
    actualKgbReceivingParent: 350
  };
  const result = calculate(data);
  const existing = await db.case.findFirst({ where: { userId: user.id, name: "DEMO — Voorbeeldgezin" } });
  if (existing) {
    await db.case.update({ where: { id: existing.id }, data: { data, result, status: "CALCULATED", calculationVersion: result.normVersion } });
    console.log(`Demo dossier bijgewerkt: ${existing.id}`);
    return;
  }
  const c = await db.case.create({
    data: {
      userId: user.id, clientId: client.id, name: "DEMO — Voorbeeldgezin", status: "CALCULATED",
      calculationVersion: result.normVersion, data, result,
      metadata: { effectiveDate: "2026-01-01", notes: "Fictieve demo-data. Niet juridisch gebruiken." }
    }
  });
  await db.calculation.create({ data: { caseId: c.id, engineVersion: result.engineVersion, normVersion: result.normVersion, inputSnapshot: data, result } });
  console.log(`Demo dossier aangemaakt: ${c.id}`);
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
