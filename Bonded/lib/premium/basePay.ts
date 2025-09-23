import { resolvePlan } from "./plans";
import type {
  BasePayCheckoutSession,
  BasePayPaymentProof,
  BasePayPaymentStatus,
  PremiumPlanId,
  PremiumSubscription,
  SubscriptionActivationResult,
} from "./types";

const BILLING_CYCLE_DAYS = 30;
const CHECKOUT_EXPIRY_MINUTES = 10;

interface BasePayGatewayOptions {
  appId: string;
  secret: string;
  billingCycleDays?: number;
}

interface CheckoutRequest {
  walletAddress: string;
  planId: PremiumPlanId;
  email?: string;
  referrer?: string;
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

function deriveSignature(secret: string, sessionId: string, status: BasePayPaymentStatus, wallet: string) {
  const payload = `${secret}:${sessionId}:${status}:${wallet.toLowerCase()}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function addDays(timestamp: number, days: number) {
  return timestamp + days * 86_400_000;
}

export class BasePaySubscriptionGateway {
  private readonly appId: string;
  private readonly secret: string;
  private readonly billingCycleDays: number;

  constructor(options: BasePayGatewayOptions) {
    this.appId = options.appId;
    this.secret = options.secret;
    this.billingCycleDays = options.billingCycleDays ?? BILLING_CYCLE_DAYS;
  }

  createCheckoutSession(request: CheckoutRequest): BasePayCheckoutSession {
    const plan = resolvePlan(request.planId);
    const now = Date.now();
    return {
      id: randomId("bp_session"),
      appId: this.appId,
      planId: plan.id,
      walletAddress: request.walletAddress.toLowerCase(),
      amountUsd: plan.monthlyPriceUsd,
      currency: "USD",
      status: "pending",
      createdAt: now,
      expiresAt: now + CHECKOUT_EXPIRY_MINUTES * 60 * 1000,
      metadata: {
        email: request.email,
        referrer: request.referrer,
      },
    };
  }

  generateSignature(session: BasePayCheckoutSession, status: BasePayPaymentStatus): string {
    return deriveSignature(this.secret, session.id, status, session.walletAddress);
  }

  verifyPayment(session: BasePayCheckoutSession, proof: BasePayPaymentProof): boolean {
    if (session.id !== proof.sessionId) {
      return false;
    }
    const expected = this.generateSignature(session, proof.status);
    return expected === proof.signature;
  }

  finalizeSubscription(
    session: BasePayCheckoutSession,
    proof: BasePayPaymentProof,
  ): SubscriptionActivationResult {
    if (!this.verifyPayment(session, proof)) {
      throw new Error("Invalid Base Pay payment proof");
    }

    if (proof.status === "failed" || proof.status === "pending") {
      throw new Error(`Payment status ${proof.status} cannot activate subscription`);
    }

    const activatedAt = proof.settledAt ?? Date.now();
    const renewsAt = addDays(activatedAt, this.billingCycleDays);

    const subscription: PremiumSubscription = {
      id: randomId("premium_sub"),
      planId: session.planId,
      walletAddress: session.walletAddress,
      status: "active",
      startedAt: activatedAt,
      renewsAt,
      paymentReference: proof.signature,
    };

    const updatedSession: BasePayCheckoutSession = {
      ...session,
      status: proof.status,
    };

    return { session: updatedSession, subscription };
  }
}

export type { CheckoutRequest };
