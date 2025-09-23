import type { SharedInterest } from "@/lib/matching/compatibility";
import type { PortfolioSnapshot, ActivityPattern } from "@/lib/portfolio/types";

import type { MarketInsight } from "./types";

const DEFAULT_MAX_INSIGHTS = 3;

const TOKEN_LIBRARY: Record<string, Omit<MarketInsight, "assets">> = {
  ETH: {
    title: "ETH staking flows spike",
    summary: "Beacon Chain deposits are hitting multi-week highs as restaking yields rotate.",
    sentiment: "bullish",
    timeframe: "24h",
  },
  DEGEN: {
    title: "DEGEN tipping frenzy",
    summary: "Farcaster frames pushed DEGEN transfers to new highs. Community energy feels strong.",
    sentiment: "bullish",
    timeframe: "48h",
  },
  AERO: {
    title: "Aerodrome incentives rotate",
    summary: "Gauge votes just shifted more emissions toward core pools — TVL is reacting quickly.",
    sentiment: "bullish",
    timeframe: "24h",
  },
  USDC: {
    title: "Stablecoin flows in motion",
    summary: "Bridged USDC liquidity is rotating across Base vaults as yields compress elsewhere.",
    sentiment: "neutral",
    timeframe: "12h",
  },
  CBETH: {
    title: "cbETH premium narrows",
    summary: "Restaking demand is balancing against LSD yield. Watch the spread for re-entry.",
    sentiment: "neutral",
    timeframe: "3d",
  },
  UNI: {
    title: "UNI governance spotlight",
    summary: "Fee switch chatter is back as delegates debate new incentive structures.",
    sentiment: "volatile",
    timeframe: "7d",
  },
  OP: {
    title: "OP grants window",
    summary: "RetroPGF planning is heating up — ecosystem teams are preparing proposal drafts.",
    sentiment: "bullish",
    timeframe: "7d",
  },
  LINK: {
    title: "Chainlink CCIP adoption",
    summary: "Cross-chain settlement volume keeps climbing. Oracle demand is trending up.",
    sentiment: "bullish",
    timeframe: "5d",
  },
  BAL: {
    title: "Balancer reweights",
    summary: "Gauge adjustments are nudging liquidity to fresh pools. Keep an eye on boosted APRs.",
    sentiment: "volatile",
    timeframe: "48h",
  },
  MAGIC: {
    title: "MAGIC gamer influx",
    summary: "Treasure DAO quests are driving new wallets into the ecosystem this week.",
    sentiment: "bullish",
    timeframe: "72h",
  },
  AEROX: {
    title: "AEROX runway",
    summary: "Early governance proposals hint at aggressive incentive schedules for LPs.",
    sentiment: "bullish",
    timeframe: "36h",
  },
  DEAI: {
    title: "AI tokens volatility",
    summary: "Speculative flows are ping-ponging across AI narratives — manage risk accordingly.",
    sentiment: "volatile",
    timeframe: "24h",
  },
};

const PROTOCOL_LIBRARY: Record<string, MarketInsight> = {
  Aave: {
    title: "Aave Base utilization",
    summary: "Borrow demand is pushing utilization toward the top of risk parameters.",
    sentiment: "bullish",
    assets: ["Aave"],
    timeframe: "24h",
  },
  Aerodrome: {
    title: "Aerodrome epoch flip",
    summary: "Fresh epoch emissions mean new LP APR windows. Gauge voters just made their move.",
    sentiment: "bullish",
    assets: ["Aerodrome"],
    timeframe: "12h",
  },
  EigenLayer: {
    title: "EigenLayer restaking queues",
    summary: "Delegation caps reopened briefly — restakers are racing for the next round.",
    sentiment: "bullish",
    assets: ["EigenLayer"],
    timeframe: "24h",
  },
  BaseSwap: {
    title: "BaseSwap pool rotation",
    summary: "Volume is consolidating into governance-backed pools after the latest incentives vote.",
    sentiment: "neutral",
    assets: ["BaseSwap"],
    timeframe: "24h",
  },
  Moonwell: {
    title: "Moonwell safety module",
    summary: "Security council signaled new collateral onboarding — governance call later this week.",
    sentiment: "neutral",
    assets: ["Moonwell"],
    timeframe: "72h",
  },
  Galxe: {
    title: "Galxe campaign drop",
    summary: "Fresh quests are live for Base explorers. Expect activity spikes in the next 48 hours.",
    sentiment: "bullish",
    assets: ["Galxe"],
    timeframe: "48h",
  },
  Sommelier: {
    title: "Sommelier strategy rebalance",
    summary: "Automated vaults are rotating into lower-vol pools after volatility picked up.",
    sentiment: "neutral",
    assets: ["Sommelier"],
    timeframe: "24h",
  },
};

