import type { MatchCandidate } from "../matching/compatibility";
import { describePlan, hasFeature } from "./plans";
import type { PremiumPlan } from "./types";

export interface SuperLikeSpotlightEntry {
  id: string;
  candidateId: string;
  displayName: string;
  compatibilityPercent: number;
  categoryLabel: string;
  headline: string;
  sharedSignal: string;
  timestamp: number;
}

export interface PremiumProfileHighlight {
  title: string;
  description: string;
  accentColor: string;
  badge: string;
}

export interface PremiumContentItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  availability: "available" | "coming_soon";
}

const SPOTLIGHT_PREFIX = "spotlight";

const selectSharedSignal = (candidate: MatchCandidate): string => {
  if (candidate.compatibilityScore.reasoning.length) {
    return candidate.compatibilityScore.reasoning[0] as string;
  }
  if (candidate.sharedInterests.length) {
    const first = candidate.sharedInterests[0];
    return first.insight ?? first.detail ?? first.name;
  }
  return "High-intent signal captured.";
};

export function buildSuperLikeSpotlightEntry(
  candidate: MatchCandidate,
  timestamp = Date.now(),
): SuperLikeSpotlightEntry {
  return {
    id: `${SPOTLIGHT_PREFIX}_${candidate.user.id}_${timestamp}`,
    candidateId: candidate.user.id,
    displayName: candidate.user.displayName,
    compatibilityPercent: Math.round(candidate.compatibilityScore.overall * 100),
    categoryLabel: candidate.compatibilityScore.category.label,
    headline:
      candidate.user.headline ??
      `Shared ${candidate.compatibilityScore.category.label.toLowerCase()} energy`,
    sharedSignal: selectSharedSignal(candidate),
    timestamp,
  };
}

export function buildPremiumProfileHighlight(plan: PremiumPlan): PremiumProfileHighlight {
  const badge = describePlan(plan);
  const accentColor = plan.id === "premium_partner" ? "#ff9f6b" : "#5f5bff";
  const title = plan.id === "premium_partner" ? "Signal Amplified" : "Founder Spotlight";
  const description = hasFeature(plan, "profile_highlighting")
    ? "Your profile is boosted in discovery carousels and social recaps."
    : "Upgrade to boost your visibility across premium cohorts.";

  return {
    title,
    description,
    accentColor,
    badge,
  };
}

export function generateExclusiveContent(plan: PremiumPlan): PremiumContentItem[] {
  if (!hasFeature(plan, "exclusive_content")) {
    return [];
  }

  const base: PremiumContentItem[] = [
    {
      id: "intel-report",
      title: "Weekly Base Alpha Brief",
      description: "Curated governance intel and on-chain momentum direct to your inbox.",
      tag: "Insight Drop",
      availability: "available",
    },
    {
      id: "vault-lounge",
      title: "Super Like Vault Lounge",
      description: "Review every super like with extended conversation starters and follow-ups.",
      tag: "Spotlight",
      availability: "available",
    },
  ];

  if (plan.id === "premium_partner") {
    base.push(
      {
        id: "concierge-intros",
        title: "Concierge dealflow calendar",
        description: "Coordinate curated intros with top Base ecosystem founders each week.",
        tag: "Partner",
        availability: "available",
      },
      {
        id: "cohost-lab",
        title: "Premium co-hosting lab",
        description: "Launch a joint Base event with marketing templates and RSVP automation.",
        tag: "Events",
        availability: "coming_soon",
      },
    );
  } else {
    base.push({
      id: "founder-capsule",
      title: "Founder conversation capsules",
      description: "Unlock AI-crafted prompts tailored to your latest on-chain moves.",
      tag: "Conversation",
      availability: "available",
    });
  }

  return base;
}
