import type { CompatibilityAnalysisRecord } from "../portfolio/analysis";
import type {
  ActivityPeriod,
  SanitizedActivityPattern,
  SanitizedPortfolioSnapshot,
  SanitizedTokenHolding,
} from "../portfolio/types";
import type { SharedInterest } from "../matching/compatibility";

type CompatibilityCategoryId = CompatibilityAnalysisRecord["score"]["category"]["id"];

type InfographicTheme = "electric" | "midnight" | "sunrise";

export type SocialPlatform = "warpcast" | "lens" | "x";

export interface CreateCompatibilityReportOptions {
  ownerAlias?: string;
  partnerAlias?: string;
  theme?: InfographicTheme;
  platforms?: SocialPlatform[];
  shareBaseUrl?: string;
  referralCode?: string;
}

export interface InfographicMetric {
  label: string;
  value: string;
  sentiment: "glow" | "steady" | "build";
  emphasis: "primary" | "secondary" | "supporting";
  description: string;
}

export interface CompatibilityInfographic {
  theme: InfographicTheme;
  hero: {
    title: string;
    value: string;
    caption: string;
    badge: string;
  };
  metrics: InfographicMetric[];
  highlights: string[];
}

export interface SocialSharePlan {
  platform: SocialPlatform;
  copy: string;
  hashtags: string[];
  callToAction: string;
  referralUrl: string;
  viralityScore: number;
  recommendedPostTime: string;
}

export interface ReferralTracking {
  code: string;
  shareUrl: string;
  campaign: string;
  parameters: Record<string, string>;
}

export interface ReportPrivacySummary {
  tokensShared: boolean;
  defiShared: boolean;
  nftShared: boolean;
  activityShared: boolean;
  highlightsShared: boolean;
  summary: string;
  badges: string[];
  warnings: string[];
}

export interface CompatibilityReport {
  id: string;
  analysisId: string;
  ownerId: string;
  targetUserId?: string;
  summary: string;
  highlights: string[];
  insights: string[];
  heroStat: string;
  viralityScore: number;
  shareCopy: string;
  sharePlans: SocialSharePlan[];
  infographic: CompatibilityInfographic;
  referral: ReferralTracking;
  privacy: ReportPrivacySummary;
  createdAt: Date;
}

const DEFAULT_THEME: InfographicTheme = "electric";
const DEFAULT_SHARE_BASE_URL = "https://bonded.fun/match";
const DEFAULT_PLATFORMS: SocialPlatform[] = ["warpcast", "lens", "x"];
const REFERRAL_CAMPAIGN = "compatibility_report";

const ALLOCATION_BUCKET_COPY: Record<SanitizedTokenHolding["allocationBucket"], string> = {
  dominant: "core position",
  significant: "high-conviction play",
  diversified: "diversified stack",
  exploratory: "exploratory bet",
};

const ACTIVITY_PERIOD_COPY: Record<ActivityPeriod, string> = {
  early_morning: "early morning",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  late_night: "late night",
};

const FREQUENCY_COPY: Record<NonNullable<SanitizedActivityPattern>["tradingFrequency"], string> = {
  daily: "daily rhythm",
  weekly: "weekly sync",
  monthly: "monthly cadence",
  occasionally: "opportunistic moves",
};

const RISK_COPY: Record<NonNullable<SanitizedActivityPattern>["riskTolerance"], string> = {
  conservative: "steady hands",
  balanced: "balanced conviction",
  adventurous: "bold energy",
  degenerate: "full degen mode",
  withheld: "keeps risk profile private",
};

const CATEGORY_HASHTAGS: Record<CompatibilityCategoryId, string> = {
  crypto_soulmates: "CryptoSoulmates",
  defi_compatible: "DeFiDuo",
  potential_match: "OnchainMatch",
  different_strategies: "CryptoOpposites",
};

