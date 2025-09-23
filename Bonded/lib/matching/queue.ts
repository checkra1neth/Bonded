import type { MatchCandidate, MatchDecision } from "./compatibility";

export interface MatchDecisionRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  decision: MatchDecision;
  compatibilityScore: number;
  categoryId: MatchCandidate["compatibilityScore"]["category"]["id"];
  mutual: boolean;
  response: MatchDecision | null;
  createdAt: number;
}

export interface MatchQueueEntry {
  candidate: MatchCandidate;
  status: "pending" | "decided";
  decision?: MatchDecisionRecord;
}

export interface MutualMatch {
  id: string;
  candidateId: string;
  displayName: string;
  decision: MatchDecision;
  response: MatchDecision;
  createdAt: number;
  categoryId: MatchCandidate["compatibilityScore"]["category"]["id"];
  compatibilityScore: number;
}

export type MatchNotificationType = "mutual-match";

export interface MatchNotification {
  id: string;
  type: MatchNotificationType;
  message: string;
  createdAt: number;
  read: boolean;
  data: {
    matchId: string;
    candidateId: string;
  };
}

export interface MatchQueueState {
  entries: MatchQueueEntry[];
  activeIndex: number;
  decisions: MatchDecisionRecord[];
  matches: MutualMatch[];
  notifications: MatchNotification[];
  exhausted: boolean;
}

export type MatchQueueAction =
  | { type: "DECIDE"; candidateId: string; decision: MatchDecision; timestamp?: number }
  | { type: "DISMISS_NOTIFICATION"; notificationId: string }
  | { type: "ENQUEUE"; candidates: MatchCandidate[]; timestamp?: number }
  | { type: "RESET"; candidates: MatchCandidate[] }
  | { type: "UNDO_LAST" };

const DECISION_PREFIX = "decision";
const MATCH_PREFIX = "match";
const NOTIFICATION_PREFIX = "notification";

const createIdentifier = (prefix: string, candidateId: string, timestamp: number) =>
  `${prefix}_${candidateId}_${timestamp}`;

const getNextActiveIndex = (entries: MatchQueueEntry[]): number => {
  const index = entries.findIndex((entry) => entry.status === "pending");
  return index === -1 ? -1 : index;
};

const evaluateMutualMatch = (
  candidate: MatchCandidate,
  decision: MatchDecision,
): { mutual: boolean; response: MatchDecision | null } => {
  if (decision === "pass") {
    return { mutual: false, response: null };
  }

  const interaction = candidate.interaction;
  if (!interaction) {
    return { mutual: false, response: null };
  }

  if (interaction.initialDecision && interaction.initialDecision !== "pass") {
    return { mutual: true, response: interaction.initialDecision };
  }

  const autoResponse = interaction.autoResponse;
  if (!autoResponse) {
    return { mutual: false, response: null };
  }

  const response =
    decision === "super"
      ? autoResponse.onSuperLike ?? autoResponse.onLike ?? "pass"
      : autoResponse.onLike ?? "pass";

  if (!response || response === "pass") {
    return { mutual: false, response: null };
  }

  return { mutual: true, response };
};

export function createMatchQueueState(candidates: MatchCandidate[]): MatchQueueState {
  const entries = candidates.map((candidate) => ({
    candidate,
    status: "pending" as const,
  }));

  const activeIndex = entries.length ? getNextActiveIndex(entries) : -1;

  return {
    entries,
    activeIndex,
    decisions: [],
    matches: [],
    notifications: [],
    exhausted: entries.length === 0,
  };
}

