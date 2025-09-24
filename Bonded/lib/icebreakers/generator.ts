import type {
  GenerateIcebreakerOptions,
  GeneratedIcebreaker,
  HumorLevel,
  IcebreakerCategory,
  IcebreakerContext,
  IcebreakerGeneratorConfig,
  MarketInsight,
} from "./types";
import { getServerEnv } from "../config/env";
import { logger } from "../observability/logger";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MAX_RESULTS = 4;
const HUMOR_ORDER: Record<HumorLevel, number> = {
  light: 0,
  moderate: 1,
  spicy: 2,
};

const CATEGORY_ALIASES: Record<string, IcebreakerCategory> = {
  token: "portfolio",
  tokens: "portfolio",
  portfolio: "portfolio",
  defi: "defi",
  defi_protocol: "defi",
  nft: "nft",
  nfts: "nft",
  culture: "nft",
  market: "market",
  macro: "market",
  personality: "personality",
  vibe: "personality",
};

const HUMOR_ALIASES: Record<string, HumorLevel> = {
  soft: "light",
  gentle: "light",
  chill: "light",
  friendly: "light",
  light: "light",
  playful: "moderate",
  medium: "moderate",
  balanced: "moderate",
  moderate: "moderate",
  spicy: "spicy",
  bold: "spicy",
  teasing: "spicy",
  flirty: "spicy",
};

export class IcebreakerConfigurationError extends Error {}

export class IcebreakerGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "IcebreakerGenerationError";
    if (options?.cause) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).cause = options.cause;
      } catch {
        // ignore if cause assignment fails
      }
    }
  }
}

interface RawIcebreaker {
  message?: string;
  category?: string;
  humor_level?: string;
  humorLevel?: string;
  confidence?: number;
  references?: string[];
}

interface RequestOptions {
  maxResults: number;
  temperature: number;
}

export class IcebreakerGenerator {
  private readonly apiKey?: string;

  private readonly model: string;

  private readonly endpoint: string;

  private readonly fetchImpl: typeof fetch;

  private readonly organization?: string;

  private readonly maxRetries: number;

  private readonly timeoutMs?: number;

