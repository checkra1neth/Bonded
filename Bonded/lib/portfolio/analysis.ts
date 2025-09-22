import {
  applyPrivacyPreferences,
  DEFAULT_PRIVACY_PREFERENCES,
  type PortfolioPrivacyPreferencesInput,
} from "./privacy";
import {
  type PortfolioSnapshot,
  type SanitizedPortfolioSnapshot,
} from "./types";
import {
  SCORE_WEIGHTS,
  type CompatibilityScore,
  type SharedInterest,
} from "../matching/compatibility";

export type CompatibilityCategoryEnum =
  | "CRYPTO_SOULMATES"
  | "DEFI_COMPATIBLE"
  | "POTENTIAL_MATCH"
  | "DIFFERENT_STRATEGIES";

export interface CompatibilityAnalysisInput {
  ownerId: string;
  portfolioId: string;
  snapshot: PortfolioSnapshot;
  score: CompatibilityScore;
  sharedInterests?: SharedInterest[];
  targetUserId?: string;
  privacy?: PortfolioPrivacyPreferencesInput;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompatibilityAnalysisRecord {
  id: string;
  ownerId: string;
  portfolioId: string;
  targetUserId?: string;
  snapshot: SanitizedPortfolioSnapshot;
  score: CompatibilityScore;
  sharedInterests: SharedInterest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompatibilityAnalysisPersistence {
  id: string;
  ownerId: string;
  portfolioId: string;
  targetUserId: string | null;
  snapshot: SanitizedPortfolioSnapshot;
  sharedInterests: SharedInterest[];
  reasoning: string[];
  overallScore: number;
  tokenScore: number;
  defiScore: number;
  nftScore: number;
  activityScore: number;
  category: CompatibilityCategoryEnum;
  highlights: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function createCompatibilityAnalysisRecord(
  input: CompatibilityAnalysisInput,
): CompatibilityAnalysisRecord {
  const {
    ownerId,
    portfolioId,
    snapshot,
    score,
    sharedInterests = [],
    targetUserId,
    privacy,
    id,
    createdAt,
    updatedAt,
  } = input;

  const sanitizedSnapshot = applyPrivacyPreferences(
    snapshot,
    privacy ?? DEFAULT_PRIVACY_PREFERENCES,
  );

  const normalizedScore = normalizeCompatibilityScore(score);
  const dedupedInterests = dedupeSharedInterests(sharedInterests);
  const timestamp = createdAt ?? new Date();

  return {
    id: id ?? generateIdentifier("analysis"),
    ownerId,
    portfolioId,
    targetUserId,
    snapshot: sanitizedSnapshot,
    score: normalizedScore,
    sharedInterests: dedupedInterests,
    createdAt: timestamp,
    updatedAt: updatedAt ?? timestamp,
  };
}

export function toCompatibilityPersistence(
  record: CompatibilityAnalysisRecord,
): CompatibilityAnalysisPersistence {
  return {
    id: record.id,
    ownerId: record.ownerId,
    portfolioId: record.portfolioId,
    targetUserId: record.targetUserId ?? null,
    snapshot: record.snapshot,
    sharedInterests: record.sharedInterests,
    reasoning: record.score.reasoning,
    overallScore: record.score.overall,
    tokenScore: record.score.tokenSimilarity,
    defiScore: record.score.defiCompatibility,
    nftScore: record.score.nftAlignment,
    activityScore: record.score.activitySync,
    category: mapCategoryToEnum(record.score.category.id),
    highlights: record.snapshot.highlights,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapCategoryToEnum(
  categoryId: CompatibilityScore["category"]["id"],
): CompatibilityCategoryEnum {
  switch (categoryId) {
    case "crypto_soulmates":
      return "CRYPTO_SOULMATES";
    case "defi_compatible":
      return "DEFI_COMPATIBLE";
    case "potential_match":
      return "POTENTIAL_MATCH";
    default:
      return "DIFFERENT_STRATEGIES";
  }
}

function normalizeCompatibilityScore(score: CompatibilityScore): CompatibilityScore {
  const normalizedFactors = score.factors.map((factor) => ({
    ...factor,
    score: clamp01(factor.score),
    weight: clamp01(factor.weight),
  }));

  const normalized = {
    ...score,
    tokenSimilarity: clamp01(score.tokenSimilarity),
    defiCompatibility: clamp01(score.defiCompatibility),
    nftAlignment: clamp01(score.nftAlignment),
    activitySync: clamp01(score.activitySync),
    factors: normalizedFactors,
    reasoning: dedupeStrings(score.reasoning),
  };

  const weighted =
    normalized.tokenSimilarity * SCORE_WEIGHTS.token +
    normalized.defiCompatibility * SCORE_WEIGHTS.defi +
    normalized.nftAlignment * SCORE_WEIGHTS.nft +
    normalized.activitySync * SCORE_WEIGHTS.activity;

  return {
    ...normalized,
    overall: roundTo(clamp01(weighted), 4),
  };
}

function dedupeSharedInterests(interests: SharedInterest[], limit = 12): SharedInterest[] {
  if (!interests.length) {
    return [];
  }

  const seen = new Set<string>();
  const deduped: SharedInterest[] = [];

  for (const interest of interests) {
    if (!interest.name) {
      continue;
    }

    const key = [
      interest.type,
      interest.name.toLowerCase(),
      interest.detail?.toLowerCase() ?? "",
    ].join(":");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push({
      type: interest.type,
      name: interest.name,
      detail: interest.detail,
      insight: interest.insight,
    });

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function dedupeStrings(values: string[], limit = 6): string[] {
  if (!values.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);

    if (normalized.length >= limit) {
      break;
    }
  }

  return normalized;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function roundTo(value: number, precision = 4): number {
  return Math.round(value * 10 ** precision) / 10 ** precision;
}

function generateIdentifier(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
