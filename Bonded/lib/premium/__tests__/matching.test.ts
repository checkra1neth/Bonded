import { describe, expect, it } from "vitest";

import type { MatchCandidate } from "../../matching/compatibility";
import { prioritizeCandidates } from "../matching";
import { resolvePlan } from "../plans";

const PLAN = resolvePlan("premium_founder");

function mockCandidate(overall: number, id: string, options: Partial<MatchCandidate> = {}): MatchCandidate {
  const baseCandidate: MatchCandidate = {
    user: {
      id,
      displayName: id,
      personality: options.personality?.type ?? "Onchain Strategist",
    },
    compatibilityScore: {
      overall,
      tokenSimilarity: overall,
      defiCompatibility: overall,
      nftAlignment: overall,
      activitySync: overall,
      category: {
        id: "defi_compatible",
        label: "",
        description: "",
        minScore: 0,
        highlight: "",
      },
      reasoning: ["Reason"],
      factors: [],
    },
    sharedInterests: [],
    icebreakers: [],
    personality: options.personality ?? { type: "Onchain Strategist", summary: "", highlights: [] },
    interaction: options.interaction,
  };
  return baseCandidate;
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