  constructor(config: IcebreakerGeneratorConfig = {}) {
    const env = getServerEnv();
    this.apiKey = config.apiKey ?? env.OPENAI_API_KEY ?? env.NEXT_PUBLIC_OPENAI_API_KEY;
    this.model = config.model ?? DEFAULT_MODEL;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.organization = config.organization;
    this.maxRetries = Math.max(1, config.maxRetries ?? 1);
    this.timeoutMs = config.timeoutMs;

    const fetchImpl = config.fetchImpl ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new IcebreakerConfigurationError("Fetch implementation is required for icebreakers");
    }
    this.fetchImpl = fetchImpl.bind(globalThis);
  }

  async generate(
    context: IcebreakerContext,
    options: GenerateIcebreakerOptions = {},
  ): Promise<GeneratedIcebreaker[]> {
    const maxResults = Math.max(1, options.maxResults ?? context.maxIcebreakers ?? DEFAULT_MAX_RESULTS);
    const temperature = options.temperature ?? 0.7;

    if (this.apiKey) {
      try {
        const response = await this.requestOpenAi(context, { maxResults, temperature });
        const normalized = this.normalizeResults(response, context);
        if (normalized.length) {
          return normalized.slice(0, maxResults);
        }
      } catch (error) {
        logger.warn("OpenAI icebreaker generation failed, falling back to heuristics", { error });
      }
    }

    return this.generateFallback(context, maxResults);
  }

  private async requestOpenAi(
    context: IcebreakerContext,
    requestOptions: RequestOptions,
  ): Promise<RawIcebreaker[]> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.maxRetries) {
      const controller = this.timeoutMs ? new AbortController() : undefined;
      const timeout = this.timeoutMs
        ? setTimeout(() => controller?.abort(), this.timeoutMs)
        : undefined;

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        };
        if (this.organization) {
          headers["OpenAI-Organization"] = this.organization;
        }

        const body = JSON.stringify({
          model: this.model,
          temperature: requestOptions.temperature,
          messages: [
            {
              role: "system",
              content:
                "You are a wingmate for a crypto dating app. Generate concise, high-signal icebreakers based on shared on-chain activity. Always respond in JSON with keys: icebreakers[].message, icebreakers[].category, icebreakers[].humor_level, icebreakers[].confidence (0-1), icebreakers[].references (array of strings).",
            },
            {
              role: "user",
              content: this.buildPrompt(context, requestOptions.maxResults),
            },
          ],
          response_format: {
            type: "json_object",
          },
        });

        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers,
          body,
          signal: controller?.signal,
        });

        if (!response.ok) {
          const errorPayload = await response
            .json()
            .catch(() => ({ message: response.statusText }));
          throw new IcebreakerGenerationError(
            `OpenAI request failed with status ${response.status}`,
            { cause: errorPayload },
          );
        }

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const message = payload.choices?.[0]?.message?.content;
        if (!message) {
          throw new IcebreakerGenerationError("OpenAI response missing completion content");
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(message);
        } catch (error) {
          throw new IcebreakerGenerationError("Unable to parse OpenAI icebreaker JSON", { cause: error });
        }

        const icebreakers = (parsed as { icebreakers?: RawIcebreaker[] }).icebreakers;
        if (!Array.isArray(icebreakers)) {
          throw new IcebreakerGenerationError("OpenAI response missing icebreaker array");
        }

        return icebreakers;
      } catch (error) {
        lastError = error;
        if (attempt >= this.maxRetries - 1) {
          throw error;
        }
        const backoff = Math.min(250 * (attempt + 1), 1000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } finally {
        if (timeout) {
          clearTimeout(timeout as unknown as NodeJS.Timeout);
        }
      }

      attempt += 1;
    }

    throw lastError instanceof Error
      ? lastError
      : new IcebreakerGenerationError("Failed to generate icebreakers with OpenAI");
  }

  private buildPrompt(context: IcebreakerContext, maxResults: number): string {
    const sharedByType = context.sharedInterests.reduce<Record<string, string[]>>((acc, interest) => {
      if (!interest.name) {
        return acc;
      }
      const bucket = acc[interest.type] ?? [];
      const detail = interest.detail ? `${interest.name} (${interest.detail})` : interest.name;
      bucket.push(detail);
      acc[interest.type] = bucket;
      return acc;
    }, {});

    const seekerPersonality = context.seeker.personality
      ? `${context.seeker.personality.type} — ${context.seeker.personality.headline}`
      : "unknown";
    const candidatePersonality = context.candidate.personality
      ? `${context.candidate.personality.type} — ${context.candidate.personality.headline}`
      : "unknown";

    const compatibilitySummary = context.compatibility
      ? `${Math.round(context.compatibility.overall * 100)}% (${context.compatibility.category.label})`
      : "unknown";

    const reasoning = context.compatibility?.reasoning?.slice(0, 4) ?? [];
    const highlights = [
      ...(context.seeker.highlights ?? []),
      ...(context.candidate.highlights ?? []),
    ].slice(0, 6);

    const marketInsights = (context.marketInsights ?? [])
      .map((event) => `${event.title} — ${event.summary} (${event.sentiment})`)
      .slice(0, 4);

    return [
      `Generate ${maxResults} icebreakers for ${context.seeker.displayName} to message ${context.candidate.displayName}.`,
      `Shared token interests: ${sharedByType.token?.join("; ") ?? "none"}.`,
      `Shared DeFi protocols: ${sharedByType.defi?.join("; ") ?? "none"}.`,
      `Shared NFT collections: ${sharedByType.nft?.join("; ") ?? "none"}.`,
      `Schedule overlap: ${sharedByType.activity?.join("; ") ?? "none"}.`,
      `Seeker personality: ${seekerPersonality}. Candidate personality: ${candidatePersonality}.`,
      `Compatibility summary: ${compatibilitySummary}. Reasoning: ${reasoning.join(" | ") || "none"}.`,
      highlights.length ? `Notable highlights: ${highlights.join(" | ")}.` : "",
      marketInsights.length ? `Recent market insights: ${marketInsights.join(" | ")}.` : "",
      `Humor preference: ${context.humorPreference ?? "moderate"}. Categories must be one of portfolio, defi, nft, market, personality.`,
      "Keep each message under 240 characters and grounded in the provided context.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private normalizeResults(
    raw: RawIcebreaker[],
    context: IcebreakerContext,
  ): GeneratedIcebreaker[] {
    const preference = context.humorPreference;
    const deduped = new Set<string>();

    return raw
      .map((item) => this.normalizeIcebreaker(item, preference))
      .filter((item): item is GeneratedIcebreaker => {
        if (!item) {
          return false;
        }
        if (deduped.has(item.message)) {
          return false;
        }
        deduped.add(item.message);
        return true;
      });
  }

  private normalizeIcebreaker(
    input: RawIcebreaker,
    preference?: HumorLevel,
  ): GeneratedIcebreaker | null {
    const message = (input.message ?? "").trim();
    if (!message) {
      return null;
    }

    const category = normalizeCategory(input.category ?? input.references?.[0] ?? null);
    const humor = calibrateHumor(normalizeHumor(input.humor_level ?? input.humorLevel ?? null), preference);
    const confidence = clampConfidence(typeof input.confidence === "number" ? input.confidence : 0.7);
    const references = Array.isArray(input.references)
      ? input.references.filter((reference) => typeof reference === "string" && reference.trim())
      : undefined;

    return {
      message,
      category,
      humorLevel: humor,
      confidence,
      references: references?.map((reference) => reference.trim()),
    };
  }

  private generateFallback(context: IcebreakerContext, maxResults: number): GeneratedIcebreaker[] {
    const preference = context.humorPreference;
    const results: GeneratedIcebreaker[] = [];

    const push = (
      message: string,
      category: IcebreakerCategory,
      confidence: number,
      references?: string[],
    ) => {
      const normalizedMessage = message.trim();
      if (!normalizedMessage || results.some((item) => item.message === normalizedMessage)) {
        return;
      }
      results.push({
        message: normalizedMessage,
        category,
        humorLevel: calibrateHumor("moderate", preference),
        confidence: clampConfidence(confidence),
        references,
      });
    };

    const tokens = context.sharedInterests.filter((interest) => interest.type === "token");
    const defi = context.sharedInterests.filter((interest) => interest.type === "defi");
    const nfts = context.sharedInterests.filter((interest) => interest.type === "nft");
    const activities = context.sharedInterests.filter((interest) => interest.type === "activity");

    if (tokens.length) {
      const sample = tokens[0];
      push(
        `We both lean into ${sample.detail ?? sample.name}. What's your latest thesis on ${sample.name}?`,
        "portfolio",
        0.82,
        [sample.name],
      );
    }

    if (defi.length) {
      const sample = defi[0];
      push(
        `How are you currently using ${sample.name}? I've been iterating on ${sample.detail ?? sample.name} strategies lately.`,
        "defi",
        0.78,
        [sample.name],
      );
    }

    if (nfts.length) {
      const sample = nfts[0];
      push(
        `${sample.name} keeps popping up in our overlap. Got a favorite piece or trait you're proud of?`,
        "nft",
        0.72,
        [sample.name],
      );
    }

    if (activities.length) {
      const sample = activities[0];
      push(
        `Our schedules both light up around ${sample.detail ?? sample.name}. Want to sync a market check-in during that window?`,
        "market",
        0.68,
      );
    }

    if (context.candidate.personality) {
      const personality = context.candidate.personality;
      push(
        `Your vibe screams ${personality.type}. What's a ${personality.type.toLowerCase()} move you're planning this week?`,
        "personality",
        0.7,
      );
    }

    const market = (context.marketInsights ?? []) as MarketInsight[];
    if (market.length) {
      const insight = market[0];
      const asset = insight.assets?.[0];
      push(
        `${insight.title} has me curious${asset ? ` about ${asset}` : ""}. Think it's a ${insight.sentiment} signal or noise?`,
        "market",
        0.66,
        asset ? [asset] : undefined,
      );
    }

    if (context.compatibility?.reasoning?.length) {
      push(
        `Your match profile says "${context.compatibility.reasoning[0]}". Want to compare notes over a quick alpha exchange?`,
        "portfolio",
        0.74,
      );
    }

    if (results.length < maxResults) {
      push(
        `Seems like our strategies rhyme. Down to swap watchlists and maybe spin up a shared dashboard?`,
        "portfolio",
        0.6,
      );
    }

    return results.slice(0, maxResults).map((item) => ({
      ...item,
      humorLevel: calibrateHumor(item.humorLevel, preference),
    }));
  }
}

function normalizeCategory(value: string | null): IcebreakerCategory {
  if (!value) {
    return "portfolio";
  }
  const normalized = CATEGORY_ALIASES[value.toLowerCase()] ?? value.toLowerCase();
  if (normalized === "defi" || normalized === "nft" || normalized === "market" || normalized === "personality") {
    return normalized;
  }
  return "portfolio";
}

function normalizeHumor(value: string | null): HumorLevel {
  if (!value) {
    return "moderate";
  }
  const normalized = HUMOR_ALIASES[value.toLowerCase()];
  return normalized ?? "moderate";
}

function calibrateHumor(level: HumorLevel, preference?: HumorLevel): HumorLevel {
  if (!preference) {
    return level;
  }
  return HUMOR_ORDER[level] <= HUMOR_ORDER[preference] ? level : preference;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.7;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
