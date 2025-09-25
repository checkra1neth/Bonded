import type { SanitizedPortfolioSnapshot, SanitizedTokenHolding } from "../portfolio/types";
import type { SharedInterest } from "../matching/compatibility";
import type { SocialPlatform } from "./compatibilityReport";

type HumorIntensity = "light" | "balanced" | "spicy";

type RoastCategory = "token" | "defi" | "nft" | "activity" | "highlight" | "general";

type MemeTemplate =
  | "galaxy_brain"
  | "distracted_partner"
  | "this_is_fine"
  | "drake"
  | "custom_frame";

type MemeSentiment = "bullish" | "bearish" | "volatile" | "neutral";

type ViralContentType = "roast" | "meme" | "success_story" | "report";

type MomentumClassification = "surging" | "steady" | "cooldown";

type AchievementCategory = "community" | "resilience" | "strategy" | "culture";

type ShareConfidence = "emerging" | "steady" | "prime";

interface GeneratePortfolioRoastOptions {
  humor?: HumorIntensity;
  targetAlias?: string;
  sharedHighlights?: string[];
}

interface PortfolioRoastLine {
  category: RoastCategory;
  text: string;
  spiceLevel: number;
}

interface PortfolioRoast {
  tone: HumorIntensity;
  opener: string;
  roasts: PortfolioRoastLine[];
  closing: string;
  disclaimers: string[];
  vibeScore: number;
  recommendedMemes: string[];
}

interface MarketEvent {
  title: string;
  summary: string;
  sentiment: MemeSentiment;
  timeframe: string;
  assets?: string[];
  catalyst?: string;
}

interface MemeGenerationOptions {
  maxMemes?: number;
  trendingHashtags?: string[];
  humor?: HumorIntensity;
  includeSafetyTag?: boolean;
}

interface MemeConcept {
  template: MemeTemplate;
  caption: string;
  overlayText: string[];
  tags: string[];
  marketHook: string;
  callToAction: string;
  shareTiming: string;
  viralityScore: number;
}

interface RelationshipHistory {
  jointDaoMemberships?: string[];
  sharedActivations?: string[];
  bearMarketEvents?: Array<{
    name: string;
    timeframe: string;
    severity: "moderate" | "heavy" | "legendary";
    survived: boolean;
  }>;
  shippedProjects?: string[];
  firstCollaborationDate?: Date;
  onchainAnniversaries?: Array<{ label: string; date: Date }>;
  notableWins?: string[];
}

interface TrackAchievementsInput {
  snapshot: SanitizedPortfolioSnapshot;
  history?: RelationshipHistory;
  sharedInterests?: SharedInterest[];
}

interface PortfolioAchievement {
  id:
    | "joint_dao"
    | "bear_market_survivor"
    | "governance_pillar"
    | "onchain_og"
    | "culture_curator"
    | "yield_sync"
    | "night_shift"
    | "restaking_duo";
  title: string;
  description: string;
  proof: string;
  category: AchievementCategory;
  earnedAt?: Date;
  highlightScore: number;
  tags: string[];
}

interface SuccessStoryAmplificationInput {
  coupleAlias: string;
  achievements: PortfolioAchievement[];
  roast: PortfolioRoast;
  memes?: MemeConcept[];
  sharedInterests?: SharedInterest[];
  callToActionUrl?: string;
  platforms?: SocialPlatform[];
}

interface DistributionPlanItem {
  platform: SocialPlatform;
  format: "cast" | "thread" | "story";
  copy: string;
  scheduleHint: string;
  hashtags: string[];
}

interface SuccessStoryAmplificationPlan {
  headline: string;
  hook: string;
  storyBeats: string[];
  proofPoints: string[];
  distributionPlan: DistributionPlanItem[];
  crossPromoIdeas: string[];
  predictedVirality: number;
  shareConfidence: ShareConfidence;
}

interface ViralContentMetrics {
  impressions: number;
  shares: number;
  clicks: number;
  saves?: number;
  watchTimeSeconds?: number;
  referrals?: number;
  comments?: number;
}

interface ViralContentEvent {
  id: string;
  type: ViralContentType;
  platform: SocialPlatform;
  timestamp: Date;
  tags?: string[];
  sentiment?: MemeSentiment | "playful" | "informative";
  metrics: ViralContentMetrics;
}

