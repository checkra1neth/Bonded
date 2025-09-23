export type RiskTolerance = "conservative" | "balanced" | "adventurous" | "degenerate";

export type TradingFrequency = "daily" | "weekly" | "monthly" | "occasionally";

export interface TokenHolding {
  symbol: string;
  allocation: number;
  conviction?: "high" | "medium" | "exploratory";
  chain?: string;
}

export type TransactionDirection = "inbound" | "outbound" | "self";

export interface PortfolioTransaction {
  id: string;
  hash?: string | null;
  timestamp: number;
  direction: TransactionDirection;
  counterparty: string;
  counterpartyType?: "protocol" | "user" | "bridge" | "contract" | "unknown";
  protocol?: string;
  asset?: string | null;
  valueUsd?: number | null;
  note?: string | null;
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
  transactions?: PortfolioTransaction[];
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

export type SanitizedRiskTolerance = RiskTolerance | "withheld";

export interface SanitizedActivityPattern {
  timezone: string;
  activePeriods: ActivityPeriod[];
  tradingFrequency: TradingFrequency;
  riskTolerance: SanitizedRiskTolerance;
}

export interface SanitizedPortfolioSnapshot {
  tokens: SanitizedTokenHolding[];
  defiProtocols: DeFiProtocol[];
  nftCollections: NFTCollection[];
  activity: SanitizedActivityPattern | null;
  highlights: string[];
  transactions: SanitizedTransactionHistory | null;
}

export type TransactionPrivacyLevel = "HIDDEN" | "ANONYMIZED" | "SUMMARY";

export type TransactionVolumeBucket = "minimal" | "moderate" | "active" | "high";

export type TransactionFlowDelta = "positive" | "neutral" | "negative";

export interface SanitizedTransactionBucket {
  period: "24h" | "7d" | "30d" | "90d" | "lifetime";
  inboundCount: number;
  outboundCount: number;
  selfCount: number;
  volumeBucket: TransactionVolumeBucket;
  netFlow: TransactionFlowDelta;
}

export interface SanitizedTransactionHistory {
  visibility: TransactionPrivacyLevel;
  buckets: SanitizedTransactionBucket[];
  notableCounterparties: string[];
  anonymization: {
    method: "hash_truncation" | "bucketing" | "masking";
    lastUpdated: number;
    windowDays: number;
  };
}
