import type {
  CandidateInteractionProfile,
  CompatibilityProfile,
} from "@/lib/matching/compatibility";

type CandidateSeed = {
  user: Omit<CompatibilityProfile["user"], "personality"> & {
    personality?: CompatibilityProfile["user"]["personality"];
  };
  portfolio: CompatibilityProfile["portfolio"];
  interaction?: CandidateInteractionProfile;
};

type OptimizationIntent =
  | "balanced"
  | "data-saver"
  | "slow-network";

export interface MobileOptimizationOptions {
  limit?: number;
  intent?: OptimizationIntent;
}

const TOKEN_LIMITS: Record<OptimizationIntent, number> = {
  "data-saver": 4,
  "slow-network": 5,
  balanced: 7,
};

const DEFI_LIMITS: Record<OptimizationIntent, number> = {
  "data-saver": 3,
  "slow-network": 4,
  balanced: 6,
};

const NFT_LIMITS: Record<OptimizationIntent, number> = {
  "data-saver": 2,
  "slow-network": 3,
  balanced: 4,
};

const ACTIVITY_HOUR_LIMITS: Record<OptimizationIntent, number> = {
  "data-saver": 4,
  "slow-network": 6,
  balanced: 8,
};

export function optimizeCandidateSeeds(
  seeds: CandidateSeed[],
  { limit, intent = "balanced" }: MobileOptimizationOptions = {},
): CandidateSeed[] {
  const upperBound = typeof limit === "number" ? Math.max(1, limit) : seeds.length;
  const trimmedSeeds = seeds.slice(0, upperBound);

  if (intent === "balanced") {
    return trimmedSeeds;
  }

  return trimmedSeeds.map((seed) => ({
    ...seed,
    portfolio: {
      ...seed.portfolio,
      tokens: seed.portfolio.tokens.slice(0, TOKEN_LIMITS[intent]),
      defiProtocols: seed.portfolio.defiProtocols.slice(0, DEFI_LIMITS[intent]),
      nftCollections: seed.portfolio.nftCollections.slice(0, NFT_LIMITS[intent]),
      activity: {
        ...seed.portfolio.activity,
        activeHours: seed.portfolio.activity.activeHours.slice(
          0,
          ACTIVITY_HOUR_LIMITS[intent],
        ),
      },
      highlights: seed.portfolio.highlights?.slice(0, 2),
      transactions: seed.portfolio.transactions?.slice(0, 1),
    },
  }));
}

export function resolveOptimizationIntent({
  saveData,
  effectiveType,
}: {
  saveData?: boolean;
  effectiveType?: string;
}): OptimizationIntent {
  if (saveData) {
    return "data-saver";
  }

  if (effectiveType && /(2g|slow-2g)/i.test(effectiveType)) {
    return "slow-network";
  }

  return "balanced";
}

export type { CandidateSeed };