export function matchQueueReducer(
  state: MatchQueueState,
  action: MatchQueueAction,
): MatchQueueState {
  switch (action.type) {
    case "DECIDE": {
      const entryIndex = state.entries.findIndex(
        (entry) => entry.candidate.user.id === action.candidateId,
      );

      if (entryIndex === -1) {
        return state;
      }

      const entry = state.entries[entryIndex];
      if (entry.status === "decided") {
        return state;
      }

      const timestamp = action.timestamp ?? Date.now();
      const candidate = entry.candidate;
      const { mutual, response } = evaluateMutualMatch(candidate, action.decision);

      const decisionRecord: MatchDecisionRecord = {
        id: createIdentifier(DECISION_PREFIX, candidate.user.id, timestamp),
        candidateId: candidate.user.id,
        candidateName: candidate.user.displayName,
        decision: action.decision,
        compatibilityScore: candidate.compatibilityScore.overall,
        categoryId: candidate.compatibilityScore.category.id,
        mutual,
        response: mutual && response ? response : null,
        createdAt: timestamp,
      };

      const entries = state.entries.map((existing, index) =>
        index === entryIndex
          ? { candidate: existing.candidate, status: "decided", decision: decisionRecord }
          : existing,
      );

      const decisions = [...state.decisions, decisionRecord];

      let matches = state.matches;
      let notifications = state.notifications;

      if (mutual && response) {
        const match: MutualMatch = {
          id: createIdentifier(MATCH_PREFIX, candidate.user.id, timestamp),
          candidateId: candidate.user.id,
          displayName: candidate.user.displayName,
          decision: action.decision,
          response,
          createdAt: timestamp,
          categoryId: candidate.compatibilityScore.category.id,
          compatibilityScore: candidate.compatibilityScore.overall,
        };

        matches = [...state.matches, match];
        const notification: MatchNotification = {
          id: createIdentifier(NOTIFICATION_PREFIX, candidate.user.id, timestamp),
          type: "mutual-match",
          message: `You and ${candidate.user.displayName} are a match!`,
          createdAt: timestamp,
          read: false,
          data: {
            matchId: match.id,
            candidateId: candidate.user.id,
          },
        };
        notifications = [...state.notifications, notification];
      }

      const nextActiveIndex = getNextActiveIndex(entries);
      const exhausted = nextActiveIndex === -1;

      return {
        entries,
        activeIndex: exhausted ? -1 : nextActiveIndex,
        decisions,
        matches,
        notifications,
        exhausted,
      };
    }

    case "DISMISS_NOTIFICATION": {
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.notificationId,
        ),
      };
    }

    case "ENQUEUE": {
      if (!action.candidates.length) {
        return state;
      }

      const entries = [
        ...state.entries,
        ...action.candidates.map((candidate) => ({ candidate, status: "pending" as const })),
      ];

      const exhaustedBefore = state.exhausted;
      const nextActiveIndex = exhaustedBefore
        ? state.entries.length
        : state.activeIndex === -1
        ? getNextActiveIndex(entries)
        : state.activeIndex;

      return {
        ...state,
        entries,
        activeIndex: nextActiveIndex,
        exhausted: false,
      };
    }

    case "RESET": {
      return createMatchQueueState(action.candidates);
    }

    case "UNDO_LAST": {
      const lastDecision = state.decisions[state.decisions.length - 1];
      if (!lastDecision) {
        return state;
      }

      const entryIndex = state.entries.findIndex(
        (entry) => entry.candidate.user.id === lastDecision.candidateId,
      );

      if (entryIndex === -1) {
        return state;
      }

      const entries = state.entries.map((entry, index) => {
        if (index !== entryIndex) {
          return entry;
        }
        return {
          candidate: entry.candidate,
          status: "pending" as const,
        } satisfies MatchQueueEntry;
      });

      const decisions = state.decisions.slice(0, -1);

      const matches = state.matches.filter(
        (match) =>
          !(match.candidateId === lastDecision.candidateId && match.createdAt === lastDecision.createdAt),
      );

      const notifications = state.notifications.filter(
        (notification) =>
          !(
            notification.data.candidateId === lastDecision.candidateId &&
            notification.createdAt === lastDecision.createdAt
          ),
      );

      const exhausted = entries.every((entry) => entry.status === "decided");

      return {
        entries,
        activeIndex: exhausted ? -1 : entryIndex,
        decisions,
        matches,
        notifications,
        exhausted,
      };
    }

    default:
      return state;
  }
}
