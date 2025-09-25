import type {
  ActivityPattern,
  DeFiProtocol,
  PortfolioSnapshot,
  PortfolioTransaction,
  RiskTolerance,
  TokenHolding,
  TransactionDirection,
  TradingFrequency,
} from "./types";
import { getServerEnv } from "../config/env";

interface PortfolioAnalyzerOptions {
  apiKey?: string;
  network?: string;
  fetch?: typeof fetch;
  maxTransfers?: number;
  fallbackTimezoneOffset?: number;
}

interface AlchemyErrorPayload {
  code?: number;
  message?: string;
}

interface AlchemyResponse<T> {
  result?: T;
  error?: AlchemyErrorPayload | null;
}

interface AlchemyTokenBalanceMetadata {
  name?: string | null;
  symbol?: string | null;
  decimals?: number | string | null;
}

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string | null;
  metadata?: AlchemyTokenBalanceMetadata;
}

interface AlchemyTokenBalancesResult {
  address: string;
  tokenBalances: AlchemyTokenBalance[];
  pageKey?: string;
}

interface AlchemyAssetTransferMetadata {
  blockTimestamp?: string;
}

interface AlchemyAssetTransferRawContract {
  address?: string | null;
  decimal?: number | string | null;
  value?: string | null;
}

interface AlchemyAssetTransfer {
  hash?: string;
  category?: string;
  asset?: string | null;
  from?: string | null;
  to?: string | null;
  value?: string | number | null;
  metadata?: AlchemyAssetTransferMetadata;
  rawContract?: AlchemyAssetTransferRawContract | null;
}

interface AlchemyAssetTransfersResult {
  transfers: AlchemyAssetTransfer[];
  pageKey?: string;
}

interface ProtocolDefinition {
  name: string;
  category: DeFiProtocol["category"];
  risk: RiskTolerance;
  strategy?: string;
  addresses?: string[];
  tokenSymbols?: string[];
}

const DEFAULT_NETWORK = "base-mainnet";
const DEFAULT_MAX_TRANSFERS = 250;
const TOKEN_SYMBOL_PROTOCOL_HINTS: ProtocolDefinition[] = [
  {
    name: "Aerodrome",
    category: "dex",
    risk: "adventurous",
    strategy: "Liquidity concentration pools",
    tokenSymbols: ["AERO", "AERODROME"],
    addresses: ["0x5c7ba1dc8736e3617476e0cdbb480d0d0f2e0c79", "0x2002d3812f58c69ed1048448cdbf8f246b292f94"],
  },
  {
    name: "Aave",
    category: "lending",
    risk: "balanced",
    strategy: "Collateralized lending",
    tokenSymbols: ["AAVE", "GHO", "USDC", "USDbC"],
    addresses: ["0x76d3030728e52deb8848b87d61d8d2c534ed91ea", "0x1a4c2b7d8b62d24963da2a6d2d0d7ec76d2a7ab6"],
  },
  {
    name: "BaseSwap",
    category: "dex",
    risk: "adventurous",
    strategy: "DEX market making",
    tokenSymbols: ["BSWAP", "BASESWAP"],
    addresses: ["0x0a7eebe8268d3a1d7f467aa83f8f5ded8dc8b16d"],
  },
  {
    name: "EigenLayer",
    category: "staking",
    risk: "balanced",
    strategy: "Restaking",
    tokenSymbols: ["CBETH", "RETH", "STETH"],
  },
  {
    name: "Balancer",
    category: "dex",
    risk: "balanced",
    strategy: "Weighted pool LP",
    tokenSymbols: ["BAL"],
    addresses: ["0xc66c4102736d0b9ac4fbaf9cce8a8f8d49b3a888"],
  },
];

const ADDRESS_PROTOCOL_MAP = new Map<string, ProtocolDefinition>();
for (const definition of TOKEN_SYMBOL_PROTOCOL_HINTS) {
  for (const address of definition.addresses ?? []) {
    ADDRESS_PROTOCOL_MAP.set(address.toLowerCase(), definition);
  }
}

const RISK_ORDER: Record<RiskTolerance, number> = {
  conservative: 0,
  balanced: 1,
  adventurous: 2,
  degenerate: 3,
};

const MAX_ACTIVE_HOURS = 8;

export class PortfolioAnalyzer {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxTransfers: number;
  private readonly fallbackTimezoneOffset: number;

