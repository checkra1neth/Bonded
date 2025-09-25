import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  AUTH_DEV_FID: z.string().optional(),
  NEXT_PUBLIC_AUTH_DEV_FID: z.string().optional(),
  AUTH_DISABLE_NETWORK: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
  BASE_RPC_URL: z.string().optional(),
  ETHEREUM_RPC_URL: z.string().optional(),
  BASENAME_RESOLVER_URL: z.string().optional(),
  ALCHEMY_BASE_API_KEY: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_OPENAI_API_KEY: z.string().optional(),
  MONITORING_LOGTAIL_ENDPOINT: z.string().optional(),
  MONITORING_LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  ERROR_WEBHOOK_URL: z.string().optional(),
  ANALYTICS_POSTHOG_HOST: z.string().optional(),
  ANALYTICS_POSTHOG_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_DEV_FID: process.env.AUTH_DEV_FID,
    NEXT_PUBLIC_AUTH_DEV_FID: process.env.NEXT_PUBLIC_AUTH_DEV_FID,
    AUTH_DISABLE_NETWORK: process.env.AUTH_DISABLE_NETWORK,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    VERCEL_ENV: process.env.VERCEL_ENV as ServerEnv["VERCEL_ENV"],
    VERCEL_URL: process.env.VERCEL_URL,
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL,
    BASENAME_RESOLVER_URL: process.env.BASENAME_RESOLVER_URL,
    ALCHEMY_BASE_API_KEY: process.env.ALCHEMY_BASE_API_KEY,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    MONITORING_LOGTAIL_ENDPOINT: process.env.MONITORING_LOGTAIL_ENDPOINT,
    MONITORING_LOGTAIL_SOURCE_TOKEN: process.env.MONITORING_LOGTAIL_SOURCE_TOKEN,
    ERROR_WEBHOOK_URL: process.env.ERROR_WEBHOOK_URL,
    ANALYTICS_POSTHOG_HOST: process.env.ANALYTICS_POSTHOG_HOST,
    ANALYTICS_POSTHOG_API_KEY: process.env.ANALYTICS_POSTHOG_API_KEY,
  });
}

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (process.env.NODE_ENV === "test") {
    return parseEnv();
  }

  if (!cachedEnv) {
    cachedEnv = parseEnv();
  }

  return cachedEnv;
}

export function reloadServerEnv(): ServerEnv {
  cachedEnv = parseEnv();
  return cachedEnv;
}

export function isProductionEnv(): boolean {
  return getServerEnv().NODE_ENV === "production";
}

export function resolveAppUrl(): string {
  const env = getServerEnv();

  if (env.VERCEL_ENV === "production" && env.NEXT_PUBLIC_URL) {
    return env.NEXT_PUBLIC_URL;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
}

export function getDatabaseUrl(): string | null {
  const env = getServerEnv();

  if (env.DATABASE_URL && env.DATABASE_URL.trim().length > 0) {
    return env.DATABASE_URL;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be configured in production environments");
  }

  return null;
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K, message?: string): NonNullable<ServerEnv[K]> {
  const env = getServerEnv();
  const value = env[key];

  if (value === undefined || value === null || value === "") {
    throw new Error(message ?? `${String(key)} must be configured`);
  }

  return value as NonNullable<ServerEnv[K]>;
}
