import type {
  ActivityPattern,
  DeFiProtocol,
  NFTCollection,
  PortfolioSnapshot,
  RiskTolerance,
  TokenHolding,
  TradingFrequency,
} from "../portfolio/types";
import { assessPersonality } from "../personality/assessment";
import type { CryptoPersonalityType, PersonalityAssessment } from "../personality/types";

type Personality = CryptoPersonalityType;

export type {
  ActivityPattern,
  DeFiProtocol,
  NFTCollection,
  PortfolioSnapshot,
  RiskTolerance,
  TokenHolding,
  TradingFrequency,
} from "../portfolio/types";

export interface UserProfile {
  id: string;
  displayName: string;
  basename?: string;
  personality: Personality;
  avatarColor?: string;
  location?: string;
  bio?: string;
  achievements?: string[];
}

export interface CompatibilityProfile {
  user: UserProfile;
  portfolio: PortfolioSnapshot;
}

export type SharedInterestType = "token" | "defi" | "nft" | "activity";

export interface SharedInterest {
  type: SharedInterestType;
  name: string;
  detail?: string;
  insight?: string;
}

export interface CompatibilityFactor {
  id: SharedInterestType;
  label: string;
  weight: number;
  score: number;
  summary: string;
}

export interface CompatibilityCategory {
  id: "crypto_soulmates" | "defi_compatible" | "potential_match" | "different_strategies";
  label: string;
  description: string;
  minScore: number;
  highlight: string;
}

export interface CompatibilityScore {
  overall: number;
  tokenSimilarity: number;
  defiCompatibility: number;
  nftAlignment: number;
  activitySync: number;
  category: CompatibilityCategory;
  reasoning: string[];
  factors: CompatibilityFactor[];
}

export interface MatchCandidate {
  user: UserProfile;
  compatibilityScore: CompatibilityScore;
  sharedInterests: SharedInterest[];
  icebreakers: string[];
  personality: PersonalityAssessment;
}

export const SCORE_WEIGHTS = {
  token: 0.6,
  defi: 0.25,
  nft: 0.1,
  activity: 0.05,
} as const;

const FREQUENCY_ALIGNMENT: Record<TradingFrequency, TradingFrequency[]> = {
  daily: ["daily", "weekly"],
  weekly: ["daily", "weekly", "monthly"],
  monthly: ["weekly", "monthly", "occasionally"],
  occasionally: ["monthly", "occasionally"],
};

const RISK_COMPATIBILITY: Record<RiskTolerance, RiskTolerance[]> = {
  conservative: ["conservative", "balanced"],
  balanced: ["conservative", "balanced", "adventurous"],
  adventurous: ["balanced", "adventurous", "degenerate"],
  degenerate: ["adventurous", "degenerate"],
};

const COMPATIBILITY_CATEGORIES: CompatibilityCategory[] = [
  {
    id: "crypto_soulmates",
    label: "Crypto Soulmates",
    description: "Perfectly aligned portfolios, strategies, and vibes.",
    minScore: 0.95,
    highlight: "It\'s like your cold storage keys were cut from the same seed phrase!",
  },
  {
    id: "defi_compatible",
    label: "DeFi Compatible",
    description: "Strong overlap in DeFi strategies with plenty to explore together.",
    minScore: 0.8,
    highlight: "Plenty of alpha to share and yield to farm together.",
  },
  {
    id: "potential_match",
    label: "Potential Match",
    description: "Shared interests with room to learn from each other.",
    minScore: 0.6,
    highlight: "Different stacks, same conviction — perfect for cross-pollination.",
  },
  {
    id: "different_strategies",
    label: "Different Strategies",
    description: "Opposite sides of the risk curve. Could still spark if opposites attract.",
    minScore: 0,
    highlight: "Use this as a chance to debate strategies over brunch.",
  },
];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const roundTo = (value: number, precision = 2) =>
  Math.round(value * 10 ** precision) / 10 ** precision;

function normalizeAllocations(tokens: TokenHolding[]): TokenHolding[] {
  const sorted = [...tokens]
    .filter((token) => token.allocation > 0)
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, 10);
  const total = sorted.reduce((acc, token) => acc + token.allocation, 0);

  if (!total) {
    return sorted.map((token) => ({ ...token, allocation: 0 }));
  }

  return sorted.map((token) => ({
    ...token,
    allocation: token.allocation / total,
  }));
}