  constructor(options: PortfolioAnalyzerOptions = {}) {
    const env = getServerEnv();
    const apiKey = options.apiKey ?? env.ALCHEMY_BASE_API_KEY ?? env.ALCHEMY_API_KEY;

    if (!apiKey) {
      throw new Error("Alchemy API key is required to analyze portfolios");
    }

    const network = options.network ?? DEFAULT_NETWORK;
    this.endpoint = `https://${network}.g.alchemy.com/v2/${apiKey}`;

    const providedFetch = options.fetch ?? globalThis.fetch;
    if (!providedFetch) {
      throw new Error("Fetch implementation is required for PortfolioAnalyzer");
    }

    this.fetchImpl = providedFetch.bind(globalThis);
    this.maxTransfers = options.maxTransfers ?? DEFAULT_MAX_TRANSFERS;
    this.fallbackTimezoneOffset = options.fallbackTimezoneOffset ?? 0;
  }

  async analyzePortfolio(address: string): Promise<PortfolioSnapshot> {
    if (!PortfolioAnalyzer.isValidAddress(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    const [tokenBalances, transfers] = await Promise.all([
      this.fetchTokenBalances(address),
      this.fetchAssetTransfers(address),
    ]);

    const tokens = this.buildTokenHoldings(tokenBalances);
    const defiProtocols = this.detectDefiProtocols(tokens, transfers);
    const activity = this.deriveActivityPattern(transfers, defiProtocols, tokens);
    const transactions = this.buildTransactionHistory(transfers, address);

    const highlights = this.buildHighlights(tokens, defiProtocols, activity);

    return {
      tokens,
      defiProtocols,
      nftCollections: [],
      activity,
      highlights,
      transactions,
    };
  }

  private async fetchTokenBalances(address: string): Promise<AlchemyTokenBalance[]> {
    const balances: AlchemyTokenBalance[] = [];
    let pageKey: string | undefined;

    do {
      const params = [
        address,
        { type: "erc20", pageKey, withMetadata: true },
      ];

      const result = await this.rpcCall<AlchemyTokenBalancesResult>(
        "alchemy_getTokenBalances",
        params,
      );

      if (Array.isArray(result.tokenBalances)) {
        balances.push(...result.tokenBalances);
      }

      pageKey = result.pageKey;
    } while (pageKey);

    return balances;
  }

  private async fetchAssetTransfers(address: string): Promise<AlchemyAssetTransfer[]> {
    const categories = [
      "external",
      "internal",
      "erc20",
      "erc721",
      "erc1155",
      "specialnft",
      "native",
    ];

    const transfers: AlchemyAssetTransfer[] = [];

    const fetchPage = async (
      direction: "from" | "to",
      initialPageKey?: string,
    ): Promise<void> => {
      let pageKey: string | undefined | null = initialPageKey ?? undefined;

      do {
        const filter: Record<string, unknown> = {
          category: categories,
          withMetadata: true,
          excludeZeroValue: false,
          order: "desc",
          maxCount: `0x${this.maxTransfers.toString(16)}`,
        };

        filter[direction === "from" ? "fromAddress" : "toAddress"] = address;
        if (pageKey) {
          filter.pageKey = pageKey;
        }

        const result = await this.rpcCall<AlchemyAssetTransfersResult>(
          "alchemy_getAssetTransfers",
          [filter],
        );

        transfers.push(...(result.transfers ?? []));
        pageKey = result.pageKey ?? null;
      } while (pageKey);
    };

    await Promise.all([fetchPage("from"), fetchPage("to")]);

    return transfers;
  }

  private buildTokenHoldings(balances: AlchemyTokenBalance[]): TokenHolding[] {
    const normalized = balances
      .map((balance) => this.normalizeTokenBalance(balance))
      .filter((token): token is { symbol: string; value: number; chain?: string } => token !== null)
      .filter((token) => token.value > 0);

    if (!normalized.length) {
      return [];
    }

    const totalValue = normalized.reduce((sum, token) => sum + token.value, 0);

    return normalized
      .map((token) => {
        const allocation = totalValue > 0 ? clamp01(token.value / totalValue) : 0;
        return {
          symbol: token.symbol,
          allocation,
          conviction: classifyConviction(allocation),
          chain: token.chain ?? "base",
        } satisfies TokenHolding;
      })
      .sort((a, b) => b.allocation - a.allocation);
  }

  private detectDefiProtocols(
    tokens: TokenHolding[],
    transfers: AlchemyAssetTransfer[],
  ): DeFiProtocol[] {
    const protocols = new Map<string, DeFiProtocol>();

    const addProtocol = (definition: ProtocolDefinition) => {
      if (protocols.has(definition.name)) {
        return;
      }

      protocols.set(definition.name, {
        name: definition.name,
        category: definition.category,
        strategy: definition.strategy,
        risk: definition.risk,
      });
    };

    for (const token of tokens) {
      const matches = TOKEN_SYMBOL_PROTOCOL_HINTS.filter((definition) =>
        definition.tokenSymbols?.some((symbol) => symbol.toLowerCase() === token.symbol.toLowerCase()),
      );

      for (const match of matches) {
        addProtocol(match);
      }
    }

    for (const transfer of transfers) {
      const addresses = [transfer.from, transfer.to, transfer.rawContract?.address].filter(
        (value): value is string => Boolean(value),
      );

      for (const address of addresses) {
        const definition = ADDRESS_PROTOCOL_MAP.get(address.toLowerCase());
        if (definition) {
          addProtocol(definition);
        }
      }
    }

    return Array.from(protocols.values()).slice(0, 8);
  }

  private deriveActivityPattern(
    transfers: AlchemyAssetTransfer[],
    protocols: DeFiProtocol[],
    tokens: TokenHolding[],
  ): ActivityPattern {
    const hours = new Map<number, number>();
    const days = new Set<string>();
    let totalTransfers = 0;

    for (const transfer of transfers) {
      const timestamp = transfer.metadata?.blockTimestamp;
      if (!timestamp) {
        continue;
      }

      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      totalTransfers += 1;
      days.add(date.toISOString().slice(0, 10));

      const hour = date.getUTCHours();
      hours.set(hour, (hours.get(hour) ?? 0) + 1);
    }

    const sortedHours = Array.from(hours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ACTIVE_HOURS)
      .map(([hour]) => hour);

    const timezoneOffset = this.estimateTimezoneOffset(sortedHours);
    const localHours = sortedHours
      .map((hour) => ((hour + timezoneOffset + 24) % 24))
      .sort((a, b) => a - b);

    const tradingFrequency = this.estimateTradingFrequency(totalTransfers, days.size);
    const riskTolerance = this.estimateRiskTolerance(protocols, tokens);

    return {
      timezoneOffset,
      activeHours: localHours,
      tradingFrequency,
      riskTolerance,
    } satisfies ActivityPattern;
  }

  private buildTransactionHistory(
    transfers: AlchemyAssetTransfer[],
    address: string,
  ): PortfolioTransaction[] {
    if (!transfers.length) {
      return [];
    }

    const normalizedAddress = address.toLowerCase();
    const transactions: PortfolioTransaction[] = [];
    const seen = new Set<string>();

    for (const transfer of transfers) {
      const timestampRaw = transfer.metadata?.blockTimestamp;
      if (!timestampRaw) {
        continue;
      }

      const timestamp = Date.parse(timestampRaw);
      if (!Number.isFinite(timestamp)) {
        continue;
      }

      const from = transfer.from?.toLowerCase() ?? null;
      const to = transfer.to?.toLowerCase() ?? null;

      let direction: TransactionDirection;
      let counterpartyAddress: string | null = null;

      if (from === normalizedAddress && to === normalizedAddress) {
        direction = "self";
        counterpartyAddress = normalizedAddress;
      } else if (from === normalizedAddress) {
        direction = "outbound";
        counterpartyAddress = to ?? transfer.rawContract?.address ?? null;
      } else if (to === normalizedAddress) {
        direction = "inbound";
        counterpartyAddress = from ?? transfer.rawContract?.address ?? null;
      } else {
        continue;
      }

      const counterparty = counterpartyAddress ?? transfer.to ?? transfer.from ?? "unknown";
      const fingerprint = transfer.hash ?? createDeterministicId(`${timestamp}:${direction}:${counterparty}`);
      if (seen.has(fingerprint)) {
        continue;
      }
      seen.add(fingerprint);

      const protocolDefinition = counterpartyAddress
        ? ADDRESS_PROTOCOL_MAP.get(counterpartyAddress.toLowerCase())
        : undefined;

      let counterpartyType: NonNullable<PortfolioTransaction["counterpartyType"]> = "unknown";
      if (direction === "self") {
        counterpartyType = "user";
      } else if (protocolDefinition) {
        counterpartyType = "protocol";
      } else if (transfer.category === "external") {
        counterpartyType = "bridge";
      } else if (transfer.category === "internal") {
        counterpartyType = "contract";
      } else if (counterpartyAddress?.startsWith("0x")) {
        counterpartyType = "user";
      }

      const asset = transfer.asset?.toUpperCase?.() ?? null;

      const transaction: PortfolioTransaction = {
        id: fingerprint,
        hash: transfer.hash ?? null,
        timestamp,
        direction,
        counterparty,
        counterpartyType,
        protocol: protocolDefinition?.name,
        asset,
        valueUsd: null,
        note: transfer.category ?? null,
      };

      transactions.push(transaction);
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);
  }

  private buildHighlights(
    tokens: TokenHolding[],
    defiProtocols: DeFiProtocol[],
    activity: ActivityPattern,
  ): string[] {
    const highlights: string[] = [];

    if (tokens.length) {
      const topTokens = tokens
        .slice(0, 3)
        .map((token) => `${token.symbol} ${Math.round(token.allocation * 100)}%`)
        .join(" • ");
      highlights.push(`Token focus: ${topTokens}`);
    }

    if (defiProtocols.length) {
      const categories = new Set(defiProtocols.map((protocol) => protocol.category));
      highlights.push(
        `Active in ${Array.from(categories)
          .map((category) => category.toUpperCase())
          .join(", ")}`,
      );
    }

    if (activity.activeHours.length) {
      const window = activity.activeHours
        .map((hour) => `${hour.toString().padStart(2, "0")}:00`)
        .slice(0, 3)
        .join(", ");
      highlights.push(`Peak activity: ${window}`);
    }

    return highlights.slice(0, 4);
  }

  private async rpcCall<T>(method: string, params: unknown): Promise<T> {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alchemy RPC ${method} failed with status ${response.status}`);
    }

    const payload = (await response.json()) as AlchemyResponse<T>;

    if (payload.error) {
      throw new Error(payload.error.message ?? `Alchemy RPC error for ${method}`);
    }

    if (!payload.result) {
      throw new Error(`Alchemy RPC response missing result for ${method}`);
    }

    return payload.result;
  }

  private normalizeTokenBalance(
    balance: AlchemyTokenBalance,
  ): { symbol: string; value: number; chain?: string } | null {
    if (balance.error) {
      return null;
    }

    const symbol = balance.metadata?.symbol ?? this.formatSymbolFromAddress(balance.contractAddress);
    const decimalsRaw = balance.metadata?.decimals;
    const decimals = typeof decimalsRaw === "string" ? Number(decimalsRaw) : decimalsRaw ?? 18;

    let value = 0;

    try {
      const raw = BigInt(balance.tokenBalance);
      const divisor = 10 ** Math.max(decimals, 0);
      value = Number(raw) / divisor;
    } catch {
      return null;
    }

    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    return {
      symbol,
      value,
      chain: "base",
    };
  }

  private estimateTimezoneOffset(activeHoursUtc: number[]): number {
    if (!activeHoursUtc.length) {
      return this.fallbackTimezoneOffset;
    }

    const peakHour = activeHoursUtc[0];
    const assumedLocalPeak = 20; // 8 PM local time
    const offset = assumedLocalPeak - peakHour;

    return clamp(offset, -12, 12);
  }

  private estimateTradingFrequency(totalTransfers: number, activeDays: number): TradingFrequency {
    if (!totalTransfers || !activeDays) {
      return "occasionally";
    }

    const averagePerDay = totalTransfers / activeDays;

    if (averagePerDay >= 3) {
      return "daily";
    }

    if (averagePerDay >= 1) {
      return "weekly";
    }

    if (averagePerDay >= 0.25) {
      return "monthly";
    }

    return "occasionally";
  }

  private estimateRiskTolerance(
    protocols: DeFiProtocol[],
    tokens: TokenHolding[],
  ): RiskTolerance {
    const highestProtocolRisk = protocols.reduce<RiskTolerance>((current, protocol) => {
      if (!protocol.risk) {
        return current;
      }

      return RISK_ORDER[protocol.risk] > RISK_ORDER[current] ? protocol.risk : current;
    }, "balanced");

    const tokenRisk = tokens.some((token) => token.symbol.toUpperCase().includes("DEGEN"))
      ? "degenerate"
      : "balanced";

    return RISK_ORDER[tokenRisk] > RISK_ORDER[highestProtocolRisk]
      ? tokenRisk
      : highestProtocolRisk;
  }

  private formatSymbolFromAddress(address: string): string {
    return address.slice(2, 6).toUpperCase();
  }

  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

function classifyConviction(allocation: number): TokenHolding["conviction"] {
  if (allocation >= 0.3) {
    return "high";
  }

  if (allocation >= 0.12) {
    return "medium";
  }

  return "exploratory";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createDeterministicId(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return `tx_${hash.toString(16).padStart(8, "0")}`;
}