const CATEGORY_VIRALITY_BOOST: Record<CompatibilityCategoryId, number> = {
  crypto_soulmates: 10,
  defi_compatible: 6,
  potential_match: 3,
  different_strategies: 1,
};

const PLATFORM_CTA: Record<SocialPlatform, string> = {
  warpcast: "Cast this vibe",
  lens: "Mirror the match",
  x: "Retweet the alpha",
};

const PLATFORM_VIRALITY_BOOST: Record<SocialPlatform, number> = {
  warpcast: 5,
  lens: 3,
  x: 4,
};

const PERIOD_TO_MINUTES: Record<ActivityPeriod, number> = {
  early_morning: 7 * 60,
  morning: 10 * 60,
  afternoon: 15 * 60,
  evening: 20 * 60,
  late_night: 23 * 60,
};

interface SharePlanContext {
  record: CompatibilityAnalysisRecord;
  options: CreateCompatibilityReportOptions;
  referralCode: string;
  baseReferralUrl: string;
  highlights: string[];
  insights: string[];
  overallVirality: number;
  platforms: SocialPlatform[];
}

interface InfographicContext {
  theme: InfographicTheme;
  highlights: string[];
  insights: string[];
}

export function createCompatibilityReport(
  record: CompatibilityAnalysisRecord,
  options: CreateCompatibilityReportOptions = {},
): CompatibilityReport {
  const createdAt = new Date();
  const theme = options.theme ?? DEFAULT_THEME;
  const summary = buildSummary(record, options);
  const highlights = buildHighlights(record.snapshot);
  const insights = buildInsights(record.snapshot, record.sharedInterests);

  if (!highlights.length) {
    highlights.push("Privacy-first chemistry: vibes on display, balances hidden.");
  }

  if (!insights.length) {
    insights.push("Shared on-chain mindset without revealing sensitive data.");
  }

  const heroPercent = Math.round(record.score.overall * 100);
  const heroStat = `${heroPercent}% sync`;
  const viralityScore = computeViralityScore(
    record,
    highlights.length,
    insights.length,
  );

  const referralCode = options.referralCode ?? generateReferralCode(record.ownerId);
  const shareBaseUrl = (options.shareBaseUrl ?? DEFAULT_SHARE_BASE_URL).replace(/\/$/, "");
  const baseReferralUrl = `${shareBaseUrl}/${encodeURIComponent(record.id)}`;
  const defaultShareUrl = `${baseReferralUrl}?ref=${encodeURIComponent(referralCode)}&utm_source=direct&utm_medium=report&utm_campaign=${REFERRAL_CAMPAIGN}`;

  const infographic = buildInfographic(record, { theme, highlights, insights });
  const privacy = buildPrivacySummary(record.snapshot);

  const platforms = normalizePlatforms(options.platforms);
  const sharePlans = buildSharePlans({
    record,
    options,
    referralCode,
    baseReferralUrl,
    highlights,
    insights,
    overallVirality: viralityScore,
    platforms,
  });

  const shareCopy = sharePlans[0]?.copy ?? summary;

  return {
    id: `report_${record.id}`,
    analysisId: record.id,
    ownerId: record.ownerId,
    targetUserId: record.targetUserId,
    summary,
    highlights,
    insights,
    heroStat,
    viralityScore,
    shareCopy,
    sharePlans,
    infographic,
    referral: {
      code: referralCode,
      shareUrl: defaultShareUrl,
      campaign: REFERRAL_CAMPAIGN,
      parameters: {
        ref: referralCode,
        analysis: record.id,
        category: record.score.category.id,
        score: heroPercent.toString(),
      },
    },
    privacy,
    createdAt,
  };
}

function buildSummary(
  record: CompatibilityAnalysisRecord,
  options: CreateCompatibilityReportOptions,
): string {
  const owner = options.ownerAlias?.trim() || "We";
  const partner = options.partnerAlias?.trim();
  const percent = Math.round(record.score.overall * 100);
  const categoryLabel = record.score.category.label;
  const connection = partner ? `${owner} & ${partner}` : owner;
  return `${connection} unlocked a ${percent}% ${categoryLabel} match. ${record.score.category.highlight}`;
}