function calculateTokenSimilarity(aTokens: TokenHolding[], bTokens: TokenHolding[]): number {
  const normalizedA = normalizeAllocations(aTokens);
  const normalizedB = normalizeAllocations(bTokens);
  const symbols = new Set([
    ...normalizedA.map((token) => token.symbol.toLowerCase()),
    ...normalizedB.map((token) => token.symbol.toLowerCase()),
  ]);

  if (!symbols.size) {
    return 0;
  }

  let overlap = 0;
  let divergence = 0;

  symbols.forEach((symbol) => {
    const allocationA =
      normalizedA.find((token) => token.symbol.toLowerCase() === symbol)?.allocation ?? 0;
    const allocationB =
      normalizedB.find((token) => token.symbol.toLowerCase() === symbol)?.allocation ?? 0;

    overlap += Math.min(allocationA, allocationB);
    divergence += Math.abs(allocationA - allocationB);
  });

  const similarity = overlap - divergence * 0.25;
  return clamp01(similarity);
}

function calculateDefiCompatibility(
  aProtocols: DeFiProtocol[],
  bProtocols: DeFiProtocol[],
): number {
  if (!aProtocols.length || !bProtocols.length) {
    return 0;
  }

  const sharedNames = aProtocols.filter((protocol) =>
    bProtocols.some((candidate) => candidate.name.toLowerCase() === protocol.name.toLowerCase()),
  );

  const sharedCategories = new Set(
    aProtocols
      .map((protocol) => protocol.category)
      .filter((category) => bProtocols.some((protocol) => protocol.category === category)),
  );

  const riskAlignment = aProtocols.reduce((acc, protocol) => {
    const counterpart = bProtocols.find(
      (candidate) => candidate.name.toLowerCase() === protocol.name.toLowerCase(),
    );

    if (!counterpart || !protocol.risk || !counterpart.risk) {
      return acc;
    }

    return acc + (RISK_COMPATIBILITY[protocol.risk].includes(counterpart.risk) ? 1 : 0);
  }, 0);

  const riskDenominator = aProtocols.filter((protocol) => protocol.risk).length;

  const sharedScore = sharedNames.length / new Set([...aProtocols, ...bProtocols].map((protocol) => protocol.name)).size;
  const categoryScore = sharedCategories.size / new Set([...aProtocols, ...bProtocols].map((protocol) => protocol.category)).size;
  const riskScore = riskDenominator ? riskAlignment / riskDenominator : 0.5;

  return clamp01(sharedScore * 0.55 + categoryScore * 0.25 + riskScore * 0.2);
}

function calculateNftAlignment(aCollections: NFTCollection[], bCollections: NFTCollection[]): number {
  if (!aCollections.length || !bCollections.length) {
    return 0;
  }

  const sharedNames = aCollections.filter((collection) =>
    bCollections.some((candidate) => candidate.name.toLowerCase() === collection.name.toLowerCase()),
  );

  const sharedThemes = new Set(
    aCollections
      .map((collection) => collection.theme)
      .filter((theme) => bCollections.some((collection) => collection.theme === theme)),
  );

  const sharedVibes = new Set(
    aCollections
      .map((collection) => collection.vibe)
      .filter(
        (vibe): vibe is NonNullable<NFTCollection["vibe"]> =>
          Boolean(vibe) && bCollections.some((collection) => collection.vibe === vibe),
      ),
  );

  const collectionScore = sharedNames.length / new Set([...aCollections, ...bCollections].map((collection) => collection.name)).size;
  const themeScore = sharedThemes.size / new Set([...aCollections, ...bCollections].map((collection) => collection.theme)).size;
  const vibeScore = sharedVibes.size
    ? sharedVibes.size / new Set([...aCollections, ...bCollections].map((collection) => collection.vibe)).size
    : 0.5;

  return clamp01(collectionScore * 0.5 + themeScore * 0.35 + vibeScore * 0.15);
}

function calculateActivitySync(a: ActivityPattern, b: ActivityPattern): number {
  const timezoneDiff = Math.abs(a.timezoneOffset - b.timezoneOffset);
  const timezoneScore = clamp01(1 - timezoneDiff / 12);

  const activeHoursA = new Set(a.activeHours);
  const activeHoursB = new Set(b.activeHours);
  const overlappingHours = [...activeHoursA].filter((hour) => activeHoursB.has(hour));
  const hoursScore = activeHoursA.size
    ? clamp01(overlappingHours.length / Math.max(activeHoursA.size, activeHoursB.size))
    : 0.3;

  const frequencyScore = FREQUENCY_ALIGNMENT[a.tradingFrequency].includes(b.tradingFrequency) ? 1 : 0.35;
  const riskScore = RISK_COMPATIBILITY[a.riskTolerance].includes(b.riskTolerance) ? 1 : 0.25;

  return clamp01(timezoneScore * 0.4 + hoursScore * 0.35 + frequencyScore * 0.15 + riskScore * 0.1);
}

