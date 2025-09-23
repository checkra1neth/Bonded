"use client";

import type { ChallengeEvent } from "@/lib/gamification/types";
import type {
  InboundLikeInsight,
  LikeAllowanceEvaluation,
  PremiumPlan,
  PremiumSubscription,
} from "@/lib/premium";

import styles from "./PremiumSubscriptionPanel.module.css";

interface PremiumSubscriptionPanelProps {
  plan: PremiumPlan;
  allowance: LikeAllowanceEvaluation;
  whoLikedMe: InboundLikeInsight[];
  subscription: PremiumSubscription | null;
  lockedEvents: ChallengeEvent[];
  isProcessing: boolean;
  checkoutError: string | null;
  onUpgrade: () => void;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function PremiumSubscriptionPanel({
  plan,
  allowance,
  whoLikedMe,
  subscription,
  lockedEvents,
  isProcessing,
  checkoutError,
  onUpgrade,
}: PremiumSubscriptionPanelProps) {
  const hasUnlimitedLikes = allowance.remainingLikes === null;
  const likesCopy = hasUnlimitedLikes
    ? "Unlimited likes"
    : `${allowance.remainingLikes ?? 0} likes remaining today`;

  const superLikeCopy = allowance.remainingSuperLikes === null
    ? "Unlimited super likes"
    : `${allowance.remainingSuperLikes ?? 0} super likes remaining`;

  const statusLabel = subscription ? "Active" : "Pilot access";

  return (
    <section className={styles.container} aria-labelledby="premium-title">
      <header className={styles.header}>
        <div>
          <span className={styles.planBadge}>{statusLabel}</span>
          <h2 id="premium-title">{plan.name}</h2>
          <p className={styles.description}>{plan.description}</p>
        </div>
        <div className={styles.price}>${plan.monthlyPriceUsd}/mo</div>
      </header>

      <div className={styles.metrics}>
        <div>
          <strong>{likesCopy}</strong>
          <span>Priority multiplier ×{plan.priorityMultiplier.toFixed(2)}</span>
        </div>
        <div>
          <strong>{superLikeCopy}</strong>
          <span>Daily signal allowance</span>
        </div>
      </div>

      <ul className={styles.perks}>
        {plan.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      <div className={styles.whoLikedMe}>
        <h3>Who liked you</h3>
        {whoLikedMe.length === 0 ? (
          <p className={styles.emptyState}>No pending likes waiting — keep the queue flowing.</p>
        ) : (
          <ul>
            {whoLikedMe.map((insight) => (
              <li key={insight.candidateId}>
                <div>
                  <strong>{insight.displayName}</strong>
                  <span>{insight.personality}</span>
                </div>
                <div className={styles.whoMeta}>
                  <span>{formatPercent(insight.compatibility)}</span>
                  <span>{insight.headline}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lockedEvents.length > 0 && (
        <div className={styles.lockedEvents}>
          <h3>Premium-only events</h3>
          <ul>
            {lockedEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <span>{event.premiumPerks?.[0] ?? "Exclusive Base community salon"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className={styles.footer}>
        <button type="button" onClick={onUpgrade} disabled={isProcessing} className={styles.cta}>
          {subscription ? "Manage Base Pay billing" : "Activate via Base Pay"}
        </button>
        {checkoutError ? <p className={styles.error}>{checkoutError}</p> : null}
      </footer>
    </section>
  );
}
