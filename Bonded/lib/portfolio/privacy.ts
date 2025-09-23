import {
  type ActivityPattern,
  type ActivityPeriod,
  type DeFiProtocol,
  type NFTCollection,
  type PortfolioSnapshot,
  type PortfolioTransaction,
  type SanitizedActivityPattern,
  type SanitizedPortfolioSnapshot,
  type SanitizedTokenHolding,
  type SanitizedTransactionHistory,
  type TransactionPrivacyLevel,
  type TransactionVolumeBucket,
} from "./types";

export type PortfolioVisibilityLevel = "HIDDEN" | "SUMMARY" | "DETAILED";

export type ActivityVisibilityLevel = "HIDDEN" | "TIMEZONE_ONLY" | "PATTERNS";

export type TransactionVisibilityLevel = TransactionPrivacyLevel;

export interface PortfolioPrivacyAllowList {
  fids: number[];
  walletAddresses: string[];
}

export interface PortfolioPrivacyPreferences {
  shareTokens: boolean;
  shareDefi: boolean;
  shareNfts: boolean;
  shareActivity: boolean;
  shareHighlights: boolean;
  shareTransactions: boolean;
  tokenVisibility: PortfolioVisibilityLevel;
  defiVisibility: PortfolioVisibilityLevel;
  nftVisibility: PortfolioVisibilityLevel;
  activityVisibility: ActivityVisibilityLevel;
  transactionVisibility: TransactionPrivacyLevel;
  transactionWindowDays: number;
  maskTokenConviction: boolean;
  maskTokenChains: boolean;
  maskDefiStrategies: boolean;
  maskDefiRisks: boolean;
  maskNftThemes: boolean;
  maskActivityRisk: boolean;
  redactHighlights: boolean;
  allowList: PortfolioPrivacyAllowList;
}

export type PortfolioPrivacyPreferencesInput = Partial<
  Omit<PortfolioPrivacyPreferences, "allowList">
> & {
  allowList?: Partial<PortfolioPrivacyAllowList>;
};

export interface PortfolioViewerContext {
  fid?: number;
  walletAddress?: string;
  isOwner?: boolean;
}

const ACTIVITY_PERIOD_ORDER: ActivityPeriod[] = [
  "early_morning",
  "morning",
  "afternoon",
  "evening",
  "late_night",
];

const MAX_TOKEN_SUMMARY = 3;
const MAX_TOKEN_DETAILED = 10;
const MAX_DEFI_SUMMARY = 5;
const MAX_DEFI_DETAILED = 8;
const MAX_NFT_SUMMARY = 6;
const MAX_NFT_DETAILED = 12;

export const DEFAULT_PRIVACY_PREFERENCES: PortfolioPrivacyPreferences = {
  shareTokens: true,
  shareDefi: true,
  shareNfts: true,
  shareActivity: true,
  shareHighlights: true,
  shareTransactions: false,
  tokenVisibility: "SUMMARY",
  defiVisibility: "SUMMARY",
  nftVisibility: "SUMMARY",
  activityVisibility: "PATTERNS",
  transactionVisibility: "ANONYMIZED",
  transactionWindowDays: 30,
  maskTokenConviction: true,
  maskTokenChains: true,
  maskDefiStrategies: true,
  maskDefiRisks: true,
  maskNftThemes: true,
  maskActivityRisk: true,
  redactHighlights: false,
  allowList: {
    fids: [],
    walletAddresses: [],
  },
};

