import { describe, expect, it } from "vitest";

import type { MatchCandidate } from "../../matching/compatibility";
import {
  buildPremiumFilterFacets,
  buildPremiumProfileHighlight,
  buildSuperLikeSpotlightEntry,
  filterCandidates,
  generateExclusiveContent,
  resolvePlan,
  summarizeFilters,
  type PremiumFilterOptions,
} from "../index";

const createCandidate = (overrides: Partial<MatchCandidate>): MatchCandidate => {
  return {
    user: {
      id: overrides.user?.id ?? "candidate",
      displayName: overrides.user?.displayName ?? "Candidate",
      personality: overrides.user?.personality ?? "Onchain Strategist",
      headline: overrides.user?.headline,
      bio: overrides.user?.bio,
    },
    compatibilityScore: {
      overall: overrides.compatibilityScore?.overall ?? 0.82,
      tokenSimilarity: overrides.compatibilityScore?.tokenSimilarity ?? 0.8,
      defiCompatibility: overrides.compatibilityScore?.defiCompatibility ?? 0.78,
      nftAlignment: overrides.compatibilityScore?.nftAlignment ?? 0.6,
      activitySync: overrides.compatibilityScore?.activitySync ?? 0.65,
      category:
        overrides.compatibilityScore?.category ??
        ({
          id: "defi_compatible",
          label: "DeFi Compatible",
          description: "",
          minScore: 0.8,
          highlight: "",
        } as MatchCandidate["compatibilityScore"]["category"]),
      reasoning: overrides.compatibilityScore?.reasoning ?? [
        "Shared token conviction across AERO and DEGEN.",
        "Active during overlapping hours",
      ],
      factors: overrides.compatibilityScore?.factors ?? [],
    },
    sharedInterests:
      overrides.sharedInterests ??
      ([
        { type: "token", name: "DEGEN", detail: "DEGEN liquidity pools" },
        { type: "defi", name: "Aave", detail: "Aave looping" },
        { type: "activity", name: "Active Hours", detail: "18:00, 19:00, 20:00" },
      ] as MatchCandidate["sharedInterests"]),
    icebreakers: overrides.icebreakers ?? ["What's your DEGEN thesis?"],
    personality: overrides.personality ?? {
      type: overrides.user?.personality ?? "Onchain Strategist",
      summary: "",
      highlights: [],
    },
    interaction: overrides.interaction,
  } as MatchCandidate;
};

describe("premium experience integrations", () => {
  it("applies advanced filters and summarizes selections", () => {
    const candidates = [
      createCandidate({ user: { id: "a", displayName: "Token Alchemist" } }),
      createCandidate({
        user: { id: "b", displayName: "Stable Strategist" },
        sharedInterests: [
          { type: "token", name: "USDC" },
          { type: "defi", name: "Compound" },
        ],
        compatibilityScore: {
          overall: 0.62,
          tokenSimilarity: 0.55,
          defiCompatibility: 0.58,
          nftAlignment: 0.3,
          activitySync: 0.4,
          category: {
            id: "potential_match",
            label: "Potential Match",
            description: "",
            minScore: 0.6,
            highlight: "",
          },
          reasoning: ["Divergent token theses"],
          factors: [],
        },
      }),
    ];

    const options: PremiumFilterOptions = {
      tokenSymbols: ["DEGEN"],
      defiProtocols: ["aave"],
      minScore: 0.7,
      warmSignalsOnly: false,
    };

    const filtered = filterCandidates(candidates, options);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.user.displayName).toBe("Token Alchemist");

    const summary = summarizeFilters(options);
    expect(summary.description).toContain("Tokens: DEGEN");
    expect(summary.description).toContain("DeFi: aave");

    const facets = buildPremiumFilterFacets(candidates);
    expect(facets.tokenSymbols).toContain("DEGEN");
    expect(facets.defiProtocols).toContain("aave");
  });

  it("builds super like spotlight entries and premium highlights", () => {
    const candidate = createCandidate({
      user: {
        id: "spotlight",
        displayName: "Liquidity Lore",
        personality: "DeFi Explorer",
        headline: "Treasury whisperer",
      },
      compatibilityScore: {
        overall: 0.94,
        tokenSimilarity: 0.92,
        defiCompatibility: 0.93,
        nftAlignment: 0.7,
        activitySync: 0.8,
        category: {
          id: "crypto_soulmates",
          label: "Crypto Soulmates",
          description: "",
          minScore: 0.95,
          highlight: "",
        },
        reasoning: ["Synchronized DAO participation"],
        factors: [],
      },
    });

    const entry = buildSuperLikeSpotlightEntry(candidate, 1_730_000_000_000);
    expect(entry.displayName).toBe("Liquidity Lore");
    expect(entry.compatibilityPercent).toBe(94);
    expect(entry.sharedSignal).toMatch(/DAO/);

    const founderPlan = resolvePlan("premium_founder");
    const highlight = buildPremiumProfileHighlight(founderPlan);
    expect(highlight.badge).toContain("$39");
    expect(highlight.description).toMatch(/boosted/);

    const content = generateExclusiveContent(resolvePlan("premium_partner"));
    expect(content.some((item) => item.id === "concierge-intros")).toBe(true);
    expect(content.some((item) => item.availability === "coming_soon")).toBe(true);
  });
});
