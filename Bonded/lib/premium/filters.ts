import type { MatchCandidate, SharedInterest } from "../matching/compatibility";

export type CompatibilityCategoryId = MatchCandidate["compatibilityScore"]["category"]["id"];
export type ActivityFilter = "active_hours" | "risk_alignment";

export interface PremiumFilterOptions {
  searchTerm?: string;
  minScore?: number;
  categories?: CompatibilityCategoryId[];
  tokenSymbols?: string[];
  defiProtocols?: string[];
  activityFocus?: ActivityFilter[];
  personalities?: string[];
  warmSignalsOnly?: boolean;
}

export interface PremiumFilterFacets {
  categories: CompatibilityCategoryId[];
  tokenSymbols: string[];
  defiProtocols: string[];
  activityFocus: ActivityFilter[];
  personalities: string[];
}

export interface PremiumFilterSummary {
  description: string;
  activeFilters: string[];
}

const COMPATIBILITY_CATEGORY_IDS = [
  "crypto_soulmates",
  "defi_compatible",
  "potential_match",
  "different_strategies",
] as const satisfies readonly CompatibilityCategoryId[];

const COMPATIBILITY_CATEGORY_SET = new Set<CompatibilityCategoryId>(COMPATIBILITY_CATEGORY_IDS);

const normalizeList = (values: readonly string[] | undefined): string[] =>
  Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));

const normalizeCategories = (
  values: PremiumFilterOptions["categories"],
): CompatibilityCategoryId[] =>
  normalizeList(values).filter((value): value is CompatibilityCategoryId =>
    COMPATIBILITY_CATEGORY_SET.has(value as CompatibilityCategoryId),
  );

