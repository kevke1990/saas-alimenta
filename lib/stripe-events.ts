export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
] as const;

export type SupportedStripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];

export type StripeWebhookAction =
  | "SYNC_SUBSCRIPTION"
  | "MARK_PAYMENT_FAILED"
  | "IGNORE";

export function stripeWebhookAction(type: string): StripeWebhookAction {
  switch (type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
      return "SYNC_SUBSCRIPTION";
    case "invoice.payment_failed":
      return "MARK_PAYMENT_FAILED";
    default:
      return "IGNORE";
  }
}

export function isSupportedStripeWebhookEvent(type: string): type is SupportedStripeWebhookEvent {
  return stripeWebhookAction(type) !== "IGNORE";
}
