const ROOT_URL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL;

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  frame: {
    version: "1",
    name: "Bonded",
    subtitle: "Find Your Crypto Soulmate",
    description: "The first dating app that matches you based on your crypto portfolio and DeFi interests",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0052FF",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["dating", "crypto", "defi", "social"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Match with people who share your crypto interests",
    ogTitle: "Bonded - Find Your Crypto Soulmate",
    ogDescription: "Match with people who share your crypto interests and DeFi strategies",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;