function buildFactors(score: {
  tokenSimilarity: number;
  defiCompatibility: number;
  nftAlignment: number;
  activitySync: number;
}, sharedInterests: SharedInterest[]): CompatibilityFactor[] {
  const interestSummary = (type: SharedInterestType) => {
    const matches = sharedInterests.filter((interest) => interest.type === type);
    if (!matches.length) {
      return "Explore new territory together.";
    }
    return matches
      .slice(0, 2)
      .map((interest) => interest.detail ?? interest.name)
      .join(" · ");
  };

  return [
    {
      id: "token",
      label: "Token Alignment",
      weight: SCORE_WEIGHTS.token,
      score: score.tokenSimilarity,
      summary: interestSummary("token"),
    },
    {
      id: "defi",
      label: "DeFi Strategy",
      weight: SCORE_WEIGHTS.defi,
      score: score.defiCompatibility,
      summary: interestSummary("defi"),
    },
    {
      id: "nft",
      label: "NFT Culture",
      weight: SCORE_WEIGHTS.nft,
      score: score.nftAlignment,
      summary: interestSummary("nft"),
    },
    {
      id: "activity",
      label: "Activity Sync",
      weight: SCORE_WEIGHTS.activity,
      score: score.activitySync,
      summary: interestSummary("activity"),
    },
  ];
}

function deriveCategory(overall: number): CompatibilityCategory {
  return (
    COMPATIBILITY_CATEGORIES.find((category) => overall >= category.minScore) ??
    COMPATIBILITY_CATEGORIES[COMPATIBILITY_CATEGORIES.length - 1]
  );
}

function formatTokenDetail(token: TokenHolding, allocation: number) {
  const percent = Math.round(allocation * 100);
  const conviction = token.conviction ? ` (${token.conviction})` : "";
  return `${token.symbol} ${percent}%${conviction}`;
}

function buildSharedInterests(
  a: PortfolioSnapshot,
  b: PortfolioSnapshot,
): SharedInterest[] {
  const shared: SharedInterest[] = [];

  const normalizedA = normalizeAllocations(a.tokens);
  const normalizedB = normalizeAllocations(b.tokens);

  normalizedA.forEach((token) => {
    const match = normalizedB.find(
      (candidate) => candidate.symbol.toLowerCase() === token.symbol.toLowerCase(),
    );
    if (!match) {
      return;
    }

    const avgAllocation = (token.allocation + match.allocation) / 2;
    shared.push({
      type: "token",
      name: token.symbol,
      detail: formatTokenDetail(token, avgAllocation),
      insight: `Both allocate ~${Math.round(avgAllocation * 100)}% to ${token.symbol}.`,
    });
  });

  a.defiProtocols.forEach((protocol) => {
    const match = b.defiProtocols.find(
      (candidate) => candidate.name.toLowerCase() === protocol.name.toLowerCase(),
    );

    if (!match) {
      return;
    }

    shared.push({
      type: "defi",
      name: protocol.name,
      detail: `${protocol.name} (${protocol.category})`,
      insight: `Shared strategy in ${protocol.category} via ${protocol.name}.`,
    });
  });

  a.nftCollections.forEach((collection) => {
    const match = b.nftCollections.find(
      (candidate) => candidate.name.toLowerCase() === collection.name.toLowerCase(),
    );

    if (!match) {
      return;
    }

    shared.push({
      type: "nft",
      name: collection.name,
      detail: `${collection.name} (${collection.theme})`,
      insight: `Matching taste in ${collection.theme} NFTs with ${collection.name}.`,
    });
  });

  const timezoneDiff = Math.abs(a.activity.timezoneOffset - b.activity.timezoneOffset);
  const overlapHours = a.activity.activeHours.filter((hour) =>
    b.activity.activeHours.includes(hour),
  );

  if (timezoneDiff <= 3 && overlapHours.length >= 3) {
    shared.push({
      type: "activity",
      name: "Active Hours",
      detail: `Overlap during ${overlapHours
        .slice(0, 3)
        .map((hour) => `${hour}:00`)
        .join(", ")}`,
      insight: "You'll both be online when the market moves.",
    });
  }

  if (RISK_COMPATIBILITY[a.activity.riskTolerance].includes(b.activity.riskTolerance)) {
    shared.push({
      type: "activity",
      name: "Risk Alignment",
      detail: `${a.activity.riskTolerance} ↔ ${b.activity.riskTolerance}`,
      insight: "Risk appetites are in sync for coordinated plays.",
    });
  }

  return shared;
}

