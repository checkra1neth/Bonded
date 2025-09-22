import { describe, expect, it, vi } from "vitest";

import { PortfolioAnalyzer } from "../analyzer";

const TEST_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function hex(value: bigint | number): string {
  return `0x${BigInt(value).toString(16)}`;
}

function createJsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

describe("PortfolioAnalyzer", () => {
  it("builds a privacy-preserving snapshot using Alchemy responses", async () => {
    const responses = [
      createJsonResponse({
        result: {
          address: TEST_ADDRESS,
          tokenBalances: [
            {
              contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
              tokenBalance: hex(4e18),
              metadata: { symbol: "ETH", decimals: 18 },
            },
            {
              contractAddress: "0xdddddddddddddddddddddddddddddddddddddddd",
              tokenBalance: hex(3e18),
              metadata: { symbol: "DEGEN", decimals: 18 },
            },
            {
              contractAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
              tokenBalance: hex(2e18),
              metadata: { symbol: "AERO", decimals: 18 },
            },
            {
              contractAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              tokenBalance: hex(1_000_000),
              metadata: { symbol: "USDC", decimals: 6 },
            },
          ],
        },
      }),
      createJsonResponse({
        result: {
          transfers: [
            {
              from: TEST_ADDRESS,
              to: "0x5c7ba1dc8736e3617476e0cdbb480d0d0f2e0c79",
              category: "erc20",
              metadata: { blockTimestamp: "2024-03-01T23:00:00Z" },
            },
            {
              from: TEST_ADDRESS,
              to: "0x0000000000000000000000000000000000000001",
              category: "erc20",
              metadata: { blockTimestamp: "2024-03-01T22:00:00Z" },
            },
            {
              from: TEST_ADDRESS,
              to: "0x0000000000000000000000000000000000000002",
              category: "erc20",
              metadata: { blockTimestamp: "2024-03-01T23:45:00Z" },
            },
          ],
        },
      }),
      createJsonResponse({
        result: {
          transfers: [
            {
              from: "0x76d3030728e52deb8848b87d61d8d2c534ed91ea",
              to: TEST_ADDRESS,
              rawContract: { address: "0x76d3030728e52deb8848b87d61d8d2c534ed91ea" },
              metadata: { blockTimestamp: "2024-03-02T23:15:00Z" },
            },
            {
              from: "0x0000000000000000000000000000000000000003",
              to: TEST_ADDRESS,
              metadata: { blockTimestamp: "2024-03-02T23:00:00Z" },
            },
            {
              from: "0x0000000000000000000000000000000000000004",
              to: TEST_ADDRESS,
              metadata: { blockTimestamp: "2024-03-02T21:00:00Z" },
            },
          ],
        },
      }),
    ];

    const fetchMock = vi.fn(async () => {
      const response = responses.shift();
      if (!response) {
        throw new Error("No more mock responses available");
      }
      return response;
    });

    const analyzer = new PortfolioAnalyzer({ apiKey: "test", fetch: fetchMock });

    const snapshot = await analyzer.analyzePortfolio(TEST_ADDRESS);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(snapshot.tokens).toHaveLength(4);

    const totalAllocation = snapshot.tokens.reduce((sum, token) => sum + token.allocation, 0);
    expect(totalAllocation).toBeGreaterThan(0.99);
    expect(totalAllocation).toBeLessThanOrEqual(1.01);

    for (const token of snapshot.tokens) {
      expect(token).not.toHaveProperty("value");
      expect(token.allocation).toBeGreaterThan(0);
      expect(token.allocation).toBeLessThanOrEqual(1);
    }

    expect(snapshot.defiProtocols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Aerodrome", category: "dex" }),
        expect.objectContaining({ name: "Aave", category: "lending" }),
      ]),
    );

    expect(snapshot.activity.tradingFrequency).toBe("daily");
    expect(snapshot.activity.riskTolerance).toBe("degenerate");
    expect(snapshot.activity.activeHours).toEqual([18, 19, 20]);
    expect(snapshot.activity.timezoneOffset).toBe(-3);

    expect(snapshot.highlights.length).toBeGreaterThan(0);
    expect(snapshot.highlights[0]).toContain("Token focus");
  });
});
