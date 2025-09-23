import type { CompatibilityProfile, MatchCandidate } from "@/lib/matching/compatibility";
import type { MutualMatch } from "@/lib/matching/queue";
import type { PortfolioSnapshot } from "@/lib/portfolio/types";
import type { PersonalityAssessment } from "@/lib/personality/types";

import { IcebreakerGenerator } from "./generator";
import type { GeneratedIcebreaker, IcebreakerContext, MarketInsight } from "./types";
import {
  assignIcebreakerVariant,
  getVariantConfig,
  type IcebreakerExperimentVariant,
  type IcebreakerVariantConfig,
} from "./experiments";
import { buildMarketInsights } from "./market";

export interface IcebreakerDeliveryParams {
  seekerProfile: CompatibilityProfile;
  seekerPersonality: PersonalityAssessment;
  candidate: MatchCandidate;
  match: Pick<MutualMatch, "id" | "createdAt">;
  generator?: IcebreakerGenerator;
  candidatePortfolio?: PortfolioSnapshot;
  marketInsights?: MarketInsight[];
  variant?: IcebreakerExperimentVariant;
  timestamp?: number;
}

export interface IcebreakerSuggestionResult {
  matchId: string;
  candidateId: string;
  candidateName: string;
  variant: IcebreakerExperimentVariant;
  variantConfig: IcebreakerVariantConfig;
  generatedAt: number;
  items: GeneratedIcebreaker[];
  marketInsights: MarketInsight[];
}

export async function deliverIcebreakerSuggestions({
  seekerProfile,
  seekerPersonality,
  candidate,
  match,
  generator = new IcebreakerGenerator(),
  candidatePortfolio,
  marketInsights,
  variant,
  timestamp,
}: IcebreakerDeliveryParams): Promise<IcebreakerSuggestionResult> {
  const resolvedVariant = variant ?? assignIcebreakerVariant(`${match.id}:${candidate.user.id}`);
  const variantConfig = getVariantConfig(resolvedVariant);

  const insights = marketInsights ??
    buildMarketInsights({
      sharedInterests: candidate.sharedInterests,
      seekerPortfolio: seekerProfile.portfolio,
      candidatePortfolio,
      maxInsights: variantConfig.maxMarketInsights,
    });

  const context: IcebreakerContext = {
    seeker: {
      displayName: seekerProfile.user.displayName,
      personality: seekerPersonality,
      highlights: seekerProfile.portfolio.highlights,
    },
    candidate: {
      displayName: candidate.user.displayName,
      personality: candidate.personality,
      highlights: candidatePortfolio?.highlights,
    },
    sharedInterests: candidate.sharedInterests,
    compatibility: candidate.compatibilityScore,
    marketInsights: insights,
    humorPreference: variantConfig.humorPreference,
    maxIcebreakers: variantConfig.maxResults,
  };

  const generated = await generator.generate(context, {
    maxResults: variantConfig.maxResults,
    temperature: variantConfig.temperature,
  });

  return {
    matchId: match.id,
    candidateId: candidate.user.id,
    candidateName: candidate.user.displayName,
    variant: resolvedVariant,
    variantConfig,
    generatedAt: timestamp ?? match.createdAt ?? Date.now(),
    items: generated,
    marketInsights: insights,
  };
}
