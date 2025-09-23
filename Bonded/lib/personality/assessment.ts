import type {
  ActivityPattern,
  DeFiProtocol,
  NFTCollection,
  PortfolioSnapshot,
  TokenHolding,
} from "../portfolio/types";
import {
  PERSONALITY_TAGLINES,
  type CryptoPersonalityType,
  type PersonalityAssessment,
  type PersonalityScoreDetail,
} from "./types";

const STABLECOIN_SYMBOLS = ["USDC", "USDbC", "USDT", "DAI", "LUSD", "FRAX", "GHO", "EURC"];
const BLUECHIP_SYMBOLS = ["ETH", "WETH", "WBTC", "BTC", "CBETH", "STETH", "RETH", "UNI"];
const MEME_TOKENS = [
  "DEGEN",
  "DOGE",
  "SHIB",
  "PEPE",
  "MEME",
  "FLOKI",
  "BONK",
  "AEROX",
  "WIF",
];
const GAMING_TOKENS = [
  "MAGIC",
  "ILV",
  "GALA",
  "AXS",
  "PRIME",
  "IMX",
  "SAND",
  "MANA",
  "PYR",
];

const NIGHT_HOURS = new Set([0, 1, 2, 3, 4, 5, 22, 23]);

const TRADING_INTENSITY: Record<ActivityPattern["tradingFrequency"], number> = {
  daily: 1,
  weekly: 0.7,
  monthly: 0.45,
  occasionally: 0.25,
};

const RISK_APPETITE: Record<ActivityPattern["riskTolerance"], number> = {
  conservative: 0.2,
  balanced: 0.5,
  adventurous: 0.8,
  degenerate: 1,
};

const PERSONALITY_ORDER: CryptoPersonalityType[] = [
  "Banker",
  "DeFi Degen",
  "NFT Collector",
  "GameFi Player",
  "Diamond Hands",
  "Day Trader",
];

type DerivedMetrics = {
  stableShare: number;
  bluechipShare: number;
  memeShare: number;
  gamingShare: number;
  tokenCount: number;
  tokenDiversity: number;
  highConvictionRatio: number;
  nftTotal: number;
  artNftRatio: number;
  gamingNftRatio: number;
  protocolCount: number;
  yieldProtocolRatio: number;
  dexProtocolRatio: number;
  gamingProtocolRatio: number;
  tradingIntensity: number;
  lowTrading: number;
  riskAppetite: number;
  lowRisk: number;
  lateNightActivity: number;
};

export function assessPersonality(snapshot: PortfolioSnapshot): PersonalityAssessment {
  const tokens = snapshot.tokens ?? [];
  const protocols = snapshot.defiProtocols ?? [];
  const nfts = snapshot.nftCollections ?? [];
  const activity = snapshot.activity;

  const metrics = deriveMetrics(tokens, protocols, nfts, activity);

  const scores: PersonalityScoreDetail[] = PERSONALITY_ORDER.map((type) => ({
    type,
    score: calculateScore(type, metrics),
    description: buildScoreDescription(type, metrics),
  })).sort((a, b) => b.score - a.score);

  const primary = scores[0];
  const runnerUp = scores[1];

  const confidence = clamp01(0.4 + (primary.score - (runnerUp?.score ?? 0)) * 0.6);

  return {
    type: primary.type,
    confidence,
    summary: buildSummary(primary.type, metrics, nfts.length),
    headline: PERSONALITY_TAGLINES[primary.type],
    scores,
    strengths: buildStrengths(primary.type, metrics),
    growthAreas: buildGrowthAreas(primary.type, metrics),
  } satisfies PersonalityAssessment;
}