function buildReasoning(
  sharedInterests: SharedInterest[],
  score: {
    tokenSimilarity: number;
    defiCompatibility: number;
    nftAlignment: number;
    activitySync: number;
  },
): string[] {
  const reasons: string[] = [];

  const tokenInsights = sharedInterests.filter((interest) => interest.type === "token");
  if (tokenInsights.length) {
    const topTokens = tokenInsights
      .slice(0, 2)
      .map((interest) => interest.detail ?? interest.name)
      .join(" & ");
    reasons.push(`Aligned token thesis around ${topTokens}.`);
  } else if (score.tokenSimilarity > 0.65) {
    reasons.push("Token diversification complements each other nicely.");
  }

  const defiInsights = sharedInterests.filter((interest) => interest.type === "defi");
  if (defiInsights.length) {
    reasons.push(
      `Mutual DeFi strategies in ${defiInsights
        .slice(0, 2)
        .map((interest) => interest.detail ?? interest.name)
        .join(" & ")}.`,
    );
  }

  const nftInsights = sharedInterests.filter((interest) => interest.type === "nft");
  if (nftInsights.length) {
    reasons.push(`Shared NFT culture through ${nftInsights.map((interest) => interest.name).join(", ")}.`);
  }

  const activityInsights = sharedInterests.filter((interest) => interest.type === "activity");
  if (activityInsights.length) {
    reasons.push(activityInsights[0].insight ?? activityInsights[0].detail ?? "Great timing alignment.");
  } else if (score.activitySync > 0.6) {
    reasons.push("Schedules sync up for live market calls.");
  }

  return reasons.slice(0, 4);
}

function generateIcebreakers(sharedInterests: SharedInterest[], category: CompatibilityCategory): string[] {
  const prompts: string[] = [];
  const token = sharedInterests.find((interest) => interest.type === "token");
  if (token) {
    prompts.push(`What's your go-to thesis for ${token.name} this cycle?`);
  }

  const defi = sharedInterests.find((interest) => interest.type === "defi");
  if (defi) {
    prompts.push(`Want to compare ${defi.name} farming tactics this week?`);
  }

  const nft = sharedInterests.find((interest) => interest.type === "nft");
  if (nft) {
    prompts.push(`Which trait do you flex most from ${nft.name}?`);
  }

  if (category.id === "crypto_soulmates") {
    prompts.push("Feels like we\'re already co-managing a treasury. Should we plan our first on-chain date?");
  }

  if (!prompts.length) {
    prompts.push("Curious what your current high-conviction play is?");
  }

  return prompts.slice(0, 4);
}

export function calculateCompatibility(
  seeker: CompatibilityProfile,
  candidate: CompatibilityProfile,
): CompatibilityScore {
  const sharedInterests = buildSharedInterests(seeker.portfolio, candidate.portfolio);

  const tokenSimilarity = calculateTokenSimilarity(
    seeker.portfolio.tokens,
    candidate.portfolio.tokens,
  );
  const defiCompatibility = calculateDefiCompatibility(
    seeker.portfolio.defiProtocols,
    candidate.portfolio.defiProtocols,
  );
  const nftAlignment = calculateNftAlignment(
    seeker.portfolio.nftCollections,
    candidate.portfolio.nftCollections,
  );
  const activitySync = calculateActivitySync(
    seeker.portfolio.activity,
    candidate.portfolio.activity,
  );

  const overall = clamp01(
    tokenSimilarity * SCORE_WEIGHTS.token +
      defiCompatibility * SCORE_WEIGHTS.defi +
      nftAlignment * SCORE_WEIGHTS.nft +
      activitySync * SCORE_WEIGHTS.activity,
  );

  const category = deriveCategory(overall);
  const factors = buildFactors(
    { tokenSimilarity, defiCompatibility, nftAlignment, activitySync },
    sharedInterests,
  );
  const reasoning = buildReasoning(sharedInterests, {
    tokenSimilarity,
    defiCompatibility,
    nftAlignment,
    activitySync,
  });

  return {
    overall: roundTo(overall),
    tokenSimilarity: roundTo(tokenSimilarity),
    defiCompatibility: roundTo(defiCompatibility),
    nftAlignment: roundTo(nftAlignment),
    activitySync: roundTo(activitySync),
    category,
    reasoning,
    factors,
  };
}

export function buildMatchCandidate(
  seeker: CompatibilityProfile,
  candidate: CompatibilityProfile,
): MatchCandidate {
  const score = calculateCompatibility(seeker, candidate);
  const sharedInterests = buildSharedInterests(seeker.portfolio, candidate.portfolio);
  const icebreakers = generateIcebreakers(sharedInterests, score.category);
  const personality = assessPersonality(candidate.portfolio);
  const user: UserProfile = {
    ...candidate.user,
    personality: personality.type,
  };

  return {
    user,
    compatibilityScore: score,
    sharedInterests,
    icebreakers,
    personality,
  };
}

export function describeCategory(score: CompatibilityScore): string {
  return `${score.category.label} • ${Math.round(score.overall * 100)}% compatibility`;
}

