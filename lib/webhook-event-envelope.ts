import { createHash } from "node:crypto";

export type WebhookEventEnvelope = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: unknown;
};

export type NormalizedWebhookEvent = WebhookEventEnvelope & {
  payloadHash: string;
  idempotencyKey: string;
};

const EVENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const EVENT_TYPE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function assertIdentifier(value: string, pattern: RegExp, label: string) {
  if (!pattern.test(value)) throw new Error(`Invalid webhook ${label}`);
}

export function normalizeWebhookEvent(
  input: WebhookEventEnvelope,
  subscriptionId: string,
): NormalizedWebhookEvent {
  if (!subscriptionId || subscriptionId.length > 128) {
    throw new Error("Invalid webhook subscriptionId");
  }
  assertIdentifier(input.eventId, EVENT_ID_PATTERN, "eventId");
  assertIdentifier(input.eventType, EVENT_TYPE_PATTERN, "eventType");

  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid webhook occurredAt");

  const canonicalPayload = JSON.stringify(input.payload);
  const payloadHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return {
    ...input,
    occurredAt: occurredAt.toISOString(),
    payloadHash,
    idempotencyKey: `${subscriptionId}:${input.eventId}`,
  };
}