const NFT_LIBRARY: Record<string, MarketInsight> = {
  BasePaint: {
    title: "BasePaint drop incoming",
    summary: "New palette reveal hits tonight — collectors are prepping offers.",
    sentiment: "bullish",
    assets: ["BasePaint"],
    timeframe: "12h",
  },
  Parallel: {
    title: "Parallel tournament week",
    summary: "Esports qualifiers are streaming live, bringing new eyeballs to the collection.",
    sentiment: "bullish",
    assets: ["Parallel"],
    timeframe: "72h",
  },
  Opepens: {
    title: "Opepens trait meta",
    summary: "Latest mash-up challenge is driving a spike in thin-floor traits.",
    sentiment: "volatile",
    assets: ["Opepens"],
    timeframe: "48h",
  },
  Zuku: {
    title: "Zuku gallery tour",
    summary: "Community curators are spotlighting rare pieces at this weekend's showcase.",
    sentiment: "bullish",
    assets: ["Zuku"],
    timeframe: "72h",
  },
  "Sound XYZ": {
    title: "Sound XYZ premiere",
    summary: "New drop just hit the stage — limited edition tracks are minting fast.",
    sentiment: "bullish",
    assets: ["Sound XYZ"],
    timeframe: "24h",
  },
};

const FALLBACK_INSIGHTS: MarketInsight[] = [
  {
    title: "Base ecosystem momentum",
    summary: "Network throughput keeps climbing as new apps launch — plenty to explore together.",
    sentiment: "bullish",
    timeframe: "7d",
  },
  {
    title: "Rotation watch",
    summary: "Markets are chopping sideways. Perfect window to compare theses before the next move.",
    sentiment: "neutral",
    timeframe: "48h",
  },
];

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

const createTokenInsight = (symbol: string): MarketInsight => {
  const template = TOKEN_LIBRARY[symbol];
  if (template) {
    return { ...template, assets: [symbol] };
  }
  return {
    title: `${symbol} volatility watch`,
    summary: `${symbol} books on Base dexes are heating up. Might be time to sync positioning.`,
    sentiment: "volatile",
    assets: [symbol],
    timeframe: "24h",
  };
};

const createProtocolInsight = (name: string): MarketInsight => {
  const template = PROTOCOL_LIBRARY[name];
  if (template) {
    return template;
  }
  return {
    title: `${name} strategy check`,
    summary: `${name} usage is shifting. Could be a good time to compare allocation notes.`,
    sentiment: "neutral",
    assets: [name],
    timeframe: "24h",
  };
};

const createNftInsight = (name: string): MarketInsight => {
  const template = NFT_LIBRARY[name];
  if (template) {
    return template;
  }
  return {
    title: `${name} collector chatter`,
    summary: `Floor moves are hinting at renewed attention on ${name}.`,
    sentiment: "neutral",
    assets: [name],
    timeframe: "72h",
  };
};

const describeTimezone = (activity?: ActivityPattern) => {
  if (!activity) {
    return "UTC";
  }
  const offset = activity.timezoneOffset;
  const sign = offset >= 0 ? "+" : "-";
  const value = Math.abs(offset);
  const hours = Math.floor(value)
    .toString()
    .padStart(2, "0");
  return `UTC${sign}${hours}`;
};

const createActivityInsight = (
  interest: SharedInterest,
  seekerActivity: ActivityPattern,
  candidateActivity?: ActivityPattern,
): MarketInsight => {
  const window = interest.detail ?? interest.insight ?? "Evening window";
  const timezone = describeTimezone(candidateActivity ?? seekerActivity);
  return {
    title: "Overlapping market window",
    summary: interest.insight
      ? interest.insight
      : `You both tend to log on around ${window}. Perfect time for a shared alpha check-in.`,
    sentiment: "neutral",
    assets: [],
    timeframe: `${timezone} focus`,
  };
};

export interface MarketInsightContext {
  sharedInterests: SharedInterest[];
  seekerPortfolio: PortfolioSnapshot;
  candidatePortfolio?: PortfolioSnapshot;
  maxInsights?: number;
}

export function buildMarketInsights({
  sharedInterests,
  seekerPortfolio,
  candidatePortfolio,
  maxInsights = DEFAULT_MAX_INSIGHTS,
}: MarketInsightContext): MarketInsight[] {
  const limit = Math.max(1, maxInsights);
  const insights: MarketInsight[] = [];
  const seenTitles = new Set<string>();

  const push = (insight: MarketInsight) => {
    if (!insight.title || seenTitles.has(insight.title) || insights.length >= limit) {
      return;
    }
    insights.push(insight);
    seenTitles.add(insight.title);
  };

  const tokenInterests = sharedInterests.filter((interest) => interest.type === "token");
  tokenInterests.forEach((interest) => {
    const symbol = normalizeSymbol(interest.name);
    push(createTokenInsight(symbol));
  });

  if (insights.length < limit) {
    const defiInterests = sharedInterests.filter((interest) => interest.type === "defi");
    defiInterests.forEach((interest) => push(createProtocolInsight(interest.name)));
  }

  if (insights.length < limit) {
    const nftInterests = sharedInterests.filter((interest) => interest.type === "nft");
    nftInterests.forEach((interest) => push(createNftInsight(interest.name)));
  }

  if (insights.length < limit) {
    const activityInterest = sharedInterests.find((interest) => interest.type === "activity");
    if (activityInterest) {
      push(createActivityInsight(activityInterest, seekerPortfolio.activity, candidatePortfolio?.activity));
    }
  }

  if (insights.length < limit) {
    const additionalToken = seekerPortfolio.tokens[0]?.symbol ?? candidatePortfolio?.tokens[0]?.symbol;
    if (additionalToken) {
      push(createTokenInsight(normalizeSymbol(additionalToken)));
    }
  }

  if (insights.length < limit) {
    FALLBACK_INSIGHTS.forEach((insight) => push(insight));
  }

  return insights.slice(0, limit);
}
