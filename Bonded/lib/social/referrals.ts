import type {
  ReferralProgramStatus,
  ReferralRewardLedgerEntry,
  ReferralRewardTier,
} from "./types";

const REFERRAL_TIERS: ReferralRewardTier[] = [
  { id: "alloy", label: "Alloy Ally", requiredInvites: 3, reward: "Priority discovery boost" },
  { id: "catalyst", label: "Catalyst", requiredInvites: 8, reward: "Super like airdrop" },
  { id: "luminary", label: "Luminary", requiredInvites: 15, reward: "Premium preview access" },
];

const REFERRAL_LEDGER: ReferralRewardLedgerEntry[] = [
  {
    id: "boost",
    label: "Priority discovery boost",
    reward: "Queue priority for 7 days",
    awardedAt: new Date("2024-09-01T18:00:00Z").getTime(),
  },
  {
    id: "super-likes",
    label: "Super like airdrop",
    reward: "5 super likes",
    awardedAt: new Date("2024-09-21T15:30:00Z").getTime(),
  },
];

const REFERRAL_STATE = {
  code: "AVA-BASE",
  shareUrl: "https://bonded.fun/join/AVA-BASE",
  invitesSent: 18,
  conversions: 11,
};

const findReachedTierIndex = (conversions: number): number => {
  let index = -1;
  for (let i = 0; i < REFERRAL_TIERS.length; i += 1) {
    if (conversions >= REFERRAL_TIERS[i]!.requiredInvites) {
      index = i;
    }
  }
  return index;
};

const calculateProgressPercent = (conversions: number, tierIndex: number, nextTier?: ReferralRewardTier) => {
  if (tierIndex === -1) {
    const target = REFERRAL_TIERS[0]?.requiredInvites ?? 1;
    return Math.max(0, Math.min(100, Math.round((conversions / target) * 100)));
  }

  const currentTier = REFERRAL_TIERS[tierIndex];
  if (!currentTier) {
    return 0;
  }

  if (!nextTier) {
    return 100;
  }

  const range = nextTier.requiredInvites - currentTier.requiredInvites;
  if (range <= 0) {
    return 100;
  }

  const progress = conversions - currentTier.requiredInvites;
  return Math.max(0, Math.min(100, Math.round((progress / range) * 100)));
};

export function getReferralProgramStatus(): ReferralProgramStatus {
  const reachedIndex = findReachedTierIndex(REFERRAL_STATE.conversions);
  const currentIndex = reachedIndex >= 0 ? reachedIndex : 0;
  const tier = REFERRAL_TIERS[currentIndex] ?? REFERRAL_TIERS[0]!;
  const nextTier = REFERRAL_TIERS[currentIndex + 1];
  const progressPercent = calculateProgressPercent(REFERRAL_STATE.conversions, reachedIndex, nextTier);

  const bonusAvailable = REFERRAL_STATE.invitesSent - REFERRAL_STATE.conversions >= 4;

  return {
    code: REFERRAL_STATE.code,
    shareUrl: REFERRAL_STATE.shareUrl,
    invitesSent: REFERRAL_STATE.invitesSent,
    conversions: REFERRAL_STATE.conversions,
    tier,
    nextTier,
    progressPercent,
    ledger: REFERRAL_LEDGER,
    bonusAvailable,
    bonusDescription: bonusAvailable
      ? "Convert 2 more invites this week to unlock the Base merch drop."
      : undefined,
  };
}
