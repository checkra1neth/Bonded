import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BasePaySubscriptionGateway } from "../basePay";

const gateway = new BasePaySubscriptionGateway({ appId: "bonded-app", secret: "super-secret" });

describe("BasePaySubscriptionGateway", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-10-01T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates checkout sessions with plan metadata", () => {
    const session = gateway.createCheckoutSession({ walletAddress: "0xABC", planId: "premium_founder" });

    expect(session.planId).toBe("premium_founder");
    expect(session.amountUsd).toBeGreaterThan(0);
    expect(session.status).toBe("pending");
    expect(session.expiresAt).toBe(session.createdAt + 10 * 60 * 1000);
  });

  it("activates premium subscription when proof matches signature", () => {
    const session = gateway.createCheckoutSession({ walletAddress: "0x123", planId: "premium_founder" });
    const signature = gateway.generateSignature(session, "settled");

    const { subscription, session: updated } = gateway.finalizeSubscription(session, {
      sessionId: session.id,
      status: "settled",
      signature,
      settledAt: Date.now(),
    });

    expect(subscription.planId).toBe("premium_founder");
    expect(subscription.status).toBe("active");
    expect(subscription.walletAddress).toBe("0x123");
    expect(updated.status).toBe("settled");
    expect(subscription.renewsAt).toBe(subscription.startedAt + 30 * 86_400_000);
  });

  it("throws when signature is invalid", () => {
    const session = gateway.createCheckoutSession({ walletAddress: "0x456", planId: "premium_founder" });

    expect(() =>
      gateway.finalizeSubscription(session, {
        sessionId: session.id,
        status: "settled",
        signature: "deadbeef",
        settledAt: Date.now(),
      }),
    ).toThrow(/Invalid Base Pay payment proof/);
  });
});