export function normalizePrivacyPreferences(
  input: PortfolioPrivacyPreferencesInput = DEFAULT_PRIVACY_PREFERENCES,
): PortfolioPrivacyPreferences {
  const allowList = normalizeAllowList({
    fids: input.allowList?.fids ?? DEFAULT_PRIVACY_PREFERENCES.allowList.fids,
    walletAddresses:
      input.allowList?.walletAddresses ?? DEFAULT_PRIVACY_PREFERENCES.allowList.walletAddresses,
  });

  return {
    shareTokens: input.shareTokens ?? DEFAULT_PRIVACY_PREFERENCES.shareTokens,
    shareDefi: input.shareDefi ?? DEFAULT_PRIVACY_PREFERENCES.shareDefi,
    shareNfts: input.shareNfts ?? DEFAULT_PRIVACY_PREFERENCES.shareNfts,
    shareActivity: input.shareActivity ?? DEFAULT_PRIVACY_PREFERENCES.shareActivity,
    shareHighlights: input.shareHighlights ?? DEFAULT_PRIVACY_PREFERENCES.shareHighlights,
    shareTransactions: input.shareTransactions ?? DEFAULT_PRIVACY_PREFERENCES.shareTransactions,
    tokenVisibility: input.tokenVisibility ?? DEFAULT_PRIVACY_PREFERENCES.tokenVisibility,
    defiVisibility: input.defiVisibility ?? DEFAULT_PRIVACY_PREFERENCES.defiVisibility,
    nftVisibility: input.nftVisibility ?? DEFAULT_PRIVACY_PREFERENCES.nftVisibility,
    activityVisibility:
      input.activityVisibility ?? DEFAULT_PRIVACY_PREFERENCES.activityVisibility,
    transactionVisibility:
      input.transactionVisibility ?? DEFAULT_PRIVACY_PREFERENCES.transactionVisibility,
    transactionWindowDays:
      normalizeTransactionWindow(
        input.transactionWindowDays ?? DEFAULT_PRIVACY_PREFERENCES.transactionWindowDays,
      ),
    maskTokenConviction:
      input.maskTokenConviction ?? DEFAULT_PRIVACY_PREFERENCES.maskTokenConviction,
    maskTokenChains: input.maskTokenChains ?? DEFAULT_PRIVACY_PREFERENCES.maskTokenChains,
    maskDefiStrategies:
      input.maskDefiStrategies ?? DEFAULT_PRIVACY_PREFERENCES.maskDefiStrategies,
    maskDefiRisks: input.maskDefiRisks ?? DEFAULT_PRIVACY_PREFERENCES.maskDefiRisks,
    maskNftThemes: input.maskNftThemes ?? DEFAULT_PRIVACY_PREFERENCES.maskNftThemes,
    maskActivityRisk: input.maskActivityRisk ?? DEFAULT_PRIVACY_PREFERENCES.maskActivityRisk,
    redactHighlights: input.redactHighlights ?? DEFAULT_PRIVACY_PREFERENCES.redactHighlights,
    allowList,
  };
}

