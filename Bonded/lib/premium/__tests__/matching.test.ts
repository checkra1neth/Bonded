import { describe, expect, it } from "vitest";

import type { MatchCandidate } from "../../matching/compatibility";
import { prioritizeCandidates } from "../matching";
import { resolvePlan } from "../plans";

const PLAN = resolvePlan("premium_founder");

const buildPersonality = (
  type: MatchCandidate["personality"]["type"],
): MatchCandidate["personality"] => ({
  type,
  confidence: 0.8,
  summary: "",
  headline: "",
  scores: [],
  strengths: [],
  growthAreas: [],
});

function mockCandidate(overall: number, id: string, options: Partial<MatchCandidate> = {}): MatchCandidate {
  const personalityType = options.personality?.type ?? options.user?.personality ?? "Banker";
  return {
    user: {
      id,
      displayName: options.user?.displayName ?? id,
      personality: personalityType,
    },
    compatibilityScore: {
      overall,
      tokenSimilarity: overall,
      defiCompatibility: overall,
      nftAlignment: overall,
      activitySync: overall,
      category: {
        id: options.compatibilityScore?.category?.id ?? "defi_compatible",
        label: options.compatibilityScore?.category?.label ?? "",
        description: options.compatibilityScore?.category?.description ?? "",
        minScore: options.compatibilityScore?.category?.minScore ?? 0,
        highlight: options.compatibilityScore?.category?.highlight ?? "",
      },
      reasoning: options.compatibilityScore?.reasoning ?? ["Reason"],
      factors: options.compatibilityScore?.factors ?? [],
    },
    sharedInterests: options.sharedInterests ?? [],
    icebreakers: options.icebreakers ?? [],
    personality: options.personality ?? buildPersonality(personalityType),
    interaction: options.interaction,
  };
}

describe("prioritizeCandidates", () => {
  it("sorts candidates by premium multiplier and warm signals", () => {
    const cold = mockCandidate(0.74, "cold");
    const warm = mockCandidate(0.7, "warm", {
      interaction: { initialDecision: "like" },
    });
    const soulmate = mockCandidate(0.92, "soulmate", {
      compatibilityScore: {
        ...mockCandidate(0.92, "temp").compatibilityScore,
        overall: 0.92,
        category: {
          id: "crypto_soulmates",
          label: "",
          description: "",
          minScore: 0,
          highlight: "",
        },
      },
    });

    const ordered = prioritizeCandidates([cold, warm, soulmate], PLAN);

    expect(ordered[0]?.user.id).toBe("soulmate");
    expect(ordered[1]?.user.id).toBe("warm");
    expect(ordered[2]?.user.id).toBe("cold");
  });

  it("returns original order when plan lacks priority feature", () => {
    const freePlan = resolvePlan("free");
    const candidates = [mockCandidate(0.8, "a"), mockCandidate(0.7, "b")];
    const ordered = prioritizeCandidates(candidates, freePlan);
    expect(ordered).toEqual(candidates);
  });
});
