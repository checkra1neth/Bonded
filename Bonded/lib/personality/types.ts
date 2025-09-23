export type CryptoPersonalityType =
  | "Banker"
  | "DeFi Degen"
  | "NFT Collector"
  | "GameFi Player"
  | "Diamond Hands"
  | "Day Trader";

export interface PersonalityScoreDetail {
  type: CryptoPersonalityType;
  score: number;
  description: string;
}

export interface PersonalityAssessment {
  type: CryptoPersonalityType;
  confidence: number;
  summary: string;
  headline: string;
  scores: PersonalityScoreDetail[];
  strengths: string[];
  growthAreas: string[];
}

export const PERSONALITY_TAGLINES: Record<CryptoPersonalityType, string> = {
  Banker: "Risk-managed yield architect",
  "DeFi Degen": "High-conviction protocol pioneer",
  "NFT Collector": "Culture-forward digital curator",
  "GameFi Player": "Metaverse-native strategist",
  "Diamond Hands": "Long-horizon conviction holder",
  "Day Trader": "Latency-chasing market tactician",
};
