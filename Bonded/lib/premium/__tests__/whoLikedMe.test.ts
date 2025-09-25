import { describe, expect, it } from "vitest";

import type { MatchCandidate } from "../../matching/compatibility";
import type { MatchQueueEntry } from "../../matching/queue";
import { resolvePlan } from "../plans";
import { generateWhoLikedMe } from "../whoLikedMe";

const buildPersonality = (
  type: MatchCandidate["personality"]["type"],
): MatchCandidate["personality"] => ({
  type,
  confidence: 0.82,
  summary: "",
  headline: "",
  scores: [],
  strengths: [],
  growthAreas: [],
});

function buildCandidate(id: string, options: Partial<MatchCandidate> = {}): MatchCandidate {
  const personalityType = options.personality?.type ?? options.user?.personality ?? "Banker";
  const defaultCategory: MatchCandidate["compatibilityScore"]["category"] = {
    id: "defi_compatible",
    label: "",
    description: "",
    minScore: 0,
    highlight: "",
  };
  const category = options.compatibilityScore?.category ?? defaultCategory;

  return {
    user: {
      id,
      displayName: options.user?.displayName ?? id,
      personality: personalityType,
      basename: options.user?.basename,
    },
    compatibilityScore: {
      overall: options.compatibilityScore?.overall ?? 0.82,
      tokenSimilarity: options.compatibilityScore?.tokenSimilarity ?? 0.8,
      defiCompatibility: options.compatibilityScore?.defiCompatibility ?? 0.84,
      nftAlignment: options.compatibilityScore?.nftAlignment ?? 0.7,
      activitySync: options.compatibilityScore?.activitySync ?? 0.76,
      category,
      reasoning: options.compatibilityScore?.reasoning ?? ["Mirrors your staking cadence"],
      factors: options.compatibilityScore?.factors ?? [],
    },
    sharedInterests: options.sharedInterests ?? [],
    icebreakers: options.icebreakers ?? [],
    personality: options.personality ?? buildPersonality(personalityType),
    interaction: options.interaction,
  };
}

describe("generateWhoLikedMe", () => {
  it("surfaces pending likes when feature enabled", () => {
    const entries: MatchQueueEntry[] = [
      { candidate: buildCandidate("atlas", { interaction: { initialDecision: "like" } }), status: "pending" },
      { candidate: buildCandidate("nova", { interaction: { autoResponse: { onLike: "like" } } }), status: "pending" },
      { candidate: buildCandidate("cold"), status: "decided" },
    ];

    const insights = generateWhoLikedMe({ entries }, resolvePlan("premium_founder"));
    expect(insights).toHaveLength(2);
    expect(insights[0]?.candidateId).toBe("atlas");
    expect(insights[1]?.candidateId).toBe("nova");
  });

  it("returns empty array when plan lacks feature", () => {
    const entries: MatchQueueEntry[] = [
      { candidate: buildCandidate("atlas", { interaction: { initialDecision: "like" } }), status: "pending" },
    ];

    const insights = generateWhoLikedMe({ entries }, resolvePlan("free"));
    expect(insights).toHaveLength(0);
  });
});
