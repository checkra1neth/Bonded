import type { CommunityLeaderboard, CommunityLeaderboardEntry } from "./types";

const CONNECTOR_ENTRIES: CommunityLeaderboardEntry[] = [
  {
    userId: "ava-protocol",
    displayName: "Ava Protocol",
    avatarColor: "linear-gradient(135deg, #5f5bff, #00d1ff)",
    rank: 1,
    points: 1280,
    change: 2,
    category: "DeFi coordination",
    highlight: "Closed 6 mutual matches with governance-ready partners.",
  },
  {
    userId: "nova-yield",
    displayName: "Nova Yield",
    avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
    rank: 2,
    points: 1195,
    change: 1,
    category: "Yield strategy",
    highlight: "Activated 3 multi-wallet collaborations this week.",
  },
  {
    userId: "atlas-nodes",
    displayName: "Atlas Nodes",
    avatarColor: "linear-gradient(135deg, #7fffd4, #3d7afe)",
    rank: 3,
    points: 1040,
    change: -1,
    category: "Community rituals",
    highlight: "Hosted the most attended NFT gallery walk.",
  },
];

const STORYTELLER_ENTRIES: CommunityLeaderboardEntry[] = [
  {
    userId: "serena-l2",
    displayName: "Serena L2",
    avatarColor: "linear-gradient(135deg, #ff93ff, #7f5dff)",
    rank: 1,
    points: 980,
    change: 4,
    category: "Signal intelligence",
    highlight: "Published a viral thread about Base restaking couples.",
  },
  {
    userId: "zora-archives",
    displayName: "Zora Archives",
    avatarColor: "linear-gradient(135deg, #ffd76f, #ff8a8a)",
    rank: 2,
    points: 905,
    change: 0,
    category: "Culture curation",
    highlight: "Minted the fastest selling couple spotlight poster.",
  },
  {
    userId: "degen-duo",
    displayName: "Degen Duo",
    avatarColor: "linear-gradient(135deg, #00d1ff, #5f5bff)",
    rank: 3,
    points: 850,
    change: 1,
    category: "Referral energy",
    highlight: "Onboarded 48 new wallets via challenge referrals.",
  },
];

const COMMUNITY_LEADERBOARDS: CommunityLeaderboard[] = [
  {
    id: "connectors",
    title: "Top connectors",
    description: "Most impactful matchmakers driving onchain chemistry this week.",
    entries: CONNECTOR_ENTRIES,
  },
  {
    id: "storytellers",
    title: "Viral storytellers",
    description: "Creators turning couple wins into Base-native lore.",
    entries: STORYTELLER_ENTRIES,
  },
];

export function getCommunityLeaderboards(): CommunityLeaderboard[] {
  return COMMUNITY_LEADERBOARDS;
}