function buildHighlights(snapshot: SanitizedPortfolioSnapshot): string[] {
  const highlights: string[] = [];
  const tokenHighlight = buildTokenHighlight(snapshot.tokens);
  if (tokenHighlight) {
    highlights.push(tokenHighlight);
  }

  const defiHighlight = buildDefiHighlight(snapshot.defiProtocols);
  if (defiHighlight) {
    highlights.push(defiHighlight);
  }

  const nftHighlight = buildNftHighlight(snapshot.nftCollections);
  if (nftHighlight) {
    highlights.push(nftHighlight);
  }

  const activityHighlight = buildActivityHighlight(snapshot.activity);
  if (activityHighlight) {
    highlights.push(activityHighlight);
  }

  for (const highlight of snapshot.highlights.slice(0, 2)) {
    const trimmed = highlight.trim();
    if (trimmed) {
      highlights.push(trimmed);
    }
  }

  return highlights;
}

function buildInsights(
  snapshot: SanitizedPortfolioSnapshot,
  sharedInterests: SharedInterest[],
): string[] {
  const insights: string[] = [];
  const seen = new Set<string>();
  const tokensBySymbol = new Map(
    snapshot.tokens.map((token) => [token.symbol.toLowerCase(), token]),
  );
  const defiByName = new Map(
    snapshot.defiProtocols.map((protocol) => [protocol.name.toLowerCase(), protocol]),
  );
  const nftByName = new Map(
    snapshot.nftCollections.map((collection) => [collection.name.toLowerCase(), collection]),
  );

  for (const interest of sharedInterests) {
    const key = `${interest.type}:${interest.name.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    switch (interest.type) {
      case "token": {
        const token = tokensBySymbol.get(interest.name.toLowerCase());
        if (!token) {
          break;
        }
        const bucket = ALLOCATION_BUCKET_COPY[token.allocationBucket];
        insights.push(
          `Shared conviction in ${interest.name.toUpperCase()} as a ${bucket}.`,
        );
        seen.add(key);
        break;
      }
      case "defi": {
        const protocol = defiByName.get(interest.name.toLowerCase());
        if (!protocol) {
          break;
        }
        insights.push(
          `Mutual ${protocol.category} strategies via ${protocol.name}.`,
        );
        seen.add(key);
        break;
      }
      case "nft": {
        const collection = nftByName.get(interest.name.toLowerCase());
        if (!collection) {
          break;
        }
        const vibe = collection.theme;
        insights.push(`Matching NFT culture around ${collection.name} (${vibe}).`);
        seen.add(key);
        break;
      }
      case "activity": {
        const activity = snapshot.activity;
        if (!activity) {
          break;
        }
        if (interest.name === "Risk Alignment") {
          insights.push(
            `Risk appetite aligns at ${RISK_COPY[activity.riskTolerance]}.`,
          );
        } else {
          const periodSummary = formatActivityPeriods(activity.activePeriods);
          insights.push(
            periodSummary
              ? `Active windows sync in the ${periodSummary} (${activity.timezone}).`
              : `Schedules sync in ${activity.timezone} with matching cadence.`,
          );
        }
        seen.add(key);
        break;
      }
      default:
        break;
    }

    if (insights.length >= 4) {
      break;
    }
  }

  if (insights.length < 4) {
    for (const highlight of snapshot.highlights) {
      const trimmed = highlight.trim();
      if (trimmed && !insights.includes(trimmed)) {
        insights.push(trimmed);
      }
      if (insights.length >= 4) {
        break;
      }
    }
  }

  return insights;
}

function buildTokenHighlight(tokens: SanitizedTokenHolding[]): string | undefined {
  if (!tokens.length) {
    return undefined;
  }

  const descriptors = tokens.slice(0, 3).map((token) => {
    const conviction = token.conviction ? ` ${token.conviction}` : "";
    return `${token.symbol.toUpperCase()} (${ALLOCATION_BUCKET_COPY[token.allocationBucket]}${conviction})`;
  });

  if (tokens.length > 3) {
    descriptors.push(`+${tokens.length - 3} more`);
  }

  return `Token synergy: ${descriptors.join(" • ")}`;
}

function buildDefiHighlight(protocols: SanitizedPortfolioSnapshot["defiProtocols"]): string | undefined {
  if (!protocols.length) {
    return undefined;
  }

  const names = protocols.slice(0, 3).map((protocol) => protocol.name);
  const categories = Array.from(new Set(protocols.map((protocol) => protocol.category)));
  return `DeFi groove: ${names.join(" • ")} (${categories.join(" & ")})`;
}

function buildNftHighlight(collections: SanitizedPortfolioSnapshot["nftCollections"]): string | undefined {
  if (!collections.length) {
    return undefined;
  }

  const names = collections.slice(0, 3).map((collection) => collection.name);
  const themes = Array.from(new Set(collections.map((collection) => collection.theme)));
  return `NFT vibe: ${names.join(" • ")} (${themes.join(" & ")})`;
}

function buildActivityHighlight(activity: SanitizedActivityPattern | null): string | undefined {
  if (!activity) {
    return undefined;
  }

  const periods = formatActivityPeriods(activity.activePeriods);
  const segments = [
    periods ? `${periods} focus` : null,
    FREQUENCY_COPY[activity.tradingFrequency],
    RISK_COPY[activity.riskTolerance],
    activity.timezone,
  ].filter(Boolean);

  return segments.length ? `Rhythm: ${segments.join(" • ")}` : undefined;
}

function formatActivityPeriods(periods: ActivityPeriod[]): string {
  if (!periods.length) {
    return "";
  }
  return periods.map((period) => ACTIVITY_PERIOD_COPY[period]).join(" & ");
}

function computeViralityScore(
  record: CompatibilityAnalysisRecord,
  highlightCount: number,
  insightCount: number,
): number {
  const base = record.score.overall * 70;
  const factorStrength =
    (record.score.tokenSimilarity + record.score.defiCompatibility + record.score.nftAlignment + record.score.activitySync) / 4;
  const factorBoost = factorStrength * 20;
  const interestBoost = Math.min(record.sharedInterests.length, 8) * 3;
  const highlightBoost = highlightCount * 2.5;
  const insightBoost = insightCount * 1.5;
  const categoryBoost = CATEGORY_VIRALITY_BOOST[record.score.category.id] ?? 0;

  const total = base + factorBoost + interestBoost + highlightBoost + insightBoost + categoryBoost;
  return Math.min(100, Math.round(total));
}

function buildInfographic(
  record: CompatibilityAnalysisRecord,
  context: InfographicContext,
): CompatibilityInfographic {
  const metrics: InfographicMetric[] = [
    buildMetric("Token Alignment", record.score.tokenSimilarity, "primary"),
    buildMetric("DeFi Strategy", record.score.defiCompatibility, "secondary"),
    buildMetric("NFT Culture", record.score.nftAlignment, "supporting"),
    buildMetric("Activity Sync", record.score.activitySync, "supporting"),
  ];

  const heroValue = `${Math.round(record.score.overall * 100)}%`;
  const highlightSnippets = [...context.highlights.slice(0, 2), ...context.insights.slice(0, 1)];

  return {
    theme: context.theme,
    hero: {
      title: record.score.category.label,
      value: heroValue,
      caption: record.score.category.description,
      badge: context.theme === "sunrise" ? "Glowing match" : "Bonded match",
    },
    metrics,
    highlights: highlightSnippets,
  };
}

function buildMetric(
  label: string,
  score: number,
  emphasis: InfographicMetric["emphasis"],
): InfographicMetric {
  const percent = Math.round(score * 100);
  return {
    label,
    value: `${percent}%`,
    sentiment: score >= 0.8 ? "glow" : score >= 0.55 ? "steady" : "build",
    emphasis,
    description:
      score >= 0.8
        ? "High alignment ready for social amplification."
        : score >= 0.55
          ? "Solid resonance with room to co-create."
          : "Emerging synergy to build on together.",
  };
}

function buildSharePlans(context: SharePlanContext): SocialSharePlan[] {
  const { record, options, referralCode, baseReferralUrl, highlights, insights, overallVirality, platforms } = context;
  const snippet = selectShareSnippet(highlights, insights);
  const heroPercent = Math.round(record.score.overall * 100);
  const owner = options.ownerAlias?.trim() || "We";
  const partner = options.partnerAlias?.trim();

  return platforms.map((platform) => {
    const hashtags = buildHashtags(record, platform);
    const referralUrl = buildReferralUrl({
      baseReferralUrl,
      referralCode,
      platform,
      category: record.score.category.id,
      score: heroPercent,
    });
    const copy = composeShareCopy({
      platform,
      owner,
      partner,
      categoryLabel: record.score.category.label,
      percent: heroPercent,
      snippet,
      referralUrl,
    });
    const viralityScore = Math.min(
      100,
      overallVirality + PLATFORM_VIRALITY_BOOST[platform] + hashtags.length,
    );
    const recommendedPostTime = computeRecommendedPostTime(record.snapshot.activity);

    return {
      platform,
      copy,
      hashtags,
      callToAction: PLATFORM_CTA[platform],
      referralUrl,
      viralityScore,
      recommendedPostTime,
    };
  });
}

function selectShareSnippet(highlights: string[], insights: string[]): string {
  const candidates = [...insights, ...highlights];
  for (const candidate of candidates) {
    if (candidate.length <= 90) {
      return candidate;
    }
  }
  const fallback = candidates[0] ?? "On-chain vibes aligned.";
  return truncate(fallback, 90);
}

interface ComposeCopyInput {
  platform: SocialPlatform;
  owner: string;
  partner?: string;
  categoryLabel: string;
  percent: number;
  snippet: string;
  referralUrl: string;
}

function composeShareCopy(input: ComposeCopyInput): string {
  const { platform, owner, partner, categoryLabel, percent, snippet, referralUrl } = input;
  const limit = platform === "x" ? 280 : 300;
  const partnerSegment = partner ? ` with ${partner}` : "";
  const base = `${owner} just hit a ${percent}% ${categoryLabel} match${partnerSegment} on Bonded.`;
  const cta = PLATFORM_CTA[platform];
  const message = `${base} ${snippet} ${cta} ${referralUrl}`;

  if (message.length <= limit) {
    return message;
  }

  const availableForSnippet = limit - (base.length + cta.length + referralUrl.length + 3);
  const shortenedSnippet = availableForSnippet > 0 ? truncate(snippet, availableForSnippet) : "";
  const parts = [base];
  if (shortenedSnippet) {
    parts.push(shortenedSnippet);
  }
  parts.push(cta);
  parts.push(referralUrl);

  return parts.join(" ");
}

interface ReferralUrlInput {
  baseReferralUrl: string;
  referralCode: string;
  platform: SocialPlatform;
  category: CompatibilityCategoryId;
  score: number;
}

function buildReferralUrl(input: ReferralUrlInput): string {
  const { baseReferralUrl, referralCode, platform, category, score } = input;
  const params = new URLSearchParams({
    ref: referralCode,
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: REFERRAL_CAMPAIGN,
    utm_content: category,
    score: score.toString(),
  });
  return `${baseReferralUrl}?${params.toString()}`;
}

function buildHashtags(
  record: CompatibilityAnalysisRecord,
  platform: SocialPlatform,
): string[] {
  const tags = new Set<string>();
  tags.add("Bonded");
  tags.add("OnchainLove");
  tags.add(CATEGORY_HASHTAGS[record.score.category.id]);
  if (platform === "warpcast") {
    tags.add("Base");
  }
  const primaryToken = record.snapshot.tokens[0]?.symbol;
  if (primaryToken) {
    tags.add(primaryToken.toUpperCase());
  }
  if (record.snapshot.defiProtocols.length) {
    tags.add("DeFi");
  }
  if (record.snapshot.nftCollections.length) {
    tags.add("NFTs");
  }
  return Array.from(tags).slice(0, 4);
}

function computeRecommendedPostTime(activity: SanitizedActivityPattern | null): string {
  if (!activity) {
    return "18:00 UTC";
  }

  const periods = activity.activePeriods;
  const primaryPeriod = periods[0] ?? inferPeriodFromFrequency(activity.tradingFrequency);
  const localMinutes = PERIOD_TO_MINUTES[primaryPeriod];
  const offsetHours = parseTimezoneOffset(activity.timezone);
  const offsetMinutes = Math.round(offsetHours * 60);
  const utcMinutes = ((localMinutes - offsetMinutes) % 1440 + 1440) % 1440;
  const hours = Math.floor(utcMinutes / 60);
  const minutes = utcMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} UTC`;
}

function inferPeriodFromFrequency(
  frequency: SanitizedActivityPattern["tradingFrequency"],
): ActivityPeriod {
  switch (frequency) {
    case "daily":
      return "evening";
    case "weekly":
      return "afternoon";
    case "monthly":
      return "morning";
    default:
      return "late_night";
  }
}

function parseTimezoneOffset(timezone: string): number {
  if (timezone === "UTC") {
    return 0;
  }
  const match = timezone.match(/^UTC([+-])(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return 0;
  }
  const [, sign, hoursPart, minutesPart] = match;
  const hours = Number.parseInt(hoursPart, 10) || 0;
  const minutes = Number.parseInt(minutesPart ?? "0", 10) || 0;
  const total = hours + minutes / 60;
  return sign === "-" ? -total : total;
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }
  if (limit <= 1) {
    return value.slice(0, limit);
  }
  return `${value.slice(0, limit - 1)}…`;
}

function buildPrivacySummary(snapshot: SanitizedPortfolioSnapshot): ReportPrivacySummary {
  const tokensShared = snapshot.tokens.length > 0;
  const defiShared = snapshot.defiProtocols.length > 0;
  const nftShared = snapshot.nftCollections.length > 0;
  const activityShared = Boolean(snapshot.activity);
  const highlightsShared = snapshot.highlights.length > 0;

  const badges: string[] = ["No exact balances", "Allocation buckets", "Consent-first sharing"];
  if (activityShared) {
    badges.push("Timezone-safe activity");
  }

  const warnings: string[] = [];
  if (!tokensShared && !defiShared && !nftShared) {
    warnings.push("Portfolio sections hidden — share prompt focuses on compatibility only.");
  }

  const summary = tokensShared || defiShared || nftShared || activityShared || highlightsShared
    ? "Privacy-safe: portfolio insights shared with buckets & summaries. No exact balances disclosed."
    : "Privacy-safe: No portfolio sections shared. Compatibility score only.";

  return {
    tokensShared,
    defiShared,
    nftShared,
    activityShared,
    highlightsShared,
    summary,
    badges,
    warnings,
  };
}

function generateReferralCode(seed: string): string {
  const normalized = seed
    .replace(/[^a-z0-9]/gi, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("");
  const fallback = normalized || "MATCH";
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BND-${fallback}-${random}`;
}

function normalizePlatforms(platforms?: SocialPlatform[]): SocialPlatform[] {
  if (!platforms?.length) {
    return [...DEFAULT_PLATFORMS];
  }
  const unique = Array.from(new Set(platforms));
  return unique.filter((platform): platform is SocialPlatform =>
    DEFAULT_PLATFORMS.includes(platform as SocialPlatform),
  );
}
