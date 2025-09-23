import type { HumorLevel } from "./types";

export type IcebreakerExperimentVariant = "alpha" | "beta";

export interface IcebreakerVariantConfig {
  id: IcebreakerExperimentVariant;
  label: string;
  humorPreference: HumorLevel;
  maxResults: number;
  maxMarketInsights: number;
  temperature: number;
  description: string;
}

const VARIANT_CONFIGS: Record<IcebreakerExperimentVariant, IcebreakerVariantConfig> = {
  alpha: {
    id: "alpha",
    label: "Alpha",
    humorPreference: "light",
    maxResults: 3,
    maxMarketInsights: 2,
    temperature: 0.6,
    description: "Gentle openers with lighter humor and quick prompts.",
  },
  beta: {
    id: "beta",
    label: "Beta",
    humorPreference: "moderate",
    maxResults: 4,
    maxMarketInsights: 3,
    temperature: 0.85,
    description: "Richer context with spicier hooks and extra suggestions.",
  },
};

const HASH_SEED = 31;
const HASH_MOD = 1_000_000_007;

const createHash = (input: string): number => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * HASH_SEED + input.charCodeAt(index)) % HASH_MOD;
  }
  return hash;
};

export function assignIcebreakerVariant(seed: string): IcebreakerExperimentVariant {
  if (!seed) {
    return "alpha";
  }

  const hash = createHash(seed);
  return hash % 100 < 50 ? "alpha" : "beta";
}

export function getVariantConfig(variant: IcebreakerExperimentVariant): IcebreakerVariantConfig {
  return VARIANT_CONFIGS[variant];
}