function deriveMetrics(
  tokens: TokenHolding[],
  protocols: DeFiProtocol[],
  nfts: NFTCollection[],
  activity: ActivityPattern,
): DerivedMetrics {
  const totalAllocation = tokens.reduce((sum, token) => sum + Math.max(token.allocation, 0), 0) || 1;
  const allocationFor = (symbols: string[]) =>
    tokens
      .filter((token) => symbols.includes(token.symbol.toUpperCase()))
      .reduce((sum, token) => sum + Math.max(token.allocation, 0), 0) / totalAllocation;

  const stableShare = clamp01(allocationFor(STABLECOIN_SYMBOLS));
  const bluechipShare = clamp01(allocationFor(BLUECHIP_SYMBOLS));
  const memeShare = clamp01(allocationFor(MEME_TOKENS));
  const gamingShare = clamp01(allocationFor(GAMING_TOKENS));

  const tokenCount = tokens.length;
  const tokenDiversity = clamp01(tokenCount / 8);
  const highConvictionRatio = tokenCount
    ? tokens.filter((token) => token.conviction === "high").length / tokenCount
    : 0;

  const nftTotal = nfts.length;
  const artNftRatio = nftTotal
    ? clamp01(
        nfts.filter((nft) => nft.theme === "art" || nft.theme === "pfp").length / Math.max(nftTotal, 1),
      )
    : 0;
  const gamingNftRatio = nftTotal
    ? clamp01(nfts.filter((nft) => nft.theme === "gaming" || nft.theme === "metaverse").length / nftTotal)
    : 0;

  const protocolCount = protocols.length;
  const yieldProtocolRatio = protocolCount
    ? clamp01(
        protocols.filter((protocol) => protocol.category === "lending" || protocol.category === "staking").length /
          protocolCount,
      )
    : 0;
  const dexProtocolRatio = protocolCount
    ? clamp01(
        protocols.filter((protocol) => protocol.category === "dex" || protocol.category === "perps").length /
          protocolCount,
      )
    : 0;
  const gamingProtocolRatio = protocolCount
    ? clamp01(
        protocols.filter((protocol) => isGamingProtocol(protocol)).length / protocolCount,
      )
    : 0;

  const tradingIntensity = TRADING_INTENSITY[activity.tradingFrequency];
  const riskAppetite = RISK_APPETITE[activity.riskTolerance];

  const lateNightActivity = activity.activeHours.some((hour) => NIGHT_HOURS.has(hour)) ? 1 : 0;

  return {
    stableShare,
    bluechipShare,
    memeShare,
    gamingShare,
    tokenCount,
    tokenDiversity,
    highConvictionRatio,
    nftTotal,
    artNftRatio,
    gamingNftRatio,
    protocolCount,
    yieldProtocolRatio,
    dexProtocolRatio,
    gamingProtocolRatio,
    tradingIntensity,
    lowTrading: 1 - tradingIntensity,
    riskAppetite,
    lowRisk: 1 - riskAppetite,
    lateNightActivity,
  } satisfies DerivedMetrics;
}

function calculateScore(type: CryptoPersonalityType, metrics: DerivedMetrics): number {
  switch (type) {
    case "Banker":
      return clamp01(
        metrics.stableShare * 0.5 +
          metrics.yieldProtocolRatio * 0.25 +
          metrics.lowRisk * 0.15 +
          metrics.lowTrading * 0.1,
      );
    case "DeFi Degen":
      return clamp01(
        metrics.riskAppetite * 0.35 +
          metrics.tradingIntensity * 0.25 +
          metrics.dexProtocolRatio * 0.2 +
          metrics.memeShare * 0.1 +
          Math.min(metrics.tokenDiversity, 0.4) * 0.1,
      );
    case "NFT Collector":
      return clamp01(
        clamp01(metrics.nftTotal / 4) * 0.55 +
          metrics.artNftRatio * 0.2 +
          metrics.lowTrading * 0.15 +
          Math.min(metrics.gamingNftRatio, 0.6) * 0.1,
      );
    case "GameFi Player":
      return clamp01(
        metrics.gamingShare * 0.4 +
          metrics.gamingNftRatio * 0.25 +
          metrics.gamingProtocolRatio * 0.2 +
          metrics.tradingIntensity * 0.15,
      );
    case "Diamond Hands":
      return clamp01(
        metrics.bluechipShare * 0.45 +
          metrics.highConvictionRatio * 0.2 +
          metrics.lowTrading * 0.25 +
          clamp01(metrics.lowRisk + metrics.bluechipShare) * 0.1,
      );
    case "Day Trader":
      return clamp01(
        metrics.tradingIntensity * 0.4 +
          metrics.tokenDiversity * 0.2 +
          metrics.dexProtocolRatio * 0.15 +
          metrics.lateNightActivity * 0.1 +
          metrics.riskAppetite * 0.15,
      );
  }
}

