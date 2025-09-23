"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CompatibilityProfile, MatchCandidate } from "@/lib/matching/compatibility";
import type { MutualMatch } from "@/lib/matching/queue";
import type { PortfolioSnapshot } from "@/lib/portfolio/types";
import type { PersonalityAssessment } from "@/lib/personality/types";
import { IcebreakerGenerator } from "@/lib/icebreakers";
import { deliverIcebreakerSuggestions, type IcebreakerSuggestionResult } from "@/lib/icebreakers/delivery";
import {
  assignIcebreakerVariant,
  getVariantConfig,
  type IcebreakerExperimentVariant,
  type IcebreakerVariantConfig,
} from "@/lib/icebreakers/experiments";

interface CandidateContext {
  candidate: MatchCandidate;
  portfolio?: PortfolioSnapshot;
}

export interface IcebreakerSuggestionView extends IcebreakerSuggestionResult {
  status: "loading" | "ready" | "error";
  error?: string;
}

export interface UseIcebreakerSuggestionsOptions {
  matches: MutualMatch[];
  seekerProfile: CompatibilityProfile;
  seekerPersonality: PersonalityAssessment;
  candidatesById: Map<string, CandidateContext>;
}

export interface UseIcebreakerSuggestionsResult {
  suggestions: IcebreakerSuggestionView[];
  isDelivering: boolean;
}

const now = () => Date.now();

export function useIcebreakerSuggestions({
  matches,
  seekerProfile,
  seekerPersonality,
  candidatesById,
}: UseIcebreakerSuggestionsOptions): UseIcebreakerSuggestionsResult {
  const generatorRef = useRef<IcebreakerGenerator>();
  if (!generatorRef.current) {
    generatorRef.current = new IcebreakerGenerator();
  }

  const [records, setRecords] = useState<Record<string, IcebreakerSuggestionView>>({});

  useEffect(() => {
    setRecords((current) => {
      const activeMatchIds = new Set(matches.map((match) => match.id));
      const next: Record<string, IcebreakerSuggestionView> = {};
      let changed = false;

      Object.entries(current).forEach(([matchId, record]) => {
        if (activeMatchIds.has(matchId)) {
          next[matchId] = record;
        } else {
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [matches]);

  useEffect(() => {
    if (!matches.length) {
      return;
    }

    const pending = matches.filter((match) => !records[match.id]);
    if (!pending.length) {
      return;
    }

    const generator = generatorRef.current;
    if (!generator) {
      return;
    }

    type DeliveryPlan = {
      match: MutualMatch;
      context: CandidateContext;
      variant: IcebreakerExperimentVariant;
      config: IcebreakerVariantConfig;
    };

    const plans: DeliveryPlan[] = [];

    pending.forEach((match) => {
      const context = candidatesById.get(match.candidateId);
      const seed = `${match.id}:${match.candidateId}`;
      const variant = assignIcebreakerVariant(seed);
      const config = getVariantConfig(variant);

      if (!context) {
        setRecords((current) => ({
          ...current,
          [match.id]: {
            matchId: match.id,
            candidateId: match.candidateId,
            candidateName: match.displayName,
            variant,
            variantConfig: config,
            generatedAt: now(),
            items: [],
            marketInsights: [],
            status: "error",
            error: "Candidate context unavailable",
          },
        }));
        return;
      }

      plans.push({ match, context, variant, config });

      setRecords((current) => ({
        ...current,
        [match.id]: {
          matchId: match.id,
          candidateId: context.candidate.user.id,
          candidateName: context.candidate.user.displayName,
          variant,
          variantConfig: config,
          generatedAt: now(),
          items: [],
          marketInsights: [],
          status: "loading",
        },
      }));
    });

    if (!plans.length) {
      return;
    }

    let cancelled = false;

    const deliver = async () => {
      for (const plan of plans) {
        try {
          const result = await deliverIcebreakerSuggestions({
            seekerProfile,
            seekerPersonality,
            candidate: plan.context.candidate,
            candidatePortfolio: plan.context.portfolio,
            match: plan.match,
            generator,
            variant: plan.variant,
          });

          if (cancelled) {
            return;
          }

          setRecords((current) => ({
            ...current,
            [plan.match.id]: {
              ...result,
              status: "ready",
            },
          }));
        } catch (error) {
          if (cancelled) {
            return;
          }

          const message = error instanceof Error ? error.message : String(error);

          setRecords((current) => ({
            ...current,
            [plan.match.id]: {
              matchId: plan.match.id,
              candidateId: plan.context.candidate.user.id,
              candidateName: plan.context.candidate.user.displayName,
              variant: plan.variant,
              variantConfig: plan.config,
              generatedAt: now(),
              items: [],
              marketInsights: [],
              status: "error",
              error: message,
            },
          }));
        }
      }
    };

    void deliver();

    return () => {
      cancelled = true;
    };
  }, [matches, records, candidatesById, seekerProfile, seekerPersonality]);

  const orderedSuggestions = useMemo(() => {
    return matches
      .map((match) => records[match.id])
      .filter((record): record is IcebreakerSuggestionView => Boolean(record));
  }, [matches, records]);

  const isDelivering = orderedSuggestions.some((record) => record.status === "loading");

  return { suggestions: orderedSuggestions, isDelivering };
}
