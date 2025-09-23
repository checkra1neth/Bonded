import {
  type BadgeAward,
  type BadgeDefinition,
  type BadgeProgressProjection,
  type ChallengeDefinition,
  type ChallengeParticipantState,
} from "./types";

export const BADGE_LIBRARY: BadgeDefinition[] = [
  {
    id: "base_field_captain",
    title: "Base Field Captain",
    description: "Close every loop in a weekly Base challenge with verified collaborators.",
    rarity: "core",
    icon: "🛡️",
    criteria: "Complete all coordination tasks during an active challenge week.",
  },
  {
    id: "coordination_catalyst",
    title: "Coordination Catalyst",
    description: "Catalyze cross-timezone teams and log three successful collaborations in one sprint.",
    rarity: "elite",
    icon: "🔄",
    criteria: "Finish all team-designated missions with at least two unique collaborators.",
  },
  {
    id: "signal_keeper",
    title: "Signal Keeper",
    description: "Maintain a three-day submission streak while shipping actionable market intelligence.",
    rarity: "elite",
    icon: "📡",
    criteria: "Log challenge progress on three consecutive days with supporting research notes.",
  },
  {
    id: "culture_curator",
    title: "Culture Curator",
    description: "Spotlight Base-native artists and rally a gallery crowd that leaves onchain reactions.",
    rarity: "core",
    icon: "🎨",
    criteria: "Host an NFT gallery walk and capture three proof-of-participation mints.",
  },
];

const byId = new Map(BADGE_LIBRARY.map((badge) => [badge.id, badge]));

const hasCompletedAllTasks = (
  challenge: ChallengeDefinition,
  participant: ChallengeParticipantState,
): boolean =>
  challenge.tasks.every((task) => participant.completedTaskIds.includes(task.id));

const hasTeamCollaborations = (participant: ChallengeParticipantState): boolean =>
  Object.values(participant.progress).some(
    (record) => record.contributions.some((entry) => (entry.collaborators?.length ?? 0) >= 2),
  );

const hasSubmissionStreak = (participant: ChallengeParticipantState, minimum: number): boolean =>
  participant.streak >= minimum;

const hasGalleryProofs = (participant: ChallengeParticipantState): boolean =>
  Object.values(participant.progress).some((record) =>
    record.contributions.some((entry) => entry.proofUrl?.includes("gallery")),
  );

export function calculateBadgeAwards(
  challenge: ChallengeDefinition,
  participants: ChallengeParticipantState[],
): BadgeAward[] {
  const awards: BadgeAward[] = [];
  const timestamp = Date.now();

  participants.forEach((participant) => {
    if (hasCompletedAllTasks(challenge, participant)) {
      awards.push({
        badgeId: "base_field_captain",
        userId: participant.userId,
        reason: "Completed every mission in the weekly coordination challenge",
        awardedAt: timestamp,
      });
    }

    if (hasTeamCollaborations(participant)) {
      awards.push({
        badgeId: "coordination_catalyst",
        userId: participant.userId,
        reason: "Activated multi-squad collaboration inside the Base challenge",
        awardedAt: timestamp,
      });
    }

    if (hasSubmissionStreak(participant, 3)) {
      awards.push({
        badgeId: "signal_keeper",
        userId: participant.userId,
        reason: "Maintained a three-day streak of actionable updates",
        awardedAt: timestamp,
      });
    }

    if (hasGalleryProofs(participant)) {
      awards.push({
        badgeId: "culture_curator",
        userId: participant.userId,
        reason: "Minted proof-of-attendance reactions from the Base gallery walk",
        awardedAt: timestamp,
      });
    }
  });

  return awards;
}

export function projectBadgeProgress(
  challenge: ChallengeDefinition,
  participant: ChallengeParticipantState,
): BadgeProgressProjection[] {
  const projections: BadgeProgressProjection[] = [];

  const totalTasks = challenge.tasks.length;
  const completed = participant.completedTaskIds.length;
  const percentAllTasks = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);
  projections.push({
    badgeId: "base_field_captain",
    percent: Math.min(percentAllTasks, 100),
    requirement: `${completed}/${totalTasks} missions complete`,
  });

  const teamProofs = Object.values(participant.progress).reduce((total, record) => {
    return (
      total +
      record.contributions.filter((entry) => (entry.collaborators?.length ?? 0) >= 2).length
    );
  }, 0);
  projections.push({
    badgeId: "coordination_catalyst",
    percent: Math.min(teamProofs * 40, 100),
    requirement: `${teamProofs} collaborative proofs logged`,
  });

  projections.push({
    badgeId: "signal_keeper",
    percent: Math.min(participant.streak * 30, 100),
    requirement: `${participant.streak}-day streak`,
  });

  const galleryProofs = Object.values(participant.progress).reduce((total, record) => {
    return total + record.contributions.filter((entry) => entry.proofUrl?.includes("gallery")).length;
  }, 0);
  projections.push({
    badgeId: "culture_curator",
    percent: Math.min(galleryProofs * 34, 100),
    requirement: `${galleryProofs} gallery reactions captured`,
  });

  return projections;
}

export function describeBadge(badgeId: string): BadgeDefinition | undefined {
  return byId.get(badgeId);
}