function buildSummary(
  type: CryptoPersonalityType,
  metrics: DerivedMetrics,
  nftCount: number,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  switch (type) {
    case "Banker":
      return `Capital preservation forward with ${percent(metrics.stableShare)} in stablecoins and steady lending/staking coverage.`;
    case "DeFi Degen":
      return `Risk-on operator rotating through high-velocity DeFi plays with ${percent(metrics.dexProtocolRatio)} of activity in DEX/perps.`;
    case "NFT Collector":
      return `Culture-maxi wallet anchored by ${nftCount} NFT collections and curated art/pfp exposure.`;
    case "GameFi Player":
      return `Metaverse native blending gaming tokens and experiences with ${percent(metrics.gamingNftRatio)} of NFTs in play-to-earn ecosystems.`;
    case "Diamond Hands":
      return `Long-horizon conviction investor holding ${percent(metrics.bluechipShare)} blue chips and rarely rotating positions.`;
    case "Day Trader":
      return `Tempo-driven trader cycling across ${metrics.tokenCount} tokens with an always-on cadence.`;
  }
}

function buildStrengths(type: CryptoPersonalityType, metrics: DerivedMetrics): string[] {
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  switch (type) {
    case "Banker":
      return [
        `Disciplined treasury allocation with ${percent(metrics.stableShare)} stablecoin coverage`,
        metrics.yieldProtocolRatio > 0
          ? `Comfortable across lending & staking mainstays (${percent(metrics.yieldProtocolRatio)} of protocols)`
          : "Keeps strategies focused on dependable blue-chip rails",
        metrics.lowTrading > 0.5 ? "Patient capital deployment with minimal churn" : "Balances upgrades with risk oversight",
      ];
    case "DeFi Degen":
      return [
        metrics.dexProtocolRatio > 0.4
          ? `Deep liquidity experience across on-chain DEX/perps (${percent(metrics.dexProtocolRatio)} of activity)`
          : "Comfortable experimenting with new protocol primitives",
        metrics.riskAppetite > 0.7 ? "High tolerance for volatility and asymmetric upside" : "Adapts risk quickly to market shifts",
        metrics.tradingIntensity > 0.7 ? "Operates at daily execution cadence" : "Keeps pulse on emergent meta",
      ];
    case "NFT Collector":
      return [
        nftFocusHeadline(metrics.nftTotal),
        metrics.artNftRatio > 0.3
          ? `Strong taste profile across art/pfp drops (${percent(metrics.artNftRatio)} of holdings)`
          : "Balances culture bets with selective curation",
        metrics.lowTrading > 0.5 ? "Long-term thesis across cultural assets" : "Actively rebalances narrative exposure",
      ];
    case "GameFi Player":
      return [
        metrics.gamingShare > 0
          ? `Meaningful allocation to gaming tokens (${percent(metrics.gamingShare)} of portfolio)`
          : "Tracks emergent play-to-earn economics",
        metrics.gamingNftRatio > 0
          ? `Immersed in metaverse guilds (${percent(metrics.gamingNftRatio)} of NFTs)`
          : "Strategizes around virtual world assets",
        metrics.tradingIntensity > 0.6 ? "Active in live events and seasonal drops" : "Curates long-term game ecosystems",
      ];
    case "Diamond Hands":
      return [
        `Conviction-weighted blue-chip stack (${percent(metrics.bluechipShare)} exposure)`,
        metrics.highConvictionRatio > 0.4
          ? `High signal sizing with ${percent(metrics.highConvictionRatio)} of tokens held with conviction`
          : "Keeps positions right-sized for long arcs",
        metrics.lowTrading > 0.6 ? "Patient rotation aligned with macro theses" : "Balances upgrades with steady hands",
      ];
    case "Day Trader":
      return [
        metrics.tradingIntensity > 0.8 ? "Operates on intraday cadence" : "Consistent weekly execution", 
        metrics.tokenDiversity > 0.5
          ? `Scans broad opportunity set (${metrics.tokenCount} active tokens)`
          : "Focuses attention on high velocity pairs",
        metrics.lateNightActivity ? "Catches overnight volatility windows" : "Keeps disciplined trading schedule",
      ];
  }
}

