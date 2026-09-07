import { db } from "@/lib/db";
import { PRODUCT_VERSION } from "@/lib/release";

const requiredProductionSecrets = ["DATABASE_URL", "SESSION_SECRET", "APP_ENCRYPTION_KEY", "PRIVACY_HASH_SALT"] as const;

function configured(name: string) {
  const value = process.env[name]?.trim();
  return Boolean(value && !/^((CHANGE|GENERATE|USE)-?ME|change-this)/i.test(value));
}

export async function getReadiness() {
  const checks: Record<string, "ok" | "warn" | "fail"> = {};
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "fail";
  }

  for (const name of requiredProductionSecrets) {
    checks[`secret:${name}`] = configured(name) ? "ok" : "fail";
  }

  checks.appUrl = configured("APP_URL") ? "ok" : "warn";
  checks.adminPath = configured("ADMIN_PATH") ? "ok" : "warn";

  const failed = Object.values(checks).filter((v) => v === "fail").length;
  return {
    ready: failed === 0,
    service: "alimenta-pro",
    version: PRODUCT_VERSION,
    checks,
  };
}
