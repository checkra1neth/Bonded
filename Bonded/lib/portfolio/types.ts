export type RiskTolerance = "conservative" | "balanced" | "adventurous" | "degenerate";

export type TradingFrequency = "daily" | "weekly" | "monthly" | "occasionally";

export interface TokenHolding {
  symbol: string;
  allocation: number;
  conviction?: "high" | "medium" | "exploratory";
  chain?: string;
}

export interface DeFiProtocol {
  name: string;
  category: "lending" | "dex" | "staking" | "perps" | "yield" | "infrastructure";
  strategy?: string;
  risk?: RiskTolerance;
}

export interface NFTCollection {
  name: string;
  theme: "art" | "gaming" | "pfp" | "music" | "metaverse" | "collectible";
  vibe?: "playful" | "luxury" | "cypherpunk" | "degen" | "artsy";
}

export interface ActivityPattern {
  timezoneOffset: number; // hours relative to UTC
  activeHours: number[]; // 0-23 values
  tradingFrequency: TradingFrequency;
  riskTolerance: RiskTolerance;
}

export interface PortfolioSnapshot {
  tokens: TokenHolding[];
  defiProtocols: DeFiProtocol[];
  nftCollections: NFTCollection[];
  activity: ActivityPattern;
  highlights?: string[];
}

export type AllocationBucket = "dominant" | "significant" | "diversified" | "exploratory";

export type ActivityPeriod =
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "late_night";

export interface SanitizedTokenHolding extends Omit<TokenHolding, "allocation"> {
  allocationBucket: AllocationBucket;
}

export interface SanitizedActivityPattern {
  timezone: string;
  activePeriods: ActivityPeriod[];
  tradingFrequency: TradingFrequency;
  riskTolerance: RiskTolerance;
}

export interface SanitizedPortfolioSnapshot {
  tokens: SanitizedTokenHolding[];
  defiProtocols: DeFiProtocol[];
  nftCollections: NFTCollection[];
  activity: SanitizedActivityPattern | null;
  highlights: string[];
}
