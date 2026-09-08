import { describe, expect, it } from "vitest";
import { mapPlanKey, mapStripeStatus, periodEnd, planForSubscription } from "./stripe-subscription";

describe("Stripe subscription lifecycle mapping", () => {
  it("maps all supported plan keys safely", () => {
    expect(mapPlanKey("pro")).toBe("PRO");
    expect(mapPlanKey("practice")).toBe("PRACTICE");
    expect(mapPlanKey("practice_monthly")).toBe("PRACTICE");
    expect(mapPlanKey("enterprise")).toBe("ENTERPRISE");
    expect(mapPlanKey("unknown")).toBe("FREE");
    expect(mapPlanKey(null)).toBe("FREE");
  });

  it("maps Stripe statuses without leaking unsupported states", () => {
    expect(mapStripeStatus("trialing")).toBe("TRIALING");
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("canceled")).toBe("CANCELED");
    expect(mapStripeStatus("incomplete")).toBe("INCOMPLETE");
    expect(mapStripeStatus("incomplete_expired")).toBe("INCOMPLETE");
    expect(mapStripeStatus("unpaid")).toBe("INCOMPLETE");
    expect(mapStripeStatus("paused")).toBe("INCOMPLETE");
  });

  it("returns Free after cancellation or incomplete expiration", () => {
    expect(planForSubscription("canceled", "pro")).toBe("FREE");
    expect(planForSubscription("incomplete_expired", "enterprise")).toBe("FREE");
    expect(planForSubscription("active", "pro")).toBe("PRO");
    expect(planForSubscription("trialing", "practice_monthly")).toBe("PRACTICE");
  });

  it("converts Stripe period end seconds to a Date", () => {
    expect(periodEnd(0)).toBeNull();
    expect(periodEnd(undefined)).toBeNull();
    expect(periodEnd(1790000000)?.getTime()).toBe(1790000000 * 1000);
  });
});
