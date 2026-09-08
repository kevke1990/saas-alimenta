import { describe, expect, it } from "vitest";
import { isSupportedStripeWebhookEvent, stripeWebhookAction } from "./stripe-events";

describe("Stripe webhook event matrix", () => {
  it("syncs checkout completion", () => {
    expect(stripeWebhookAction("checkout.session.completed")).toBe("SYNC_SUBSCRIPTION");
  });

  it("syncs subscription creation and updates", () => {
    expect(stripeWebhookAction("customer.subscription.created")).toBe("SYNC_SUBSCRIPTION");
    expect(stripeWebhookAction("customer.subscription.updated")).toBe("SYNC_SUBSCRIPTION");
  });

  it("syncs subscription cancellation and lets lifecycle mapping downgrade the plan", () => {
    expect(stripeWebhookAction("customer.subscription.deleted")).toBe("SYNC_SUBSCRIPTION");
  });

  it("marks failed invoice payments as past due", () => {
    expect(stripeWebhookAction("invoice.payment_failed")).toBe("MARK_PAYMENT_FAILED");
  });

  it("uses the subscription state again after a successful invoice", () => {
    expect(stripeWebhookAction("invoice.payment_succeeded")).toBe("SYNC_SUBSCRIPTION");
  });

  it("ignores unrelated Stripe events safely", () => {
    expect(stripeWebhookAction("customer.created")).toBe("IGNORE");
    expect(isSupportedStripeWebhookEvent("customer.created")).toBe(false);
    expect(isSupportedStripeWebhookEvent("invoice.payment_failed")).toBe(true);
  });

  it("covers the complete supported event matrix", () => {
    const events = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_failed",
      "invoice.payment_succeeded",
    ];
    expect(events.every(isSupportedStripeWebhookEvent)).toBe(true);
    expect(new Set(events).size).toBe(6);
  });
});