const normalizeScore = (value: number | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

export function normalizeFilterOptions(options: PremiumFilterOptions): Required<PremiumFilterOptions> {
  return {
    searchTerm: options.searchTerm?.trim() ?? "",
    minScore: normalizeScore(options.minScore),
    categories: normalizeCategories(options.categories),
    tokenSymbols: normalizeList(options.tokenSymbols).map((symbol) => symbol.toUpperCase()),
    defiProtocols: normalizeList(options.defiProtocols).map((protocol) => protocol.toLowerCase()),
    activityFocus: normalizeList(options.activityFocus).filter(
      (value): value is ActivityFilter => value === "active_hours" || value === "risk_alignment",
    ),
    personalities: normalizeList(options.personalities),
    warmSignalsOnly: Boolean(options.warmSignalsOnly),
  };
}

const sharedInterestMatchesToken = (interest: SharedInterest, tokens: string[]): boolean => {
  if (interest.type !== "token") {
    return false;
  }
  const name = interest.name.toUpperCase();
  const detail = interest.detail?.toUpperCase();
  return tokens.some((token) => name.includes(token) || detail?.includes(token));
};

const sharedInterestMatchesProtocol = (interest: SharedInterest, protocols: string[]): boolean => {
  if (interest.type !== "defi") {
    return false;
  }
  const name = interest.name.toLowerCase();
  const detail = interest.detail?.toLowerCase();
  return protocols.some((protocol) => name.includes(protocol) || detail?.includes(protocol));
};

const hasActivityFocus = (interests: SharedInterest[], focus: ActivityFilter[]): boolean => {
  if (!focus.length) {
    return true;
  }

  return focus.every((target) => {
    if (target === "active_hours") {
      return interests.some(
        (interest) => interest.type === "activity" && interest.name.toLowerCase().includes("active"),
      );
    }
    if (target === "risk_alignment") {
      return interests.some(
        (interest) => interest.type === "activity" && interest.name.toLowerCase().includes("risk"),
      );
    }
    return false;
  });
};

const matchesWarmSignal = (candidate: MatchCandidate): boolean => {
  const interaction = candidate.interaction;
  if (!interaction) {
    return false;
  }
  if (interaction.initialDecision && interaction.initialDecision !== "pass") {
    return true;
  }
  const auto = interaction.autoResponse;
  if (!auto) {
    return false;
  }
  return (auto.onLike && auto.onLike !== "pass") || (auto.onSuperLike && auto.onSuperLike !== "pass") || false;
};

const buildSearchDocument = (candidate: MatchCandidate): string => {
  const parts: string[] = [
    candidate.user.displayName,
    candidate.user.personality,
    candidate.user.headline ?? "",
    candidate.user.bio ?? "",
    candidate.compatibilityScore.category.label,
    ...candidate.compatibilityScore.reasoning,
    ...candidate.sharedInterests.map((interest) => interest.detail ?? interest.name),
  ];
  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

export function filterCandidates(
  candidates: MatchCandidate[],
  options: PremiumFilterOptions,
): MatchCandidate[] {
  const normalized = normalizeFilterOptions(options);

  if (!candidates.length) {
    return candidates;
  }

  return candidates.filter((candidate) => {
    if (candidate.compatibilityScore.overall < normalized.minScore) {
      return false;
    }

    if (
      normalized.categories.length &&
      !normalized.categories.includes(candidate.compatibilityScore.category.id)
    ) {
      return false;
    }

    if (
      normalized.personalities.length &&
      !normalized.personalities.includes(candidate.user.personality)
    ) {
      return false;
    }

    if (normalized.tokenSymbols.length) {
      const tokens = candidate.sharedInterests.filter((interest) => interest.type === "token");
      if (!tokens.some((interest) => sharedInterestMatchesToken(interest, normalized.tokenSymbols))) {
        return false;
      }
    }

    if (normalized.defiProtocols.length) {
      const defi = candidate.sharedInterests.filter((interest) => interest.type === "defi");
      if (!defi.some((interest) => sharedInterestMatchesProtocol(interest, normalized.defiProtocols))) {
        return false;
      }
    }

    if (!hasActivityFocus(candidate.sharedInterests, normalized.activityFocus)) {
      return false;
    }

    if (normalized.warmSignalsOnly && !matchesWarmSignal(candidate)) {
      return false;
    }

    if (normalized.searchTerm) {
      const document = buildSearchDocument(candidate);
      if (!document.includes(normalized.searchTerm.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

export function buildPremiumFilterFacets(candidates: MatchCandidate[]): PremiumFilterFacets {
  const categories = new Set<CompatibilityCategoryId>();
  const tokenSymbols = new Set<string>();
  const defiProtocols = new Set<string>();
  const personalities = new Set<string>();
  let activityActiveHours = false;
  let activityRisk = false;

  for (const candidate of candidates) {
    categories.add(candidate.compatibilityScore.category.id);
    if (candidate.user.personality) {
      personalities.add(candidate.user.personality);
    }

    for (const interest of candidate.sharedInterests) {
      if (interest.type === "token") {
        tokenSymbols.add(interest.name.toUpperCase());
      } else if (interest.type === "defi") {
        defiProtocols.add(interest.name.toLowerCase());
      } else if (interest.type === "activity") {
        const normalizedName = interest.name.toLowerCase();
        if (normalizedName.includes("active")) {
          activityActiveHours = true;
        }
        if (normalizedName.includes("risk")) {
          activityRisk = true;
        }
      }
    }
  }

  const activityFocus: ActivityFilter[] = [];
  if (activityActiveHours) {
    activityFocus.push("active_hours");
  }
  if (activityRisk) {
    activityFocus.push("risk_alignment");
  }

  return {
    categories: Array.from(categories),
    tokenSymbols: Array.from(tokenSymbols),
    defiProtocols: Array.from(defiProtocols),
    activityFocus,
    personalities: Array.from(personalities),
  };
}

export function summarizeFilters(options: PremiumFilterOptions): PremiumFilterSummary {
  const normalized = normalizeFilterOptions(options);
  const activeFilters: string[] = [];

  if (normalized.searchTerm) {
    activeFilters.push(`Search: "${normalized.searchTerm}"`);
  }
  if (normalized.minScore > 0) {
    activeFilters.push(`Min score ${(normalized.minScore * 100).toFixed(0)}%`);
  }
  if (normalized.categories.length) {
    activeFilters.push(`Categories: ${normalized.categories.join(", ")}`);
  }
  if (normalized.tokenSymbols.length) {
    activeFilters.push(`Tokens: ${normalized.tokenSymbols.join(", ")}`);
  }
  if (normalized.defiProtocols.length) {
    activeFilters.push(`DeFi: ${normalized.defiProtocols.join(", ")}`);
  }
  if (normalized.activityFocus.length) {
    activeFilters.push(
      `Activity: ${normalized.activityFocus
        .map((value) => (value === "active_hours" ? "Active hours" : "Risk alignment"))
        .join(", ")}`,
    );
  }
  if (normalized.personalities.length) {
    activeFilters.push(`Personality: ${normalized.personalities.join(", ")}`);
  }
  if (normalized.warmSignalsOnly) {
    activeFilters.push("Warm signals only");
  }

  return {
    description: activeFilters.length ? activeFilters.join(" • ") : "All premium matches",
    activeFilters,
  };
}