function buildGrowthAreas(type: CryptoPersonalityType, metrics: DerivedMetrics): string[] {
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  switch (type) {
    case "Banker":
      return [
        metrics.memeShare < 0.1 ? "Experiment with small asymmetric bets to capture upside" : "Balance speculative bets with treasury core",
        metrics.tradingIntensity < 0.5
          ? "Schedule periodic reviews to capture new yield meta"
          : "Document frameworks to avoid over-rotation",
      ];
    case "DeFi Degen":
      return [
        metrics.lowRisk > 0.5 ? "Layer protective hedges to preserve gains" : "Introduce defensive stables for downcycles",
        metrics.memeShare > 0.2
          ? `Rebalance meme exposure below ${percent(metrics.memeShare)} to protect treasury`
          : "Track long-tail positions to avoid dilution",
      ];
    case "NFT Collector":
      return [
        metrics.nftTotal > 3 ? "Consider documenting provenance for premium pieces" : "Expand curation with collaborative drops",
        metrics.lowTrading < 0.5 ? "Calibrate flip cadence to avoid gas drag" : "Set alerts for cultural catalysts",
      ];
    case "GameFi Player":
      return [
        metrics.bluechipShare < 0.25 ? "Anchor gameplay yields with some blue-chip stability" : "Balance play-to-earn with liquid reserves",
        metrics.gamingProtocolRatio < 0.4 ? "Explore guild tooling and infra to boost rewards" : "Track risk of concentrated guild exposure",
      ];
    case "Diamond Hands":
      return [
        metrics.lowTrading > 0.7 ? "Schedule thesis reviews to capture new narratives" : "Keep conviction logs to stay patient",
        metrics.stableShare < 0.2 ? "Add strategic stablecoin buffer for downside protection" : "Deploy idle stables with hedged yield",
      ];
    case "Day Trader":
      return [
        metrics.lowTrading > 0.5 ? "Lock in a dedicated trading schedule to maintain edge" : "Build cool-down rituals to avoid burnout",
        metrics.lowRisk > 0.5 ? "Use conviction sizing to avoid overexposure" : "Document risk parameters for high velocity trades",
      ];
  }
}

function buildScoreDescription(type: CryptoPersonalityType, metrics: DerivedMetrics): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  switch (type) {
    case "Banker":
      return `${percent(metrics.stableShare)} stablecoin cover with ${percent(metrics.yieldProtocolRatio)} yield protocols.`;
    case "DeFi Degen":
      return `${percent(metrics.dexProtocolRatio)} DEX/perps mix and elevated risk appetite.`;
    case "NFT Collector":
      return `${metrics.nftTotal} NFT sets with ${percent(metrics.artNftRatio)} art/pfp focus.`;
    case "GameFi Player":
      return `${percent(metrics.gamingShare)} in game tokens plus ${percent(metrics.gamingNftRatio)} gaming NFTs.`;
    case "Diamond Hands":
      return `${percent(metrics.bluechipShare)} blue chips with ${percent(metrics.highConvictionRatio)} conviction sizing.`;
    case "Day Trader":
      return `${percent(metrics.tradingIntensity)} trading cadence across ${metrics.tokenCount} tokens.`;
  }
}

function nftFocusHeadline(count: number) {
  if (count === 0) {
    return "Curates cultural exposure through token positions";
  }

  if (count === 1) {
    return "Signature collection anchored by a flagship NFT";
  }

  if (count <= 3) {
    return `Focused collector across ${count} NFT sets`;
  }

  return `Diverse gallery spanning ${count} NFT collections`;
}

function isGamingProtocol(protocol: DeFiProtocol): boolean {
  const normalized = protocol.name.toLowerCase();
  return (
    protocol.category === "infrastructure" ||
    normalized.includes("game") ||
    normalized.includes("play") ||
    normalized.includes("arcade") ||
    normalized.includes("galxe") ||
    normalized.includes("guild")
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}
