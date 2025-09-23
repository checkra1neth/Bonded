import { describe, expect, it } from "vitest";

import {
  buildLeaderboard,
  generateWeeklyChallenge,
  initializeParticipant,
  planEventConnections,
  updateParticipantProgress,
  createWeeklyEventSchedule,
} from "../";
import { calculateBadgeAwards, describeBadge, projectBadgeProgress } from "../badges";
import type { ChallengeParticipantState } from "../types";

const monday = new Date("2024-10-07T00:00:00Z");

const challenge = generateWeeklyChallenge({
  weekStart: monday,
  focusAreas: ["DeFi coordination", "Community rituals"],
  trendingNarratives: ["restaking"],
  featuredProtocols: ["Aerodrome", "BasePaint"],
  communitySpotlight: "Base Study Hall",
  difficulty: "intermediate",
});

const seekerProfile = {
  userId: "ava",
  displayName: "Ava Protocol",
  avatarColor: "linear-gradient(135deg, #5f5bff, #00d1ff)",
  focusAreas: ["DeFi coordination", "strategy"],
  timezone: "UTC-5",
  strengths: ["liquidity design", "governance"],
  preferredRole: "strategist" as const,
};

function seedParticipant(
  base: ChallengeParticipantState,
  taskId: string,
  amount: number,
  collaborators?: string[],
  proofUrl?: string,
) {
  let next = base;
  for (let index = 0; index < amount; index += 1) {
    next = updateParticipantProgress(challenge, next, {
      taskId,
      amount: 1,
      collaborators,
      proofUrl: proofUrl ? `${proofUrl}-${index}` : undefined,
    });
  }
  return next;
}

describe("weekly challenge generation", () => {
  it("builds a themed challenge with focus-specific tasks", () => {
    expect(challenge.title).toContain("2024-10-07");
    expect(challenge.theme).toContain("DeFi coordination");
    expect(challenge.tasks).toHaveLength(3);
    expect(challenge.tasks[0]?.focusAreas).toContain("DeFi coordination");
    expect(challenge.tasks[1]?.summary).toContain("restaking");
  });
});

describe("participant progress tracking", () => {
  const baseParticipant = initializeParticipant(challenge, seekerProfile);
  const firstTask = challenge.tasks[0]!;

  it("initializes empty progress records for every task", () => {
    expect(Object.keys(baseParticipant.progress)).toHaveLength(challenge.tasks.length);
    expect(baseParticipant.progress[firstTask.id]?.status).toBe("not_started");
  });

  it("increments progress and awards experience as tasks are advanced", () => {
    const updated = updateParticipantProgress(challenge, baseParticipant, {
      taskId: firstTask.id,
      amount: 1,
      note: "Coordinated first LP hop",
      collaborators: ["nova"],
    });

    const record = updated.progress[firstTask.id];
    expect(record?.completed).toBe(1);
    expect(record?.status).toBe("in_progress");
    expect(updated.xp).toBeGreaterThan(0);

    const completed = seedParticipant(updated, firstTask.id, firstTask.target.goal - 1, ["nova", "atlas"], "https://gallery/proof");
    const finalRecord = completed.progress[firstTask.id];
    expect(finalRecord?.status).toBe("complete");
    expect(completed.completedTaskIds).toContain(firstTask.id);
  });
});

describe("leaderboard and badge logic", () => {
  const base = initializeParticipant(challenge, seekerProfile);
  const collaborator = initializeParticipant(challenge, {
    userId: "nova",
    displayName: "Nova Yield",
    avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
    focusAreas: ["DeFi coordination", "restaking"],
    timezone: "UTC+0",
    strengths: ["automation", "community"],
  });

  let advanced = seedParticipant(
    base,
    challenge.tasks[0]!.id,
    challenge.tasks[0]!.target.goal,
    ["nova", "atlas"],
  );
  advanced = seedParticipant(
    advanced,
    challenge.tasks[1]!.id,
    challenge.tasks[1]!.target.goal,
    ["nova", "atlas", "serena"],
  );
  advanced = seedParticipant(
    advanced,
    challenge.tasks[2]!.id,
    challenge.tasks[2]!.target.goal,
    ["serena"],
    "https://gallery/proof",
  );
  const collaboratorAdvanced = seedParticipant(
    collaborator,
    challenge.tasks[1]!.id,
    challenge.tasks[1]!.target.goal,
    ["ava", "atlas", "serena"],
  );

  const leaderboard = buildLeaderboard([advanced, collaboratorAdvanced]);

  it("orders participants by points then streak and completions", () => {
    expect(leaderboard[0]?.points).toBeGreaterThanOrEqual(leaderboard[1]?.points ?? 0);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(["up", "steady", "new"]).toContain(leaderboard[0]?.trend);
  });

  it("calculates badge awards and projections", () => {
    const awards = calculateBadgeAwards(challenge, [advanced, collaboratorAdvanced]);
    expect(awards.length).toBeGreaterThan(0);
    const captainBadge = awards.find((award) => award.badgeId === challenge.rewards.badgeId);
    expect(captainBadge?.userId).toBe(advanced.userId);

    const projections = projectBadgeProgress(challenge, collaboratorAdvanced);
    const catalystProjection = projections.find((projection) => projection.badgeId === "coordination_catalyst");
    expect(catalystProjection?.percent).toBeGreaterThan(0);
    expect(describeBadge("signal_keeper")?.icon).toBe("📡");
  });
});

describe("event planning and connection facilitation", () => {
  const participants = [
    initializeParticipant(challenge, seekerProfile),
    initializeParticipant(challenge, {
      userId: "atlas",
      displayName: "Atlas Nodes",
      focusAreas: ["Community rituals", "culture"],
      timezone: "UTC+8",
      strengths: ["community", "curation"],
    }),
    initializeParticipant(challenge, {
      userId: "serena",
      displayName: "Serena L2",
      focusAreas: ["DeFi coordination", "culture"],
      timezone: "UTC-6",
      strengths: ["research", "ops"],
    }),
  ];

  const schedule = createWeeklyEventSchedule(challenge, participants);

  it("creates a multi-event schedule aligned to challenge focus", () => {
    expect(schedule).toHaveLength(3);
    expect(schedule[0]?.focusAreas[0]).toBe("DeFi coordination");
    expect(schedule[1]?.type).toBe("nft_gallery_walk");
  });

  it("pairs attendees with complementary strengths for events", () => {
    const suggestions = planEventConnections(schedule[1]!, participants);
    expect(suggestions.length).toBeGreaterThan(0);
    const pairing = suggestions[0];
    expect(pairing.participants).toHaveLength(2);
    expect(pairing.reason).toContain("culture");
  });
});
