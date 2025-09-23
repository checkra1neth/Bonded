import { beforeEach, describe, expect, it, vi } from "vitest";

import { IcebreakerGenerator } from "./generator";
import type { IcebreakerContext } from "./types";

const baseContext: IcebreakerContext = {
  seeker: {
    displayName: "Ava Protocol",
    personality: {
      type: "DeFi Degen",
      confidence: 0.82,
      summary: "Aggressive yield strategist with on-chain hustle.",
      headline: "DeFi Degen",
      scores: [
        { type: "DeFi Degen", score: 0.9, description: "Moves fast across liquidity pools." },
        { type: "Diamond Hands", score: 0.6, description: "Holds conviction plays long term." },
      ],
      strengths: ["Finds yield early", "Understands token incentives"],
      growthAreas: ["Occasional degen detox"],
    },
    highlights: ["Runs a weekly governance call"],
  },
  candidate: {
    displayName: "Nova Yield",
    personality: {
      type: "Banker",
      confidence: 0.76,
      summary: "Risk-aware yield optimizer with treasury instincts.",
      headline: "Risk-managed yield architect",
      scores: [
        { type: "Banker", score: 0.88, description: "Balances risk and reward like a pro." },
        { type: "DeFi Degen", score: 0.55, description: "Still loves a spicy vault." },
      ],
      strengths: ["Treasury diversification", "Stablecoin tactics"],
      growthAreas: ["Occasional high-beta play"],
    },
    highlights: ["Architected a cross-chain vault"],
  },
  sharedInterests: [
    {
      type: "token",
      name: "DEGEN",
      detail: "DEGEN 20% (high conviction)",
      insight: "Both allocate ~20% to DEGEN.",
    },
    {
      type: "defi",
      name: "Aerodrome",
      detail: "Aerodrome (dex)",
      insight: "Shared strategy in Aerodrome dex pools.",
    },
    {
      type: "nft",
      name: "BasePaint",
      detail: "BasePaint (art)",
      insight: "Matching taste in BasePaint art NFTs.",
    },
    {
      type: "activity",
      name: "Active Hours",
      detail: "21:00, 22:00",
      insight: "You'll both be online when the market moves.",
    },
  ],
  compatibility: {
    overall: 0.84,
    tokenSimilarity: 0.8,
    defiCompatibility: 0.78,
    nftAlignment: 0.52,
    activitySync: 0.64,
    category: {
      id: "defi_compatible",
      label: "DeFi Compatible",
      description: "Strong overlap in DeFi strategies.",
      minScore: 0.8,
      highlight: "Plenty of alpha to share.",
    },
    reasoning: [
      "Mutual DeFi strategies in Aerodrome (dex).",
      "Aligned token thesis around DEGEN 20% (high conviction).",
      "Shared NFT culture through BasePaint.",
    ],
    factors: [
      { id: "token", label: "Token Alignment", weight: 0.6, score: 0.8, summary: "DEGEN 20%" },
      { id: "defi", label: "DeFi Strategy", weight: 0.25, score: 0.78, summary: "Aerodrome" },
      { id: "nft", label: "NFT Culture", weight: 0.1, score: 0.52, summary: "BasePaint" },
      { id: "activity", label: "Activity Sync", weight: 0.05, score: 0.64, summary: "Evening sessions" },
    ],
  },
  marketInsights: [
    {
      title: "AERO incentives ramping",
      summary: "Aerodrome just boosted LP rewards",
      sentiment: "bullish",
      assets: ["AERO"],
      timeframe: "24h",
    },
  ],
  humorPreference: "moderate",
  maxIcebreakers: 4,
};

function cloneContext(): IcebreakerContext {
  return JSON.parse(JSON.stringify(baseContext)) as IcebreakerContext;
}

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
});

describe("IcebreakerGenerator", () => {
  it("returns heuristic icebreakers when OpenAI is not configured", async () => {
    const generator = new IcebreakerGenerator();
    const context = cloneContext();
    context.humorPreference = "light";

    const result = await generator.generate(context, { maxResults: 4 });

    expect(result).toHaveLength(4);
    expect(result.every((entry) => entry.message.length > 0)).toBe(true);
    expect(result.some((entry) => entry.category === "portfolio")).toBe(true);
    expect(result.some((entry) => entry.category === "defi")).toBe(true);
    expect(result.some((entry) => entry.message.includes("DEGEN"))).toBe(true);
    expect(result.every((entry) => entry.humorLevel === "light")).toBe(true);
  });

  it("parses OpenAI responses and respects humor preference", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        messages?: Array<{ content?: string }>;
      };
      expect(body.messages?.[1]?.content).toContain("Shared token interests");

      const payload = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                icebreakers: [
                  {
                    message: "We should compare Aerodrome LP positions sometime soon.",
                    category: "defi",
                    humor_level: "spicy",
                    confidence: 0.91,
                    references: ["Aerodrome"],
                  },
                ],
              }),
            },
          },
        ],
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const generator = new IcebreakerGenerator({ apiKey: "test", fetchImpl: fetchMock });
    const context = cloneContext();
    context.humorPreference = "light";

    const result = await generator.generate(context, { maxResults: 1, temperature: 0.6 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("defi");
    expect(result[0].humorLevel).toBe("light");
    expect(result[0].confidence).toBeCloseTo(0.91);
    expect(result[0].references).toEqual(["Aerodrome"]);
  });

  it("falls back to heuristics when OpenAI returns invalid JSON", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi.fn<typeof fetch>(async () => {
      const payload = {
        choices: [
          {
            message: {
              content: "not-json",
            },
          },
        ],
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const generator = new IcebreakerGenerator({ apiKey: "test", fetchImpl: fetchMock, maxRetries: 1 });
    const context = cloneContext();

    const result = await generator.generate(context, { maxResults: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(3);
    expect(result.some((entry) => entry.category === "portfolio")).toBe(true);
    warnSpy.mockRestore();
  });
});
