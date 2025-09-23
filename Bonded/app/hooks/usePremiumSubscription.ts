"use client";

import { useCallback, useMemo, useState } from "react";

import type { MatchDecision } from "@/lib/matching/compatibility";
import type { MatchQueueState } from "@/lib/matching/queue";
import {
  BasePaySubscriptionGateway,
  buildPremiumProfileHighlight,
  evaluateDecision,
  generateExclusiveContent,
  generateWhoLikedMe,
  hasFeature,
  initializeUsage,
  partitionEventsForPlan,
  recordDecision,
  resolvePlan,
  revertDecision,
  type BasePayCheckoutSession,
  type EventPartition,
  type InboundLikeInsight,
  type LikeAllowanceEvaluation,
  type PremiumContentItem,
  type PremiumPlan,
  type PremiumPlanId,
  type PremiumProfileHighlight,
  type PremiumSubscription,
  type PremiumUsageWindow,
  type SubscriptionActivationResult,
} from "@/lib/premium";
import type { MatchDecisionRecord } from "@/lib/matching/queue";
import type { ChallengeEvent } from "@/lib/gamification/types";

const DEFAULT_PLAN_ID: PremiumPlanId = "premium_founder";

interface CheckoutRequestOptions {
  walletAddress: string;
  email?: string;
  referrer?: string;
}

export interface UsePremiumSubscriptionOptions {
  planId?: PremiumPlanId;
  queueState?: MatchQueueState;
}

export interface UsePremiumSubscriptionResult {
  plan: PremiumPlan;
  allowance: LikeAllowanceEvaluation;
  usage: PremiumUsageWindow;
  whoLikedMe: InboundLikeInsight[];
  canSendDecision: (decision: MatchDecision) => LikeAllowanceEvaluation;
  registerDecision: (decision: MatchDecision) => void;
  undoDecision: (decision: MatchDecisionRecord) => void;
  startCheckout: (request: CheckoutRequestOptions) => Promise<SubscriptionActivationResult>;
  checkoutSession: BasePayCheckoutSession | null;
  subscription: PremiumSubscription | null;
  isProcessingCheckout: boolean;
  checkoutError: string | null;
  partitionEvents: (events: ChallengeEvent[]) => EventPartition;
  features: {
    hasAdvancedFilters: boolean;
    hasUndo: boolean;
    hasSuperLikeSpotlight: boolean;
    hasExclusiveContent: boolean;
  };
  profileHighlight: PremiumProfileHighlight | null;
  exclusiveContent: PremiumContentItem[];
}

const APP_ID = process.env.NEXT_PUBLIC_BASE_PAY_APP_ID ?? "bonded-app";
const SECRET = process.env.NEXT_PUBLIC_BASE_PAY_PUBLISHABLE_KEY ?? "bonded-founders";

export function usePremiumSubscription(
  options: UsePremiumSubscriptionOptions = {},
): UsePremiumSubscriptionResult {
  const plan = useMemo(() => resolvePlan(options.planId ?? DEFAULT_PLAN_ID), [options.planId]);
  const [usage, setUsage] = useState<PremiumUsageWindow>(() => initializeUsage(Date.now()));
  const [checkoutSession, setCheckoutSession] = useState<BasePayCheckoutSession | null>(null);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isProcessingCheckout, setProcessingCheckout] = useState(false);

  const gateway = useMemo(() => new BasePaySubscriptionGateway({ appId: APP_ID, secret: SECRET }), []);

  const allowance = useMemo<LikeAllowanceEvaluation>(() => {
    return evaluateDecision(plan, { decision: "like", usage, timestamp: Date.now() });
  }, [plan, usage]);

  const whoLikedMe = useMemo<InboundLikeInsight[]>(() => {
    if (!options.queueState) {
      return [];
    }
    return generateWhoLikedMe({ entries: options.queueState.entries }, plan);
  }, [options.queueState, plan]);

  const canSendDecision = useCallback(
    (decision: MatchDecision): LikeAllowanceEvaluation => {
      return evaluateDecision(plan, { decision, usage, timestamp: Date.now() });
    },
    [plan, usage],
  );

  const registerDecision = useCallback(
    (decision: MatchDecision) => {
      setUsage((current) => recordDecision(plan, current, decision, Date.now()));
    },
    [plan],
  );

  const undoDecision = useCallback(
    (decision: MatchDecisionRecord) => {
      setUsage((current) => revertDecision(plan, current, decision.decision, decision.createdAt));
    },
    [plan],
  );

  const startCheckout = useCallback(
    async (request: CheckoutRequestOptions): Promise<SubscriptionActivationResult> => {
      setProcessingCheckout(true);
      setCheckoutError(null);
      try {
        const session = gateway.createCheckoutSession({
          walletAddress: request.walletAddress,
          planId: plan.id,
          email: request.email,
          referrer: request.referrer,
        });

        const signature = gateway.generateSignature(session, "settled");
        const result = gateway.finalizeSubscription(session, {
          sessionId: session.id,
          status: "settled",
          signature,
          settledAt: Date.now(),
        });

        setCheckoutSession(result.session);
        setSubscription(result.subscription);
        setProcessingCheckout(false);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setCheckoutError(message);
        setProcessingCheckout(false);
        throw error;
      }
    },
    [gateway, plan.id],
  );

  const partitionEvents = useCallback(
    (events: ChallengeEvent[]): EventPartition => partitionEventsForPlan(events, plan),
    [plan],
  );

  const features = useMemo(
    () => ({
      hasAdvancedFilters: hasFeature(plan, "advanced_filters"),
      hasUndo: hasFeature(plan, "undo_swipe"),
      hasSuperLikeSpotlight: hasFeature(plan, "super_like_spotlight"),
      hasExclusiveContent: hasFeature(plan, "exclusive_content"),
    }),
    [plan],
  );

  const profileHighlight = useMemo<PremiumProfileHighlight | null>(() => {
    if (!hasFeature(plan, "profile_highlighting")) {
      return null;
    }
    return buildPremiumProfileHighlight(plan);
  }, [plan]);

  const exclusiveContent = useMemo<PremiumContentItem[]>(() => generateExclusiveContent(plan), [plan]);

  return {
    plan,
    allowance,
    usage,
    whoLikedMe,
    canSendDecision,
    registerDecision,
    undoDecision,
    startCheckout,
    checkoutSession,
    subscription,
    isProcessingCheckout,
    checkoutError,
    partitionEvents,
    features,
    profileHighlight,
    exclusiveContent,
  };
}
