import type { CompatibilityScore, SharedInterest } from "@/lib/matching/compatibility";
import type { PersonalityAssessment } from "@/lib/personality/types";

export type IcebreakerCategory = "portfolio" | "defi" | "nft" | "market" | "personality";

export type HumorLevel = "light" | "moderate" | "spicy";

export interface IcebreakerProfileContext {
  id?: string;
  displayName: string;
  personality?: PersonalityAssessment | null;
  highlights?: string[];
}

export interface MarketInsight {
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "volatile" | "neutral";
  assets?: string[];
  timeframe?: string;
}

export interface IcebreakerContext {
  seeker: IcebreakerProfileContext;
  candidate: IcebreakerProfileContext;
  sharedInterests: SharedInterest[];
  compatibility?: CompatibilityScore;
  marketInsights?: MarketInsight[];
  humorPreference?: HumorLevel;
  maxIcebreakers?: number;
}

export interface GeneratedIcebreaker {
  message: string;
  category: IcebreakerCategory;
  humorLevel: HumorLevel;
  confidence: number;
  references?: string[];
}

export interface IcebreakerGeneratorConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  organization?: string;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface GenerateIcebreakerOptions {
  maxResults?: number;
  temperature?: number;
}