export function canViewerAccessPortfolio(
  preferences: PortfolioPrivacyPreferences,
  context: PortfolioViewerContext = {},
): boolean {
  if (context.isOwner) {
    return true;
  }

  const requiresAllowList =
    preferences.allowList.fids.length > 0 || preferences.allowList.walletAddresses.length > 0;

  if (!requiresAllowList) {
    return true;
  }

  if (
    typeof context.fid === "number" &&
    preferences.allowList.fids.includes(Number(context.fid))
  ) {
    return true;
  }

  if (context.walletAddress) {
    const normalized = context.walletAddress.toLowerCase();
    if (
      preferences.allowList.walletAddresses.some(
        (address) => address.toLowerCase() === normalized,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function applyPrivacyPreferences(
  snapshot: PortfolioSnapshot,
  preferences: PortfolioPrivacyPreferencesInput = DEFAULT_PRIVACY_PREFERENCES,
): SanitizedPortfolioSnapshot {
  const settings = normalizePrivacyPreferences(preferences);

  const tokens = settings.shareTokens
    ? sanitizeTokens(snapshot.tokens, settings.tokenVisibility, {
        maskConviction: settings.maskTokenConviction,
        maskChain: settings.maskTokenChains,
      })
    : [];

  const defiProtocols = settings.shareDefi
    ? sanitizeDefiProtocols(snapshot.defiProtocols, settings.defiVisibility, {
        maskStrategies: settings.maskDefiStrategies,
        maskRisk: settings.maskDefiRisks,
      })
    : [];

  const nftCollections = settings.shareNfts
    ? sanitizeNftCollections(snapshot.nftCollections, settings.nftVisibility, {
        maskThemes: settings.maskNftThemes,
      })
    : [];

  const activity = sanitizeActivity(
    snapshot.activity,
    settings.shareActivity,
    settings.activityVisibility,
    { maskRisk: settings.maskActivityRisk },
  );

  const highlights = settings.shareHighlights
    ? sanitizeHighlights(snapshot.highlights ?? [], settings.redactHighlights)
    : [];

  const transactions = sanitizeTransactions(
    snapshot.transactions,
    settings.shareTransactions,
    settings.transactionVisibility,
    settings.transactionWindowDays,
  );

  return {
    tokens,
    defiProtocols,
    nftCollections,
    activity,
    highlights,
    transactions,
  };
}

function sanitizeTokens(
  tokens: PortfolioSnapshot["tokens"],
  visibility: PortfolioVisibilityLevel,
  options: { maskConviction: boolean; maskChain: boolean },
): SanitizedTokenHolding[] {
  if (!tokens.length || visibility === "HIDDEN") {
    return [];
  }

  const sorted = [...tokens].sort((a, b) => b.allocation - a.allocation);
  const limit = visibility === "SUMMARY" ? MAX_TOKEN_SUMMARY : MAX_TOKEN_DETAILED;

  return sorted.slice(0, limit).map((token) => {
    const sanitized: SanitizedTokenHolding = {
      symbol: token.symbol,
      conviction: options.maskConviction ? undefined : token.conviction,
      chain: options.maskChain ? undefined : token.chain,
      allocationBucket: bucketizeAllocation(token.allocation),
    };

    if (options.maskConviction) {
      delete sanitized.conviction;
    }

    if (options.maskChain) {
      delete sanitized.chain;
    }

    return sanitized;
  });
}

function sanitizeDefiProtocols(
  protocols: DeFiProtocol[],
  visibility: PortfolioVisibilityLevel,
  options: { maskStrategies: boolean; maskRisk: boolean },
): DeFiProtocol[] {
  if (!protocols.length || visibility === "HIDDEN") {
    return [];
  }

  const sanitized = [...protocols];

  if (visibility === "SUMMARY") {
    const seenCategories = new Set<string>();
    const summary: DeFiProtocol[] = [];

    for (const protocol of sanitized) {
      if (seenCategories.has(protocol.category)) {
        continue;
      }

      seenCategories.add(protocol.category);
      summary.push({ name: protocol.name, category: protocol.category });

      if (summary.length >= MAX_DEFI_SUMMARY) {
        break;
      }
    }

    return summary;
  }

  return sanitized.slice(0, MAX_DEFI_DETAILED).map((protocol) => ({
    name: protocol.name,
    category: protocol.category,
    strategy: options.maskStrategies ? undefined : protocol.strategy,
    risk: options.maskRisk ? undefined : protocol.risk,
  }));
}

function sanitizeNftCollections(
  collections: NFTCollection[],
  visibility: PortfolioVisibilityLevel,
  options: { maskThemes: boolean },
): NFTCollection[] {
  if (!collections.length || visibility === "HIDDEN") {
    return [];
  }

  const sanitized = [...collections];

  if (visibility === "SUMMARY") {
    const seenThemes = new Set<NFTCollection["theme"]>();
    const summary: NFTCollection[] = [];

    for (const collection of sanitized) {
      if (seenThemes.has(collection.theme)) {
        continue;
      }

      seenThemes.add(collection.theme);
      summary.push({
        name: options.maskThemes ? "Private collection" : collection.name,
        theme: options.maskThemes ? "collectible" : collection.theme,
      });

      if (summary.length >= MAX_NFT_SUMMARY) {
        break;
      }
    }

    return summary;
  }

  return sanitized.slice(0, MAX_NFT_DETAILED).map((collection) => ({
    name: options.maskThemes ? "Private collection" : collection.name,
    theme: options.maskThemes ? "collectible" : collection.theme,
    vibe: options.maskThemes ? undefined : collection.vibe,
  }));
}

function sanitizeActivity(
  activity: ActivityPattern,
  shareActivity: boolean,
  visibility: ActivityVisibilityLevel,
  options: { maskRisk: boolean },
): SanitizedActivityPattern | null {
  if (!shareActivity || visibility === "HIDDEN") {
    return null;
  }

  const timezone = formatTimezoneOffset(activity.timezoneOffset);
  const base: SanitizedActivityPattern = {
    timezone,
    activePeriods: [],
    tradingFrequency: activity.tradingFrequency,
    riskTolerance: options.maskRisk ? "withheld" : activity.riskTolerance,
  };

  if (visibility === "TIMEZONE_ONLY") {
    return base;
  }

  const periods = Array.from(
    new Set(
      activity.activeHours
        .map(normalizeHour)
        .map(mapHourToPeriod)
        .filter((period): period is ActivityPeriod => Boolean(period)),
    ),
  );

  periods.sort((a, b) => ACTIVITY_PERIOD_ORDER.indexOf(a) - ACTIVITY_PERIOD_ORDER.indexOf(b));

  return {
    ...base,
    activePeriods: periods,
  };
}

function sanitizeHighlights(highlights: string[], redact: boolean): string[] {
  if (!highlights.length) {
    return [];
  }

  if (!redact) {
    return [...highlights];
  }

  return highlights.map((highlight) => {
    if (!highlight.trim()) {
      return "Private highlight available on request.";
    }

    const focus = highlight.split(" ")[0]?.replace(/[\W_]+/g, "");
    return focus
      ? `${focus} milestone protected — share during a secure chat.`
      : "Milestone protected — share during a secure chat.";
  });
}

function sanitizeTransactions(
  transactions: PortfolioTransaction[] | undefined,
  shareTransactions: boolean,
  visibility: TransactionPrivacyLevel,
  windowDays: number,
): SanitizedTransactionHistory | null {
  if (!shareTransactions || visibility === "HIDDEN" || !transactions || !transactions.length) {
    return null;
  }

  const normalizedWindow = normalizeTransactionWindow(windowDays);
  const referenceTimestamp = resolveTransactionReferenceTimestamp(transactions);
  const timestampedTransactions = transactions.filter((entry) =>
    Number.isFinite(entry.timestamp),
  );

  const relevant = timestampedTransactions.filter((entry) =>
    isWithinWindow(entry.timestamp, referenceTimestamp, normalizedWindow),
  );

  const dataset = relevant.length ? relevant : timestampedTransactions;

  if (!dataset.length) {
    return {
      visibility,
      buckets: [],
      notableCounterparties: summarizeCounterparties(transactions, visibility),
      anonymization: {
        method: visibility === "SUMMARY" ? "masking" : "hash_truncation",
        lastUpdated: referenceTimestamp,
        windowDays: normalizedWindow,
      },
    };
  }

  const bucketDefinitions: Array<{ period: "24h" | "7d" | "30d" | "90d" | "lifetime"; days?: number }> = [
    { period: "24h", days: 1 },
    { period: "7d", days: 7 },
    { period: "30d", days: 30 },
    { period: "90d", days: 90 },
    { period: "lifetime" },
  ];

  const buckets = bucketDefinitions
    .filter((definition) =>
      !definition.days || definition.days <= normalizedWindow || definition.period === "lifetime",
    )
    .map((definition) => {
      const windowCutoff = definition.days ? definition.days * 86_400_000 : undefined;
      const inWindow = dataset.filter((entry) =>
        windowCutoff ? referenceTimestamp - entry.timestamp <= windowCutoff : true,
      );

      const inbound = inWindow.filter((entry) => entry.direction === "inbound").length;
      const outbound = inWindow.filter((entry) => entry.direction === "outbound").length;
      const selfCount = inWindow.filter((entry) => entry.direction === "self").length;

      const total = inbound + outbound + selfCount;
      const volumeBucket = classifyVolume(total);
      const delta = inbound - outbound;
      const netFlow: "positive" | "neutral" | "negative" =
        delta > 1 ? "positive" : delta < -1 ? "negative" : "neutral";

      return {
        period: definition.period,
        inboundCount: inbound,
        outboundCount: outbound,
        selfCount,
        volumeBucket,
        netFlow,
      };
    });

  const notableCounterparties = summarizeCounterparties(dataset, visibility);

  return {
    visibility,
    buckets,
    notableCounterparties,
    anonymization: {
      method: visibility === "SUMMARY" ? "masking" : "hash_truncation",
      lastUpdated: referenceTimestamp,
      windowDays: normalizedWindow,
    },
  };
}

function resolveTransactionReferenceTimestamp(
  transactions: PortfolioTransaction[],
  fallback = Date.now(),
): number {
  const latest = transactions.reduce((max, entry) => {
    if (Number.isFinite(entry.timestamp)) {
      return Math.max(max, entry.timestamp);
    }

    return max;
  }, 0);

  if (latest > 0) {
    return latest;
  }

  return fallback;
}

function classifyVolume(total: number): TransactionVolumeBucket {
  if (total <= 2) {
    return "minimal";
  }

  if (total <= 6) {
    return "moderate";
  }

  if (total <= 15) {
    return "active";
  }

  return "high";
}

function summarizeCounterparties(
  transactions: PortfolioTransaction[],
  visibility: TransactionPrivacyLevel,
  limit = 5,
): string[] {
  if (!transactions.length) {
    return [];
  }

  const counter = new Map<string, { count: number }>();

  for (const entry of transactions) {
    const label =
      visibility === "SUMMARY"
        ? buildSummaryLabel(entry)
        : buildAnonymizedLabel(entry);

    const existing = counter.get(label);
    if (existing) {
      existing.count += 1;
    } else {
      counter.set(label, { count: 1 });
    }
  }

  return Array.from(counter.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([label, data]) => `${label} • ${data.count} tx`);
}

function buildSummaryLabel(entry: PortfolioTransaction): string {
  if (entry.protocol) {
    return `${entry.protocol} (${entry.direction === "inbound" ? "rewards" : "activity"})`;
  }

  if (entry.counterpartyType === "bridge") {
    return "Bridge routing";
  }

  if (entry.counterpartyType === "user") {
    return truncateAddress(entry.counterparty);
  }

  if (entry.counterpartyType === "contract") {
    return `Smart contract ${truncateAddress(entry.counterparty)}`;
  }

  return buildAnonymizedLabel(entry);
}

function buildAnonymizedLabel(entry: PortfolioTransaction): string {
  return anonymizeCounterparty(entry.counterparty, entry.counterpartyType);
}

function anonymizeCounterparty(counterparty: string, type?: PortfolioTransaction["counterpartyType"]): string {
  const hash = hashString(counterparty).slice(0, 6).toUpperCase();
  const descriptor = type ?? "contact";
  return `Counterparty ${hash} (${descriptor})`;
}

function truncateAddress(value: string): string {
  const normalized = value.trim();
  if (/^0x[0-9a-f]{6,}$/i.test(normalized)) {
    return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
  }

  if (normalized.length > 12) {
    return `${normalized.slice(0, 8)}…`;
  }

  return normalized || "unknown";
}

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function isWithinWindow(timestamp: number, now: number, days: number): boolean {
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const windowMs = days * 86_400_000;
  return now - timestamp <= windowMs;
}

function normalizeTransactionWindow(windowDays: number): number {
  if (!Number.isFinite(windowDays) || windowDays <= 0) {
    return DEFAULT_PRIVACY_PREFERENCES.transactionWindowDays;
  }

  return Math.min(365, Math.max(1, Math.round(windowDays)));
}

function bucketizeAllocation(allocation: number): SanitizedTokenHolding["allocationBucket"] {
  if (!Number.isFinite(allocation)) {
    return "exploratory";
  }

  if (allocation >= 0.4) {
    return "dominant";
  }

  if (allocation >= 0.2) {
    return "significant";
  }

  if (allocation >= 0.1) {
    return "diversified";
  }

  return "exploratory";
}

function formatTimezoneOffset(offset: number): string {
  if (!Number.isFinite(offset) || offset === 0) {
    return "UTC";
  }

  const sign = offset > 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const hours = Math.trunc(absolute);
  const minutes = Math.round((absolute - hours) * 60);

  if (minutes) {
    return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return `UTC${sign}${String(hours).padStart(2, "0")}`;
}

function normalizeHour(hour: number): number {
  if (!Number.isFinite(hour)) {
    return 0;
  }

  const normalized = Math.floor(hour) % 24;
  return normalized < 0 ? normalized + 24 : normalized;
}

function mapHourToPeriod(hour: number): ActivityPeriod {
  if (hour >= 5 && hour < 9) {
    return "early_morning";
  }

  if (hour >= 9 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "late_night";
}

function normalizeAllowList(
  allowList: Partial<PortfolioPrivacyAllowList>,
): PortfolioPrivacyAllowList {
  const uniqueFids = Array.from(
    new Set(
      (allowList.fids ?? []).filter((fid): fid is number => Number.isInteger(fid) && fid >= 0),
    ),
  );

  const uniqueAddresses = Array.from(
    new Set(
      (allowList.walletAddresses ?? [])
        .map((address) => address.trim())
        .filter((address) => address.length > 0)
        .map((address) => address.toLowerCase()),
    ),
  );

  return {
    fids: uniqueFids,
    walletAddresses: uniqueAddresses,
  };
}
