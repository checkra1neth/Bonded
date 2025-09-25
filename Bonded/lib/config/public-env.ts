const publicEnv = {
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY ?? "test_onchain_key",
  NEXT_PUBLIC_BASE_PAY_APP_ID: process.env.NEXT_PUBLIC_BASE_PAY_APP_ID ?? "test_base_pay_app",
  NEXT_PUBLIC_BASE_PAY_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_BASE_PAY_PUBLISHABLE_KEY ?? "test_base_pay_publishable",
  NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "test_openai_key",
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "test_web_push_key",
  NEXT_PUBLIC_AUTH_DEV_FID: process.env.NEXT_PUBLIC_AUTH_DEV_FID ?? "777777",
};

type PublicEnvKey = keyof typeof publicEnv;

export function getPublicEnv(key: PublicEnvKey): string {
  const value = publicEnv[key];

  if (process.env.NODE_ENV === "production" && value.trim().length === 0) {
    throw new Error(`${String(key)} must be configured in production builds`);
  }

  return value;
}

export function getAllPublicEnv() {
  if (process.env.NODE_ENV === "production") {
    const missingKeys = (Object.keys(publicEnv) as PublicEnvKey[]).filter((key) =>
      publicEnv[key].trim().length === 0,
    );

    if (missingKeys.length > 0) {
      throw new Error(`Missing public environment variables: ${missingKeys.join(", ")}`);
    }
  }

  return { ...publicEnv };
}
