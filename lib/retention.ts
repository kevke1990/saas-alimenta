export type RetentionPolicy = { documentsDays: number; auditDays: number; mailDays: number };
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = { documentsDays: 2555, auditDays: 2555, mailDays: 2555 };
export function retentionCutoff(now = new Date(), days = 2555) { const d = new Date(now); d.setUTCDate(d.getUTCDate() - days); return d; }
export function validateRetentionPolicy(p: Partial<RetentionPolicy>) {
  for (const [k,v] of Object.entries(p)) if (v !== undefined && (!Number.isInteger(v) || v < 30 || v > 3650)) throw new Error(`${k} moet tussen 30 en 3650 dagen liggen.`);
  return { ...DEFAULT_RETENTION_POLICY, ...p };
}