interface ViralityAnalyticsOptions {
  timeframeHours?: number;
  targetViralityScore?: number;
}

interface PlatformPerformance {
  platform: SocialPlatform;
  score: number;
  events: number;
}

interface ViralityMomentum {
  score: number;
  classification: MomentumClassification;
  trendingTags: string[];
  peakContentId?: string;
}

interface ViralContentAnalytics {
  eventsAnalyzed: number;
  totalImpressions: number;
  totalShares: number;
  shareRate: number;
  clickThroughRate: number;
  referralCount: number;
  averageWatchTime: number;
  leaderboard: PlatformPerformance[];
  momentum: ViralityMomentum;
  recommendations: string[];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const HUMOR_PROFILE: Record<HumorIntensity, { multiplier: number; opener: string; closing: string }> = {
  light: {
    multiplier: 0.75,
    opener: "Gentle roast mode engaged",
    closing: "All love — vibes over volatility.",
  },
  balanced: {
    multiplier: 1,
    opener: "Spicy alignment check",
    closing: "Still bullish on this duo staying aligned.",
  },
  spicy: {
    multiplier: 1.35,
    opener: "Full degen roast activated",
    closing: "May your next epoch deliver redemption.",
  },
};

const ALLOCATION_TONE: Record<SanitizedTokenHolding["allocationBucket"], string> = {
  dominant: "entire personality thesis",
  significant: "core conviction play",
  diversified: "diversified side quest",
  exploratory: "experimental bag",
};

const ALLOCATION_SPICE: Record<SanitizedTokenHolding["allocationBucket"], number> = {
  dominant: 0.55,
  significant: 0.45,
  diversified: 0.3,
  exploratory: 0.35,
};

const PROTOCOL_CATEGORY_BLURBS: Record<string, string> = {
  lending: "leveraged the Base way",
  dex: "market-making marathon",
  staking: "restaking pilgrimage",
  perps: "perp casino",
  yield: "yield loop gym",
  infrastructure: "infra coordination hub",
};

const ACTIVITY_PERIOD_COPY: Record<string, string> = {
  early_morning: "gm grind",
  morning: "morning sync",
  afternoon: "midday rotation",
  evening: "evening thesis debates",
  late_night: "degen night shift",
};

const DEFAULT_PLATFORMS: SocialPlatform[] = ["warpcast", "lens", "x"];

const MOMENTUM_THRESHOLDS: Record<MomentumClassification, number> = {
  surging: 80,
  steady: 55,
  cooldown: 0,
};

const sanitizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

const dedupe = <T>(values: T[]) => Array.from(new Set(values));

const formatList = (items: string[], conjunction = "and") => {
  if (!items.length) {
    return "";
  }
  if (items.length === 1) {
    return items[0] ?? "";
  }
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
};


function buildTokenRoast(
  token: SanitizedTokenHolding,
  tone: HumorIntensity,
  alias: string,
  index: number,
): PortfolioRoastLine {
  const descriptor = ALLOCATION_TONE[token.allocationBucket];
  const base = `${alias} treats ${sanitizeSymbol(token.symbol)} like a ${descriptor}`;
  const conviction = token.conviction ? ` (${token.conviction} conviction)` : "";

  const intensifier: Record<HumorIntensity, string> = {
    light: `but swears it's just responsible stacking${conviction}.`,
    balanced: `and probably has governance alerts turned on${conviction}.`,
    spicy: `and would tattoo the ticker if the gas was right${conviction}.`,
  };

  const spiceLevel = clamp(55 + index * 5 + ALLOCATION_SPICE[token.allocationBucket] * 60, 0, 100);

  return {
    category: "token",
    text: `${base} ${intensifier[tone]}`,
    spiceLevel,
  };
}

function buildDefiRoast(
  protocols: SanitizedPortfolioSnapshot["defiProtocols"],
  tone: HumorIntensity,
  alias: string,
): PortfolioRoastLine | null {
  if (!protocols.length) {
    return null;
  }

  const primary = protocols[0];
  const context = PROTOCOL_CATEGORY_BLURBS[primary.category] ?? "on-chain experiment";
  const risk = primary.risk ? ` (${primary.risk} risk appetite)` : "";

  const punchlines: Record<HumorIntensity, string> = {
    light: `calls it "research" but it's definitely a ${context}${risk}.`,
    balanced: `turned ${primary.name} into a shared ${context}${risk}.`,
    spicy: `has ${primary.name} notifications louder than their gm pings${risk}.`,
  };

  const secondary = protocols
    .slice(1)
    .map((protocol) => protocol.name)
    .filter(Boolean)
    .map((name) => sanitizeSymbol(name));

  const mention = secondary.length ? ` while dabbling in ${formatList(secondary)}` : "";

  const spiceLevel = clamp(60 + secondary.length * 8 + (tone === "spicy" ? 10 : 0), 0, 100);

  return {
    category: "defi",
    text: `${alias} farms ${primary.name}${mention} and ${punchlines[tone]}`,
    spiceLevel,
  };
}

function buildNftRoast(
  collections: SanitizedPortfolioSnapshot["nftCollections"],
  tone: HumorIntensity,
  alias: string,
): PortfolioRoastLine | null {
  if (!collections.length) {
    return null;
  }

  const primary = collections[0];
  const vibe = primary.vibe ? ` ${primary.vibe} vibes` : "";
  const theme = primary.theme ? `${primary.theme} meta` : "mystery mint";

  const punchlines: Record<HumorIntensity, string> = {
    light: `curates ${theme} like it's a cozy gallery${vibe}.`,
    balanced: `has ${theme}${vibe} mood boards ready for date night.`,
    spicy: `probably proposed with a ${theme}${vibe} floor sweep screenshot.`,
  };

  const altCollections = collections
    .slice(1)
    .map((collection) => collection.name)
    .filter(Boolean);

  const extra = altCollections.length ? ` Their vault still flexes ${formatList(altCollections)}.` : "";

  const spiceLevel = clamp(50 + altCollections.length * 6 + (tone === "spicy" ? 12 : 0), 0, 100);

  return {
    category: "nft",
    text: `${alias} ${punchlines[tone]}${extra}`,
    spiceLevel,
  };
}

function buildActivityRoast(
  activity: SanitizedPortfolioSnapshot["activity"],
  tone: HumorIntensity,
  alias: string,
): PortfolioRoastLine | null {
  if (!activity) {
    return null;
  }

  const primaryPeriod = activity.activePeriods[0];
  const periodCopy = primaryPeriod ? ACTIVITY_PERIOD_COPY[primaryPeriod] ?? "always-on" : "always-on";

  const punchlines: Record<HumorIntensity, string> = {
    light: `sync their ${periodCopy} rotations better than calendar invites.`,
    balanced: `treat ${periodCopy} like a sacred on-chain standup.`,
    spicy: `think ${periodCopy} hedging counts as work-life balance.`,
  };

  const frequency = activity.tradingFrequency;
  const risk = activity.riskTolerance;

  const detail = `Frequency: ${frequency}, risk tolerance: ${risk}.`;
  const spiceLevel = clamp(45 + (frequency === "daily" ? 15 : 0) + (risk === "degenerate" ? 20 : 0), 0, 100);

  return {
    category: "activity",
    text: `${alias} ${punchlines[tone]} ${detail}`,
    spiceLevel,
  };
}

function buildHighlightRoast(
  highlights: string[],
  tone: HumorIntensity,
  alias: string,
): PortfolioRoastLine | null {
  if (!highlights.length) {
    return null;
  }

  const primary = highlights[0];
  const punchlines: Record<HumorIntensity, string> = {
    light: `drops "${primary}" into every Base brunch conversation.`,
    balanced: `turned "${primary}" into their signature flex.`,
    spicy: `still has "${primary}" pinned like it's their identity shard.`,
  };

  const alt = highlights.slice(1, 3);
  const extra = alt.length ? ` Backup flexes: ${alt.join(" · ")}.` : "";

  const spiceLevel = clamp(40 + alt.length * 8 + (tone === "spicy" ? 12 : 0), 0, 100);

  return {
    category: "highlight",
    text: `${alias} ${punchlines[tone]}${extra}`,
    spiceLevel,
  };
}

function ensureRoastFallback(roasts: PortfolioRoastLine[], alias: string, tone: HumorIntensity) {
  if (roasts.length) {
    return roasts;
  }

  const fallback: Record<HumorIntensity, string> = {
    light: `${alias} keeps it low-key — the alpha is in their privacy settings.`,
    balanced: `${alias} is so stealth even the roast bots need permissioned access.`,
    spicy: `${alias} redacted everything except their swagger. Respect.`,
  };

  roasts.push({
    category: "general",
    text: fallback[tone],
    spiceLevel: tone === "spicy" ? 65 : tone === "balanced" ? 55 : 40,
  });

  return roasts;
}

function calculateVibeScore(roasts: PortfolioRoastLine[], tone: HumorIntensity) {
  if (!roasts.length) {
    return tone === "spicy" ? 70 : tone === "balanced" ? 55 : 45;
  }

  const total = roasts.reduce((acc, roast) => acc + roast.spiceLevel, 0);
  const avg = total / roasts.length;
  const multiplier = HUMOR_PROFILE[tone].multiplier;

  return Math.round(clamp(avg * multiplier, 0, 100));
}

export function generatePortfolioRoast(
  snapshot: SanitizedPortfolioSnapshot,
  options: GeneratePortfolioRoastOptions = {},
): PortfolioRoast {
  const tone = options.humor ?? "balanced";
  const alias = options.targetAlias ?? "this wallet";

  const tokenRoasts = snapshot.tokens.slice(0, 3).map((token, index) => buildTokenRoast(token, tone, alias, index));
  const defiRoast = buildDefiRoast(snapshot.defiProtocols, tone, alias);
  const nftRoast = buildNftRoast(snapshot.nftCollections, tone, alias);
  const activityRoast = buildActivityRoast(snapshot.activity, tone, alias);
  const highlightRoast = buildHighlightRoast(
    options.sharedHighlights ?? snapshot.highlights,
    tone,
    alias,
  );

  const roasts = ensureRoastFallback(
    [
      ...tokenRoasts,
      ...(defiRoast ? [defiRoast] : []),
      ...(nftRoast ? [nftRoast] : []),
      ...(activityRoast ? [activityRoast] : []),
      ...(highlightRoast ? [highlightRoast] : []),
    ],
    alias,
    tone,
  );

  const vibeScore = calculateVibeScore(roasts, tone);
  const recommendedMemes = dedupe(
    roasts
      .map((line) => line.text.match(/[A-Z]{2,}/g) ?? [])
      .flat()
      .map((match) => `${match}_meme`),
  ).slice(0, 4);

  const disclaimers = dedupe([
    "Balances stay private — only the vibes were analyzed.",
    "Roasts are playful and respect on-chain consent.",
    tone === "spicy" ? "Opt-out anytime if the heat gets too high." : "Customize tone anytime in settings.",
  ]);

  return {
    tone,
    opener: `${HUMOR_PROFILE[tone].opener} for ${alias}.`,
    roasts,
    closing: HUMOR_PROFILE[tone].closing,
    disclaimers,
    vibeScore,
    recommendedMemes,
  };
}

function pickTemplate(sentiment: MemeSentiment, humor: HumorIntensity): MemeTemplate {
  if (sentiment === "bearish") {
    return humor === "spicy" ? "this_is_fine" : "distracted_partner";
  }
  if (sentiment === "volatile") {
    return humor === "light" ? "distracted_partner" : "drake";
  }
  if (sentiment === "neutral") {
    return "custom_frame";
  }
  return humor === "light" ? "galaxy_brain" : "drake";
}

function sentimentMultiplier(sentiment: MemeSentiment) {
  switch (sentiment) {
    case "bullish":
      return 1.15;
    case "bearish":
      return 0.95;
    case "volatile":
      return 1.05;
    default:
      return 1;
  }
}

function buildOverlayText(
  event: MarketEvent,
  tokens: SanitizedPortfolioSnapshot["tokens"],
  humor: HumorIntensity,
): string[] {
  const focus = event.assets?.[0] ?? tokens[0]?.symbol ?? "GM";
  const sanitizedFocus = sanitizeSymbol(focus);
  const lead = humor === "spicy" ? `${sanitizedFocus} maxis when` : `${sanitizedFocus} fam when`;
  const trail = event.sentiment === "bearish" ? "the chart dips mid-date" : "APYs spike mid-date";
  const altTrail = event.sentiment === "neutral" ? "governance call hits calendar" : trail;

  return [lead, altTrail];
}

export function generateMemeConcepts(
  snapshot: SanitizedPortfolioSnapshot,
  events: MarketEvent[],
  options: MemeGenerationOptions = {},
): MemeConcept[] {
  const humor = options.humor ?? "balanced";
  const maxMemes = clamp(options.maxMemes ?? 3, 1, 6);
  const trending = options.trendingHashtags ?? [];

  const tokens = snapshot.tokens.map((token) => sanitizeSymbol(token.symbol));
  const nftNames = snapshot.nftCollections.map((collection) => sanitizeSymbol(collection.name));

  const candidates = events.length
    ? events
    : [
        {
          title: "Base ecosystem momentum",
          summary: "Builders shipping nonstop on Base.",
          sentiment: "bullish" as MemeSentiment,
          timeframe: "24h",
          assets: tokens.slice(0, 2),
          catalyst: "Community shipping spree",
        },
      ];

  const memes = candidates.map((event, index) => {
    const template = pickTemplate(event.sentiment, humor);
    const overlayText = buildOverlayText(event, snapshot.tokens, humor);
    const sharedAssets = event.assets?.filter((asset) => tokens.includes(sanitizeSymbol(asset))) ?? [];

    const nftBoost = event.assets?.some((asset) => nftNames.includes(sanitizeSymbol(asset))) ? 8 : 0;
    const sharedBoost = sharedAssets.length ? 12 + sharedAssets.length * 3 : 4;
    const toneMultiplier = HUMOR_PROFILE[humor].multiplier;
    const viralityScore = Math.round(
      clamp(
        (60 + index * 5 + nftBoost + sharedBoost) * sentimentMultiplier(event.sentiment) * toneMultiplier,
        30,
        100,
      ),
    );

    const baseTags = dedupe([
      "Bonded",
      ...sharedAssets.map((asset) => `${sanitizeSymbol(asset)}Fam`),
      ...trending,
      event.sentiment === "bearish" ? "StayCalm" : "VibesUp",
    ]);

    const caption = `${event.title}: ${event.summary} — perfect meme fuel for ${formatList(
      sharedAssets.length ? sharedAssets : tokens.slice(0, 2),
    )}.`;
    const marketHook = event.catalyst ?? event.summary;
    const callToAction = `Drop your ${event.sentiment} takes & tag your match.`;
    const shareTiming = `Post within ${event.timeframe} window.`;

    return {
      template,
      caption,
      overlayText,
      tags: baseTags,
      marketHook,
      callToAction,
      shareTiming,
      viralityScore,
    };
  });

  const sorted = memes.sort((a, b) => b.viralityScore - a.viralityScore);
  return sorted.slice(0, maxMemes);
}

function detectGovernanceWins(snapshot: SanitizedPortfolioSnapshot): PortfolioAchievement | null {
  const protocolsWithGovernance = snapshot.defiProtocols.filter((protocol) =>
    ["lending", "dex", "staking"].includes(protocol.category),
  );

  if (!protocolsWithGovernance.length) {
    return null;
  }

  const names = protocolsWithGovernance.map((protocol) => protocol.name).filter(Boolean);
  return {
    id: "governance_pillar",
    title: "Governance Pillars",
    description: `Steer the future of ${formatList(names)} with consistent votes and proposals.`,
    proof: `Active across ${formatList(names)} governance circles.`,
    category: "community",
    highlightScore: clamp(55 + names.length * 6, 40, 90),
    tags: ["governance", "community"],
  };
}

function detectRestaking(snapshot: SanitizedPortfolioSnapshot): PortfolioAchievement | null {
  const stakingProtocols = snapshot.defiProtocols.filter((protocol) => protocol.category === "staking");

  if (!stakingProtocols.length) {
    return null;
  }

  return {
    id: "restaking_duo",
    title: "Restaking Duo",
    description: `Navigated restaking meta via ${formatList(stakingProtocols.map((protocol) => protocol.name))} together.`,
    proof: `${stakingProtocols.length} staking adventures logged.`,
    category: "strategy",
    highlightScore: clamp(50 + stakingProtocols.length * 5, 45, 85),
    tags: ["restaking", "strategy"],
  };
}

export function trackPortfolioAchievements({
  snapshot,
  history,
  sharedInterests,
}: TrackAchievementsInput): PortfolioAchievement[] {
  const achievements: PortfolioAchievement[] = [];

  if (history?.jointDaoMemberships?.length) {
    const daos = dedupe(history.jointDaoMemberships);
    achievements.push({
      id: "joint_dao",
      title: "Joint DAO Operators",
      description: `Running ${formatList(daos)} like a shared mission control.`,
      proof: `Co-stewards of ${formatList(daos)}.`,
      category: "community",
      earnedAt: history.firstCollaborationDate,
      highlightScore: clamp(70 + daos.length * 4, 60, 95),
      tags: ["dao", "team"],
    });
  }

  const survivedEvents = history?.bearMarketEvents?.filter((event) => event.survived) ?? [];
  if (survivedEvents.length) {
    const legendary = survivedEvents.some((event) => event.severity === "legendary");
    achievements.push({
      id: "bear_market_survivor",
      title: legendary ? "Legendary Bear Market Survivors" : "Bear Market Survivors",
      description: `Held conviction through ${formatList(survivedEvents.map((event) => event.name))}.`,
      proof: `${survivedEvents.length} major drawdowns weathered together.`,
      category: "resilience",
      highlightScore: clamp(65 + survivedEvents.length * 5 + (legendary ? 10 : 0), 55, 98),
      tags: ["resilience", "markets"],
    });
  }

  if (snapshot.highlights.length) {
    achievements.push({
      id: "onchain_og",
      title: "Onchain OG Energy",
      description: `Legacy flex: ${snapshot.highlights[0]}.`,
      proof: snapshot.highlights.slice(0, 3).join(" · "),
      category: "culture",
      highlightScore: clamp(50 + snapshot.highlights.length * 4, 45, 85),
      tags: ["culture", "legacy"],
    });
  }

  const nftCollections = snapshot.nftCollections.map((collection) => collection.name);
  if (nftCollections.length) {
    achievements.push({
      id: "culture_curator",
      title: "Culture Curators",
      description: `Collecting ${formatList(nftCollections)} keeps the vibe gallery stocked.`,
      proof: `${nftCollections.length} shared NFT narratives.`,
      category: "culture",
      highlightScore: clamp(48 + nftCollections.length * 3, 40, 82),
      tags: ["nft", "culture"],
    });
  }

  const sharedYield = sharedInterests?.filter((interest) => interest.type === "defi") ?? [];
  if (sharedYield.length) {
    achievements.push({
      id: "yield_sync",
      title: "Yield Syncers",
      description: `Optimizing ${formatList(sharedYield.map((interest) => interest.name))} with aligned risk.`,
      proof: sharedYield.map((interest) => interest.insight ?? interest.detail ?? interest.name).join(" · "),
      category: "strategy",
      highlightScore: clamp(52 + sharedYield.length * 4, 45, 88),
      tags: ["yield", "strategy"],
    });
  }

  const nightOwl = snapshot.activity?.activePeriods.includes("late_night");
  if (nightOwl) {
    achievements.push({
      id: "night_shift",
      title: "Night Shift Strategists",
      description: "Coordinated late-night rotations without missing a block.",
      proof: `Active windows: ${formatList(snapshot.activity?.activePeriods ?? [])}.`,
      category: "strategy",
      highlightScore: clamp(45 + (snapshot.activity?.activePeriods.length ?? 0) * 4, 40, 80),
      tags: ["activity", "sync"],
    });
  }

  const governance = detectGovernanceWins(snapshot);
  if (governance) {
    achievements.push(governance);
  }

  const restaking = detectRestaking(snapshot);
  if (restaking) {
    achievements.push(restaking);
  }

  const byScore = achievements.sort((a, b) => b.highlightScore - a.highlightScore || a.title.localeCompare(b.title));

  const uniqueById = new Map<string, PortfolioAchievement>();
  byScore.forEach((achievement) => {
    if (!uniqueById.has(achievement.id)) {
      uniqueById.set(achievement.id, achievement);
    }
  });

  return Array.from(uniqueById.values());
}

function determineConfidence(score: number): ShareConfidence {
  if (score >= MOMENTUM_THRESHOLDS.surging) {
    return "prime";
  }
  if (score >= MOMENTUM_THRESHOLDS.steady) {
    return "steady";
  }
  return "emerging";
}

export function buildSuccessStoryAmplification(
  input: SuccessStoryAmplificationInput,
): SuccessStoryAmplificationPlan {
  const achievements = input.achievements.slice(0, 4);
  const topAchievement = achievements[0];
  const shared = input.sharedInterests ?? [];
  const memeTags = input.memes?.flatMap((meme) => meme.tags) ?? [];

  const hook = topAchievement
    ? `${input.coupleAlias} turned ${topAchievement.title.toLowerCase()} into their love language.`
    : `${input.coupleAlias} found chemistry in Base blocks.`;

  const storyBeats = dedupe([
    hook,
    input.roast.roasts[0]?.text ?? "Shared on-chain instincts sparked things fast.",
    topAchievement?.description,
    achievements[1]?.description,
    shared[0]?.insight,
  ]).filter((beat): beat is string => typeof beat === "string" && beat.trim().length > 0);

  const proofPoints = dedupe([
    ...(achievements.length ? achievements.map((achievement) => achievement.proof) : []),
    input.roast.disclaimers[0],
  ]).slice(0, 5);

  const platforms = input.platforms ?? DEFAULT_PLATFORMS;
  const hashtags = dedupe([
    "Bonded",
    ...memeTags.map((tag) => tag.replace(/^#/, "")),
    ...achievements.flatMap((achievement) => achievement.tags),
  ]);

  const distributionPlan: DistributionPlanItem[] = platforms.map((platform, index) => {
    const format = platform === "x" ? "thread" : platform === "lens" ? "story" : "cast";
    const hashtagList = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
    const callToAction = input.callToActionUrl
      ? ` Bring your match: ${input.callToActionUrl}`
      : "";

    const scheduleHint = index === 0 ? "Morning spotlight" : index === 1 ? "Afternoon engagement" : "Evening recap";
    const sharedHook = storyBeats[0] ?? hook;
    const copy = `${sharedHook} ${achievements[0]?.proof ?? "Chemistry verified."} ${callToAction}`.trim();

    return {
      platform,
      format,
      copy,
      scheduleHint,
      hashtags: hashtagList.slice(0, 6),
    };
  });

  const predictedVirality = clamp(
    Math.round(
      (input.roast.vibeScore * 0.35 + achievements.reduce((acc, achievement) => acc + achievement.highlightScore, 0) * 0.2 +
        (input.memes?.length ?? 0) * 12 +
        shared.length * 6 +
        25) /
        Math.max(1, achievements.length),
    ),
    40,
    100,
  );

  const crossPromoIdeas = dedupe([
    input.memes?.[0]?.caption ?? "Clip the best roast as a Reel.",
    "Turn the DAO win into a carousel breakdown.",
    "Host a live governance recap with Q&A.",
  ]).slice(0, 4);

  return {
    headline: `${input.coupleAlias} • ${topAchievement?.title ?? "On-chain success"}`,
    hook,
    storyBeats,
    proofPoints,
    distributionPlan,
    crossPromoIdeas,
    predictedVirality,
    shareConfidence: determineConfidence(predictedVirality),
  };
}

function evaluateEventScore(event: ViralContentEvent): number {
  const metrics = event.metrics;
  const engagement = metrics.shares * 3 + metrics.clicks * 1.5 + (metrics.comments ?? 0) * 1.2;
  const referralBoost = (metrics.referrals ?? 0) * 5;
  const saveBoost = (metrics.saves ?? 0) * 1.1;
  const watchBoost = metrics.watchTimeSeconds ? metrics.watchTimeSeconds / 20 : 0;
  const shareRate = metrics.impressions ? (metrics.shares / metrics.impressions) * 100 : 0;

  return clamp(engagement + referralBoost + saveBoost + watchBoost + shareRate, 0, 150);
}

function classifyMomentum(score: number): MomentumClassification {
  if (score >= MOMENTUM_THRESHOLDS.surging) {
    return "surging";
  }
  if (score >= MOMENTUM_THRESHOLDS.steady) {
    return "steady";
  }
  return "cooldown";
}

export function trackViralContentPerformance(
  events: ViralContentEvent[],
  options: ViralityAnalyticsOptions = {},
): ViralContentAnalytics {
  const timeframeHours = options.timeframeHours ?? 72;
  const cutoff = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

  const relevantEvents = events.filter((event) => event.timestamp >= cutoff);

  if (!relevantEvents.length) {
    return {
      eventsAnalyzed: 0,
      totalImpressions: 0,
      totalShares: 0,
      shareRate: 0,
      clickThroughRate: 0,
      referralCount: 0,
      averageWatchTime: 0,
      leaderboard: [],
      momentum: {
        score: 0,
        classification: "cooldown",
        trendingTags: [],
      },
      recommendations: [
        "Launch fresh content to spark engagement in the next cycle.",
        "Test meme templates aligned with current market energy.",
      ],
    };
  }

  let totalImpressions = 0;
  let totalShares = 0;
  let totalClicks = 0;
  let totalReferrals = 0;
  let totalWatchTime = 0;
  let watchEvents = 0;

  const platformScores = new Map<SocialPlatform, { score: number; events: number }>();
  const tagCounts = new Map<string, number>();
  let topEventScore = -Infinity;
  let peakContentId: string | undefined;

  relevantEvents.forEach((event) => {
    const score = evaluateEventScore(event);
    if (score > topEventScore) {
      topEventScore = score;
      peakContentId = event.id;
    }

    totalImpressions += event.metrics.impressions;
    totalShares += event.metrics.shares;
    totalClicks += event.metrics.clicks;
    totalReferrals += event.metrics.referrals ?? 0;
    if (event.metrics.watchTimeSeconds) {
      totalWatchTime += event.metrics.watchTimeSeconds;
      watchEvents += 1;
    }

    const existing = platformScores.get(event.platform) ?? { score: 0, events: 0 };
    platformScores.set(event.platform, {
      score: existing.score + score,
      events: existing.events + 1,
    });

    event.tags?.forEach((tag) => {
      const normalized = tag.startsWith("#") ? tag : `#${tag}`;
      tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
    });
  });

  const shareRate = totalImpressions ? totalShares / totalImpressions : 0;
  const clickThroughRate = totalImpressions ? totalClicks / totalImpressions : 0;
  const averageWatchTime = watchEvents ? totalWatchTime / watchEvents : 0;

  const leaderboard: PlatformPerformance[] = Array.from(platformScores.entries())
    .map(([platform, value]) => ({
      platform,
      score: Math.round(value.score),
      events: value.events,
    }))
    .sort((a, b) => b.score - a.score);

  const momentumScore = clamp(
    Math.round(
      (leaderboard[0]?.score ?? 0) * 0.4 +
        shareRate * 100 * 0.35 +
        clickThroughRate * 100 * 0.2 +
        (totalReferrals > 0 ? 8 : 0),
    ),
    0,
    100,
  );

  const trendingTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const recommendations: string[] = [];

  if (momentumScore < (options.targetViralityScore ?? 75)) {
    recommendations.push("Experiment with a spicier roast tone for the next drop.");
  }
  if (shareRate < 0.15) {
    recommendations.push("Add clearer calls-to-action to boost shares.");
  }
  if (!trendingTags.length) {
    recommendations.push("Seed a campaign hashtag to build momentum.");
  }
  if (averageWatchTime < 45 && watchEvents) {
    recommendations.push("Test shorter clips or punchier hooks for video content.");
  }

  if (!recommendations.length) {
    recommendations.push("Keep stacking — momentum is compounding nicely.");
  }

  return {
    eventsAnalyzed: relevantEvents.length,
    totalImpressions,
    totalShares,
    shareRate,
    clickThroughRate,
    referralCount: totalReferrals,
    averageWatchTime,
    leaderboard,
    momentum: {
      score: momentumScore,
      classification: classifyMomentum(momentumScore),
      trendingTags,
      peakContentId,
    },
    recommendations,
  };
}

export type {
  HumorIntensity,
  PortfolioRoast,
  PortfolioRoastLine,
  GeneratePortfolioRoastOptions,
  MemeConcept,
  MemeGenerationOptions,
  MarketEvent,
  RelationshipHistory,
  PortfolioAchievement,
  TrackAchievementsInput,
  SuccessStoryAmplificationInput,
  SuccessStoryAmplificationPlan,
  ViralContentEvent,
  ViralContentAnalytics,
  ViralityAnalyticsOptions,
};
