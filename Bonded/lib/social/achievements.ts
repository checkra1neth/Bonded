import { describeBadge } from "../gamification/badges";
import type { AchievementShareOption, SocialAchievement } from "./types";

const SHARE_BASE_URL = "https://bonded.fun/achievements";

const ACHIEVEMENTS: SocialAchievement[] = [
  {
    id: "base-field-captain",
    badgeId: "base_field_captain",
    title: "Challenge Closer",
    description: "Completed every mission in a Base community coordination sprint.",
    narrative: "Closed the coordination loop with a 100% completion rate and rallied the squad for hand-offs.",
    earnedAt: new Date("2024-10-05T18:30:00Z").getTime(),
    rarity: "core",
    category: "challenge",
    spotlight: "Finished the Base coordination playbook with receipts for every task.",
  },
  {
    id: "coordination-catalyst",
    badgeId: "coordination_catalyst",
    title: "Collaboration Catalyst",
    description: "Activated multi-timezone contributors inside a weekly challenge.",
    narrative: "Spun up three async pods and shipped proof-of-work updates before the retro.",
    earnedAt: new Date("2024-09-27T02:15:00Z").getTime(),
    rarity: "elite",
    category: "community",
    spotlight: "Orchestrated collaborators across Base, Farcaster, and onchain tasks.",
  },
  {
    id: "signal-keeper",
    badgeId: "signal_keeper",
    title: "Signal Keeper",
    description: "Maintained a streak of actionable updates for the community feed.",
    narrative: "Posted three consecutive days of market intelligence that guided match recommendations.",
    earnedAt: new Date("2024-09-14T14:00:00Z").getTime(),
    rarity: "elite",
    category: "referral",
    spotlight: "Kept the compatibility graph refreshed with timely Base network signals.",
  },
];

export function getSocialAchievements(): SocialAchievement[] {
  return ACHIEVEMENTS;
}

export function formatAchievementShareMessage(achievement: SocialAchievement): string {
  return `Unlocked ${achievement.title} on Bonded · ${achievement.narrative}`;
}

export function buildAchievementShareOptions(achievement: SocialAchievement): AchievementShareOption[] {
  const shareUrl = `${SHARE_BASE_URL}/${achievement.id}`;
  const message = `${formatAchievementShareMessage(achievement)} ${shareUrl}`.trim();
  const encodedMessage = encodeURIComponent(message);

  return [
    {
      channel: "warpcast",
      label: "Share to Warpcast",
      url: `https://warpcast.com/~/compose?text=${encodedMessage}`,
      message,
      analyticsTag: `${achievement.id}-warpcast`,
    },
    {
      channel: "lens",
      label: "Share to Lens",
      url: `https://hey.xyz/?text=${encodedMessage}`,
      message,
      analyticsTag: `${achievement.id}-lens`,
    },
    {
      channel: "x",
      label: "Share to X",
      url: `https://x.com/intent/post?text=${encodedMessage}`,
      message,
      analyticsTag: `${achievement.id}-x`,
    },
    {
      channel: "copy",
      label: "Copy link",
      url: shareUrl,
      message,
      analyticsTag: `${achievement.id}-copy`,
    },
  ];
}

export function resolveAchievementBadge(achievement: SocialAchievement) {
  return describeBadge(achievement.badgeId);
}
