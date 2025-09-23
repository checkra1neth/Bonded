import {
  type ChallengeDefinition,
  type ChallengeParticipantProfile,
  type ChallengeParticipantState,
  type ChallengeRewardDefinition,
  type ChallengeTaskDefinition,
  type ChallengeTaskTarget,
  type ChallengeTaskType,
  type LeaderboardEntry,
  type LeaderboardTrend,
  type TaskProgressRecord,
  type TaskProgressStatus,
} from "./types";

interface GenerateWeeklyChallengeOptions {
  weekStart: Date;
  focusAreas: string[];
  trendingNarratives: string[];
  featuredProtocols: string[];
  communitySpotlight: string;
  difficulty?: ChallengeDefinition["difficulty"];
}

interface TaskBlueprint {
  title: string;
  summary: string;
  type: ChallengeTaskType;
  focusAreas: string[];
  category: "solo" | "team";
  target: ChallengeTaskTarget;
  points: number;
  verification: ChallengeTaskDefinition["verification"];
  bonus?: ChallengeTaskDefinition["bonus"];
}

const WEEK_IN_DAYS = 7;

const formatWeek = (date: Date) => {
  const iso = date.toISOString().slice(0, 10);
  return iso;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toTaskId = (slug: string, index: number) => `${slug}-task-${index + 1}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const trendForParticipant = (participant: ChallengeParticipantState): LeaderboardTrend => {
  if (!participant.lastSubmissionAt) {
    return "new";
  }
  if (participant.streak >= 3) {
    return "up";
  }
  return "steady";
};

const createTask = (slug: string, blueprint: TaskBlueprint, index: number): ChallengeTaskDefinition => ({
  ...blueprint,
  id: toTaskId(slug, index),
});

export function generateWeeklyChallenge({
  weekStart,
  focusAreas,
  trendingNarratives,
  featuredProtocols,
  communitySpotlight,
  difficulty = "intermediate",
}: GenerateWeeklyChallengeOptions): ChallengeDefinition {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = addDays(start, WEEK_IN_DAYS - 1);

  const primaryFocus = focusAreas[0] ?? "DeFi";
  const secondaryFocus = focusAreas[1] ?? "Community";
  const primaryProtocol = featuredProtocols[0] ?? "Aerodrome";
  const secondaryProtocol = featuredProtocols[1] ?? "BaseSwap";
  const trendingHook = trendingNarratives[0] ?? "restaking";

  const slug = `week-${formatWeek(start)}`;
  const title = `Base Challenge • Week of ${formatWeek(start)}`;
  const theme = `${primaryFocus} x ${secondaryFocus} coordination`;

  const tasks: ChallengeTaskDefinition[] = [
    createTask(
      slug,
      {
        title: `${primaryProtocol} liquidity relay`,
        summary: `Spin up a progressive liquidity train using ${primaryProtocol} vaults and sync notes with the ${communitySpotlight} crew.`,
        type: "defi",
        focusAreas: [primaryFocus, trendingHook],
        category: "team",
        target: {
          kind: "collaboration",
          goal: 3,
          cadence: "weekly",
          minimumCollaborators: 2,
        },
        points: 120,
        verification: {
          method: "transaction",
          detail: "Submit vault tx hashes and shared playbook link",
        },
        bonus: {
          description: `Loop in a new Base address for a +${30} point kicker`,
          points: 30,
        },
      },
      0,
    ),
    createTask(
      slug,
      {
        title: `${trendingHook.toUpperCase()} signal sprint`,
        summary: `Host a micro study pod unpacking ${trendingHook} on Base and produce a 3-bullet market pulse.`,
        type: "education",
        focusAreas: [secondaryFocus, trendingHook],
        category: "team",
        target: {
          kind: "actions",
          goal: 2,
          cadence: "weekly",
          minimumCollaborators: 3,
        },
        points: 90,
        verification: {
          method: "submission",
          detail: "Attach meeting recording + shared doc",
        },
        bonus: {
          description: "Publish recap onchain for an extra 20 points",
          points: 20,
        },
      },
      1,
    ),
    createTask(
      slug,
      {
        title: `${secondaryProtocol} culture walk`,
        summary: `Curate a Base-native NFT gallery walk highlighting three creators and capture reactions from attendees.`,
        type: "nft",
        focusAreas: [secondaryFocus, "culture"],
        category: "solo",
        target: {
          kind: "actions",
          goal: 3,
          cadence: "weekly",
        },
        points: 75,
        verification: {
          method: "host_confirmation",
          detail: "Mint recap or host confirmation via Farcaster frame",
        },
      },
      2,
    ),
  ];

  const rewards: ChallengeRewardDefinition = {
    badgeId: "base_field_captain",
    perks: [
      "Front-row slot in Base community calls",
      "Priority matching for challenge collaborators",
      "Profile spotlight in weekly recap",
    ],
    spotlight: `${communitySpotlight} contributors who close the loop on coordination`,
  };

  return {
    id: `challenge-${slug}`,
    slug,
    title,
    theme,
    summary: `Weekly coordination mission threading ${primaryFocus}, ${secondaryFocus}, and ${trendingHook} momentum across Base.`,
    difficulty,
    focusAreas,
    trendingNarratives,
    featuredProtocols,
    communitySpotlight,
    weekOf: formatWeek(start),
    startsAt: start,
    endsAt: end,
    tasks,
    rewards,
  };
}

const createEmptyProgress = (task: ChallengeTaskDefinition): TaskProgressRecord => ({
  taskId: task.id,
  completed: 0,
  target: task.target.goal,
  status: "not_started",
  percentComplete: 0,
  contributions: [],
  lastUpdated: null,
});

export function initializeParticipant(
  challenge: ChallengeDefinition,
  profile: ChallengeParticipantProfile,
  overrides: Partial<ChallengeParticipantState> = {},
): ChallengeParticipantState {
  const progress: Record<string, TaskProgressRecord> = {};
  challenge.tasks.forEach((task) => {
    progress[task.id] = createEmptyProgress(task);
  });

  return {
    ...profile,
    xp: overrides.xp ?? 0,
    streak: overrides.streak ?? 0,
    completedTaskIds: overrides.completedTaskIds ?? [],
    progress: overrides.progress ?? progress,
    badges: overrides.badges ?? [],
    lastSubmissionAt: overrides.lastSubmissionAt,
    tier: overrides.tier ?? challenge.difficulty,
  };
}

export interface TaskProgressUpdate {
  taskId: string;
  amount?: number;
  note?: string;
  proofUrl?: string;
  collaborators?: string[];
  timestamp?: number;
}

const createContribution = (update: TaskProgressUpdate, timestamp: number) => ({
  amount: update.amount ?? 1,
  note: update.note,
  timestamp,
  proofUrl: update.proofUrl,
  collaborators: update.collaborators,
});

const statusForProgress = (completed: number, target: number): TaskProgressStatus => {
  if (completed <= 0) {
    return "not_started";
  }
  if (completed >= target) {
    return "complete";
  }
  return "in_progress";
};

const calculatePercent = (completed: number, target: number) => {
  if (!target) {
    return 1;
  }
  return clamp(completed / target, 0, 1);
};

const updateStreak = (participant: ChallengeParticipantState, timestamp: number): number => {
  if (!participant.lastSubmissionAt) {
    return 1;
  }
  const previous = new Date(participant.lastSubmissionAt);
  const current = new Date(timestamp);
  const diff = current.getUTCDate() - previous.getUTCDate();
  if (diff === 0) {
    return participant.streak;
  }
  if (diff === 1 || Math.abs(current.getTime() - previous.getTime()) <= 1000 * 60 * 60 * 36) {
    return participant.streak + 1;
  }
  return 1;
};

export function updateParticipantProgress(
  challenge: ChallengeDefinition,
  participant: ChallengeParticipantState,
  update: TaskProgressUpdate,
): ChallengeParticipantState {
  const task = challenge.tasks.find((entry) => entry.id === update.taskId);
  if (!task) {
    throw new Error(`Unknown task: ${update.taskId}`);
  }

  const timestamp = update.timestamp ?? Date.now();
  const currentProgress = participant.progress[task.id] ?? createEmptyProgress(task);
  const increment = update.amount ?? 1;
  if (increment <= 0 || currentProgress.completed >= currentProgress.target) {
    return participant;
  }

  const nextCompleted = clamp(currentProgress.completed + increment, 0, currentProgress.target);
  if (nextCompleted === currentProgress.completed) {
    return participant;
  }

  const nextStatus = statusForProgress(nextCompleted, currentProgress.target);
  const nextPercent = calculatePercent(nextCompleted, currentProgress.target);
  const contribution = createContribution(update, timestamp);

  const xpGain = Math.round((task.points * (nextCompleted - currentProgress.completed)) / currentProgress.target);

  const completedTaskIds = participant.completedTaskIds.includes(task.id)
    ? participant.completedTaskIds
    : nextStatus === "complete"
    ? [...participant.completedTaskIds, task.id]
    : participant.completedTaskIds;

  const nextProgress: TaskProgressRecord = {
    ...currentProgress,
    completed: nextCompleted,
    status: nextStatus,
    percentComplete: nextPercent,
    contributions: [...currentProgress.contributions, contribution],
    lastUpdated: timestamp,
  };

  const nextProgressMap: Record<string, TaskProgressRecord> = {
    ...participant.progress,
    [task.id]: nextProgress,
  };

  return {
    ...participant,
    xp: participant.xp + xpGain,
    streak: updateStreak(participant, timestamp),
    completedTaskIds,
    progress: nextProgressMap,
    lastSubmissionAt: timestamp,
  };
}

export function buildLeaderboard(participants: ChallengeParticipantState[]): LeaderboardEntry[] {
  const sorted = [...participants].sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    if (b.completedTaskIds.length !== a.completedTaskIds.length) {
      return b.completedTaskIds.length - a.completedTaskIds.length;
    }
    if (b.streak !== a.streak) {
      return b.streak - a.streak;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return sorted.map((participant, index) => ({
    userId: participant.userId,
    displayName: participant.displayName,
    points: participant.xp,
    streak: participant.streak,
    completedTasks: participant.completedTaskIds.length,
    rank: index + 1,
    trend: trendForParticipant(participant),
    focusAreas: participant.focusAreas,
  }));
}
