"use client";

import { useCallback, useMemo, useState } from "react";

import {
  buildAchievementShareOptions,
  getCommunityLeaderboards,
  getReferralProgramStatus,
  getSocialAchievements,
  getSuccessStories,
  resolveAchievementBadge,
  type AchievementShareOption,
  type AchievementWithBadge,
  type CommunityLeaderboard,
  type ReferralProgramStatus,
  type SocialShareChannel,
  type SocialShareRecord,
  type SuccessStory,
} from "../../lib/social";

interface ShareCounts {
  [key: string]: number;
}

export interface SocialEngagementView {
  achievements: AchievementWithBadge[];
  shareOptions: Record<string, AchievementShareOption[]>;
  leaderboards: CommunityLeaderboard[];
  successStories: SuccessStory[];
  referral: ReferralProgramStatus;
  shareTotals: Record<string, number>;
  lastShare?: SocialShareRecord;
  shareAchievement: (achievementId: string, channel: SocialShareChannel) => void;
}

export function useSocialEngagement(): SocialEngagementView {
  const rawAchievements = useMemo(() => getSocialAchievements(), []);
  const achievements = useMemo<AchievementWithBadge[]>(
    () =>
      rawAchievements.map((achievement) => ({
        ...achievement,
        badge: resolveAchievementBadge(achievement),
      })),
    [rawAchievements],
  );

  const shareOptionsMap = useMemo(() => {
    const map = new Map<string, AchievementShareOption[]>();
    achievements.forEach((achievement) => {
      map.set(achievement.id, buildAchievementShareOptions(achievement));
    });
    return map;
  }, [achievements]);

  const shareOptions = useMemo(() => {
    const record: Record<string, AchievementShareOption[]> = {};
    shareOptionsMap.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [shareOptionsMap]);

  const leaderboards = useMemo(() => getCommunityLeaderboards(), []);
  const successStories = useMemo(() => getSuccessStories(), []);
  const referral = useMemo(() => getReferralProgramStatus(), []);

  const [lastShare, setLastShare] = useState<SocialShareRecord>();
  const [shareCounts, setShareCounts] = useState<ShareCounts>({});

  const shareAchievement = useCallback(
    (achievementId: string, channel: SocialShareChannel) => {
      const options = shareOptionsMap.get(achievementId);
      if (!options) {
        return;
      }
      const option = options.find((entry) => entry.channel === channel);
      if (!option) {
        return;
      }

      const record: SocialShareRecord = {
        achievementId,
        channel,
        message: option.message,
        timestamp: Date.now(),
      };

      setLastShare(record);
      const key = `${achievementId}:${channel}`;
      setShareCounts((current) => ({
        ...current,
        [key]: (current[key] ?? 0) + 1,
      }));

      if (channel === "copy" && typeof navigator !== "undefined" && navigator.clipboard) {
        void navigator.clipboard.writeText(option.message).catch(() => undefined);
      }
    },
    [shareOptionsMap],
  );

  const shareTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(shareCounts).forEach(([key, count]) => {
      const [achievementId] = key.split(":");
      totals[achievementId] = (totals[achievementId] ?? 0) + count;
    });
    return totals;
  }, [shareCounts]);

  return {
    achievements,
    shareOptions,
    leaderboards,
    successStories,
    referral,
    shareTotals,
    lastShare,
    shareAchievement,
  };
}
