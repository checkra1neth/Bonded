"use client";

import { useCallback, useMemo, useState } from "react";

import {
  buildLeaderboard,
  generateWeeklyChallenge,
  initializeParticipant,
  updateParticipantProgress,
} from "../../lib/gamification/challenges";
import { createWeeklyEventSchedule, planEventConnections } from "../../lib/gamification/events";
import {
  calculateBadgeAwards,
  describeBadge,
  projectBadgeProgress,
} from "../../lib/gamification/badges";
import type {
  BadgeAward,
  BadgeDefinition,
  BadgeProgressProjection,
  ChallengeDefinition,
  ChallengeEvent,
  ChallengeParticipantState,
  EventConnectionSuggestion,
} from "../../lib/gamification/types";

interface ChallengeHubState {
  challenge: ChallengeDefinition;
  participants: Record<string, ChallengeParticipantState>;
}

const selectWeekStart = (now: Date) => {
  const day = now.getUTCDay();
  const diff = (day + 6) % 7; // Monday anchor
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday;
};

const seedParticipants = (challenge: ChallengeDefinition): Record<string, ChallengeParticipantState> => {
  const seeker = initializeParticipant(challenge, {
    userId: "seeker",
    displayName: "Ava Protocol",
    avatarColor: "linear-gradient(135deg, #5f5bff, #00d1ff)",
    focusAreas: ["DeFi coordination", "strategy"],
    timezone: "UTC-5",
    strengths: ["liquidity design", "governance"],
    preferredRole: "strategist",
  });

  const nova = initializeParticipant(challenge, {
    userId: "nova",
    displayName: "Nova Yield",
    avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
    focusAreas: ["restaking", "automation"],
    timezone: "UTC",
    strengths: ["automation", "education"],
    preferredRole: "researcher",
  });

  const atlas = initializeParticipant(challenge, {
    userId: "atlas",
    displayName: "Atlas Nodes",
    avatarColor: "linear-gradient(135deg, #7fffd4, #3d7afe)",
    focusAreas: ["community rituals", "culture"],
    timezone: "UTC+8",
    strengths: ["community", "ops"],
    preferredRole: "host",
  });

  const serena = initializeParticipant(challenge, {
    userId: "serena",
    displayName: "Serena L2",
    avatarColor: "linear-gradient(135deg, #ff93ff, #7f5dff)",
    focusAreas: ["DeFi coordination", "culture"],
    timezone: "UTC-6",
    strengths: ["research", "curation"],
    preferredRole: "curator",
  });

  const advanceTask = (
    participant: ChallengeParticipantState,
    taskId: string,
    amount: number,
    collaborators?: string[],
    proofUrl?: string,
  ) => {
    let current = participant;
    for (let index = 0; index < amount; index += 1) {
      current = updateParticipantProgress(challenge, current, {
        taskId,
        amount: 1,
        collaborators,
        proofUrl: proofUrl ? `${proofUrl}-${index}` : undefined,
      });
    }
    return current;
  };

  const seededNova = advanceTask(nova, challenge.tasks[0]!.id, 3, [seeker.userId, atlas.userId]);
  const seededSerena = advanceTask(
    serena,
    challenge.tasks[1]!.id,
    2,
    [seeker.userId, nova.userId, atlas.userId],
    "https://gallery/proof",
  );
  const seededAtlas = advanceTask(atlas, challenge.tasks[2]!.id, 2, [serena.userId], "https://gallery/reaction");

  return {
    [seeker.userId]: seeker,
    [nova.userId]: seededNova,
    [atlas.userId]: seededAtlas,
    [serena.userId]: seededSerena,
  };
};

export interface ChallengeHubView {
  challenge: ChallengeDefinition;
  me: ChallengeParticipantState;
  leaderboard: ReturnType<typeof buildLeaderboard>;
  events: ChallengeEvent[];
  connections: EventConnectionSuggestion[];
  badgeAwards: BadgeAward[];
  badgeDetails: Record<string, BadgeDefinition>;
  projectedBadges: BadgeProgressProjection[];
  logProgress: (taskId: string) => void;
}

export function useChallengeHub(): ChallengeHubView {
  const challenge = useMemo(() => {
    const now = new Date();
    const weekStart = selectWeekStart(now);
    return generateWeeklyChallenge({
      weekStart,
      focusAreas: ["DeFi coordination", "Community rituals"],
      trendingNarratives: ["restaking", "builder diplomacy"],
      featuredProtocols: ["Aerodrome", "BasePaint"],
      communitySpotlight: "Base Study Hall",
    });
  }, []);

  const [state, setState] = useState<ChallengeHubState>(() => ({
    challenge,
    participants: seedParticipants(challenge),
  }));

  const participants = useMemo(
    () => Object.values(state.participants),
    [state.participants],
  );

  const leaderboard = useMemo(() => buildLeaderboard(participants), [participants]);

  const events = useMemo(
    () => createWeeklyEventSchedule(challenge, participants),
    [challenge, participants],
  );

  const connections = useMemo(() => {
    const suggestions: EventConnectionSuggestion[] = [];
    events.forEach((event) => {
      const planned = planEventConnections(event, participants);
      suggestions.push(...planned.slice(0, 2));
    });
    return suggestions;
  }, [events, participants]);

  const badgeAwards = useMemo(
    () => calculateBadgeAwards(challenge, participants),
    [challenge, participants],
  );

  const badgeDetails = useMemo(() => {
    const details: Record<string, BadgeDefinition> = {};
    badgeAwards.forEach((award) => {
      const badge = describeBadge(award.badgeId);
      if (badge) {
        details[award.badgeId] = badge;
      }
    });
    return details;
  }, [badgeAwards]);

  const me = state.participants.seeker;

  const projectedBadges = useMemo(() => {
    if (!me) {
      return [];
    }
    return projectBadgeProgress(challenge, me);
  }, [challenge, me]);

  const logProgress = useCallback(
    (taskId: string) => {
      setState((current) => {
        const participant = current.participants.seeker;
        if (!participant) {
          return current;
        }
        const task = challenge.tasks.find((entry) => entry.id === taskId);
        if (!task) {
          return current;
        }
        const updated = updateParticipantProgress(challenge, participant, {
          taskId,
          amount: 1,
          collaborators: ["nova", "atlas"],
          proofUrl: task.type === "nft" ? "https://gallery/reaction" : undefined,
        });
        if (updated === participant) {
          return current;
        }
        return {
          ...current,
          participants: {
            ...current.participants,
            seeker: updated,
          },
        };
      });
    },
    [challenge],
  );

  return {
    challenge,
    me: me ?? seedParticipants(challenge).seeker,
    leaderboard,
    events,
    connections,
    badgeAwards,
    badgeDetails,
    projectedBadges,
    logProgress,
  };
}
