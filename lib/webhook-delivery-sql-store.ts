import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";
import { WebhookDeliveryState } from "./webhook-delivery";

type WebhookDeliveryRow = {
  id: string;
  userId: string;
  subscriptionId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  signature: string;
  status: WebhookDeliveryState;
  attempt: number;
  maxAttempts: number;
  lastStatusCode: number | null;
  lastError: string | null;
  nextAttemptAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WebhookDeliverySqlClient = {
  $queryRaw<T>(query: Prisma.Sql): Promise<T[]>;
};

export function mapWebhookDeliveryRow(row: WebhookDeliveryRow): StoredWebhookDelivery {
  return {
    id: row.id,
    userId: row.userId,
    subscriptionId: row.subscriptionId,
    eventId: row.eventId,
    eventType: row.eventType,
    payload: row.payload,
    signature: row.signature,
    state: row.status,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    statusCode: row.lastStatusCode,
    lastStatusCode: row.lastStatusCode,
    error: row.lastError,
    lastError: row.lastError,
    nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
  };
}

function mapOne<T extends WebhookDeliveryRow>(rows: T[]): StoredWebhookDelivery {
  const row = rows[0];
  if (!row) throw new Error("Webhook delivery query returned no row");
  return mapWebhookDeliveryRow(row);
}

/**
 * Prisma SQL adapter for the webhook delivery table.
 * Raw SQL is intentional here: the delivery migration is deployable before
 * Prisma's generated model is regenerated, while all values remain bound.
 */
export function createWebhookDeliverySqlStore(db: WebhookDeliverySqlClient): WebhookDeliveryStore {
  return {
    async insertIfAbsent(input) {
      const rows = await db.$queryRaw<WebhookDeliveryRow>(Prisma.sql`
        INSERT INTO "WebhookDelivery"
          ("id", "userId", "subscriptionId", "eventId", "eventType", "payload", "signature", "status", "attempt", "maxAttempts", "lastStatusCode", "lastError", "nextAttemptAt", "deliveredAt", "createdAt", "updatedAt")
        VALUES
          (${randomUUID()}, ${input.userId}, ${input.subscriptionId}, ${input.eventId}, ${input.eventType}, ${JSON.stringify(input.payload)}::jsonb, ${input.signature}, ${input.state}, ${input.attempt}, ${input.maxAttempts}, ${input.lastStatusCode ?? input.statusCode ?? null}, ${input.lastError ?? input.error ?? null}, ${input.nextAttemptAt ? new Date(input.nextAttemptAt) : null}, ${input.deliveredAt ? new Date(input.deliveredAt) : null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("subscriptionId", "eventId") DO UPDATE SET "updatedAt" = "WebhookDelivery"."updatedAt"
        RETURNING *
      `);
      return mapOne(rows);
    },

    async claimDue({ id, now }) {
      const rows = await db.$queryRaw<WebhookDeliveryRow>(Prisma.sql`
        UPDATE "WebhookDelivery"
        SET "attempt" = LEAST("attempt" + 1, "maxAttempts"),
            "status" = 'RETRYING',
            "nextAttemptAt" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${id}
          AND "status" IN ('PENDING', 'RETRYING')
          AND "attempt" < "maxAttempts"
          AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= ${now})
        RETURNING *
      `);
      return rows[0] ? mapWebhookDeliveryRow(rows[0]) : null;
    },

    async updateResult(input) {
      const rows = await db.$queryRaw<WebhookDeliveryRow>(Prisma.sql`
        UPDATE "WebhookDelivery"
        SET "status" = ${input.state},
            "attempt" = COALESCE(${input.attempt ?? null}, "attempt"),
            "lastStatusCode" = COALESCE(${input.statusCode ?? null}, "lastStatusCode"),
            "lastError" = COALESCE(${input.error ?? null}, "lastError"),
            "nextAttemptAt" = ${input.nextAttemptAt === undefined ? null : input.nextAttemptAt ? new Date(input.nextAttemptAt) : null},
            "deliveredAt" = ${input.deliveredAt === undefined ? null : input.deliveredAt ? new Date(input.deliveredAt) : null},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${input.id}
        RETURNING *
      `);
      return mapOne(rows);
    },
  };
}
