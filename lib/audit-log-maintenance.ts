import type { Prisma, PrismaClient } from "@prisma/client";

type AuditLogMaintenanceReason = "erasure" | "retention";

/**
 * Runs the narrow, privileged AuditLog maintenance paths in a transaction.
 * The database trigger accepts the bypass only for this transaction id, so it
 * cannot leak into later work on the same pooled connection.
 */
export function withAuditLogMaintenance<T>(
  client: PrismaClient,
  reason: AuditLogMaintenanceReason,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return client.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT set_config(
        'alimenta.audit_log_maintenance',
        ${reason} || ':' || txid_current()::text,
        true
      )
    `;
    return work(tx);
  });
}
