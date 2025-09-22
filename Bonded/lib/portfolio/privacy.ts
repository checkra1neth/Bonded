import {
  type ActivityPattern,
  type ActivityPeriod,
  type DeFiProtocol,
  type NFTCollection,
  type PortfolioSnapshot,
  type SanitizedActivityPattern,
  type SanitizedPortfolioSnapshot,
  type SanitizedTokenHolding,
} from "./types";

export type PortfolioVisibilityLevel = "HIDDEN" | "SUMMARY" | "DETAILED";

export type ActivityVisibilityLevel = "HIDDEN" | "TIMEZONE_ONLY" | "PATTERNS";

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
  tokenVisibility: PortfolioVisibilityLevel;
  defiVisibility: PortfolioVisibilityLevel;
  nftVisibility: PortfolioVisibilityLevel;
  activityVisibility: ActivityVisibilityLevel;
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
  tokenVisibility: "SUMMARY",
  defiVisibility: "SUMMARY",
  nftVisibility: "SUMMARY",
  activityVisibility: "PATTERNS",
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
    tokenVisibility: input.tokenVisibility ?? DEFAULT_PRIVACY_PREFERENCES.tokenVisibility,
    defiVisibility: input.defiVisibility ?? DEFAULT_PRIVACY_PREFERENCES.defiVisibility,
    nftVisibility: input.nftVisibility ?? DEFAULT_PRIVACY_PREFERENCES.nftVisibility,
    activityVisibility:
      input.activityVisibility ?? DEFAULT_PRIVACY_PREFERENCES.activityVisibility,
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
    ? sanitizeTokens(snapshot.tokens, settings.tokenVisibility)
    : [];

  const defiProtocols = settings.shareDefi
    ? sanitizeDefiProtocols(snapshot.defiProtocols, settings.defiVisibility)
    : [];

  const nftCollections = settings.shareNfts
    ? sanitizeNftCollections(snapshot.nftCollections, settings.nftVisibility)
    : [];

  const activity = sanitizeActivity(
    snapshot.activity,
    settings.shareActivity,
    settings.activityVisibility,
  );

  const highlights = settings.shareHighlights ? [...(snapshot.highlights ?? [])] : [];

  return {
    tokens,
    defiProtocols,
    nftCollections,
    activity,
    highlights,
  };
}

function sanitizeTokens(
  tokens: PortfolioSnapshot["tokens"],
  visibility: PortfolioVisibilityLevel,
): SanitizedTokenHolding[] {
  if (!tokens.length || visibility === "HIDDEN") {
    return [];
  }

  const sorted = [...tokens].sort((a, b) => b.allocation - a.allocation);
  const limit = visibility === "SUMMARY" ? MAX_TOKEN_SUMMARY : MAX_TOKEN_DETAILED;

  return sorted.slice(0, limit).map((token) => ({
    symbol: token.symbol,
    conviction: token.conviction,
    chain: token.chain,
    allocationBucket: bucketizeAllocation(token.allocation),
  }));
}

function sanitizeDefiProtocols(
  protocols: DeFiProtocol[],
  visibility: PortfolioVisibilityLevel,
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

  return sanitized.slice(0, MAX_DEFI_DETAILED).map((protocol) => ({ ...protocol }));
}

function sanitizeNftCollections(
  collections: NFTCollection[],
  visibility: PortfolioVisibilityLevel,
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
      summary.push({ name: collection.name, theme: collection.theme });

      if (summary.length >= MAX_NFT_SUMMARY) {
        break;
      }
    }

    return summary;
  }

  return sanitized.slice(0, MAX_NFT_DETAILED).map((collection) => ({ ...collection }));
}

function sanitizeActivity(
  activity: ActivityPattern,
  shareActivity: boolean,
  visibility: ActivityVisibilityLevel,
): SanitizedActivityPattern | null {
  if (!shareActivity || visibility === "HIDDEN") {
    return null;
  }

  const timezone = formatTimezoneOffset(activity.timezoneOffset);
  const base: SanitizedActivityPattern = {
    timezone,
    activePeriods: [],
    tradingFrequency: activity.tradingFrequency,
    riskTolerance: activity.riskTolerance,
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
