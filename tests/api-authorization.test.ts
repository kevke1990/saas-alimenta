import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = path.join(process.cwd(), "app", "api");
const PUBLIC_PREFIXES = [
  "auth/",
  "health/route.ts",
  "ready/route.ts",
  "release/route.ts",
  "stripe/webhook/route.ts",
  "mail/inbound/route.ts",
];

function routeFiles(dir: string, relative = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) return routeFiles(path.join(dir, entry.name), rel);
    return entry.name === "route.ts" ? [rel.replaceAll(path.sep, "/")] : [];
  });
}

function isPublic(relative: string) {
  return PUBLIC_PREFIXES.some(prefix => relative === prefix || relative.startsWith(prefix));
}

function read(relative: string) {
  return fs.readFileSync(path.join(API_ROOT, relative), "utf8");
}

describe("API authorization matrix", () => {
  const routes = routeFiles(API_ROOT);

  it("requires an explicit authentication mechanism on every non-public API route", () => {
    const missing = routes.filter(route => {
      if (isPublic(route) || route.startsWith("v1/")) return false;
      const source = read(route);
      return !/(requireUser|requireAdmin|requireRole|authenticateApiToken|resolvePortalShare)/.test(source);
    });
    expect(missing, `API routes without explicit auth: ${missing.join(", ")}`).toEqual([]);
  });

  it("keeps the public webhook endpoints behind their own secret/signature controls", () => {
    expect(read("mail/inbound/route.ts")).toContain("POSTMARK_INBOUND_SECRET");
    expect(read("stripe/webhook/route.ts")).toMatch(/constructEvent|webhook/i);
  });

  it("requires API-token authentication for the public v1 integration surface", () => {
    const v1Routes = routes.filter(route => route.startsWith("v1/"));
    expect(v1Routes.length).toBeGreaterThan(0);
    for (const route of v1Routes) expect(read(route)).toContain("authenticateApiToken");
  });

  it("requires user ownership predicates on dynamic resource routes", () => {
    const resourceRoutes = routes.filter(route => /^(?:cases|clients|documents|income-facts)\/.*\[/.test(route));
    const missing = resourceRoutes.filter(route => {
      const source = read(route);
      return !source.includes("userId") && !source.includes("requireAdmin") && !source.includes("requireRole");
    });
    expect(missing, `Dynamic resource routes without an ownership/RBAC predicate: ${missing.join(", ")}`).toEqual([]);
  });
});
