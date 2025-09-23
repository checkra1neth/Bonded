"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { MatchCandidate, MatchDecision } from "@/lib/matching/compatibility";
import {
  createMatchQueueState,
  matchQueueReducer,
  type MatchQueueState,
} from "@/lib/matching/queue";

export type UseMatchQueueResult = {
  state: MatchQueueState;
  activeCandidate: MatchCandidate | undefined;
  pendingCount: number;
  reviewedCount: number;
  decide: (candidateId: string, decision: MatchDecision) => void;
  dismissNotification: (notificationId: string) => void;
  enqueue: (candidates: MatchCandidate[]) => void;
  reset: (candidates: MatchCandidate[]) => void;
};

export function useMatchQueue(initialCandidates: MatchCandidate[]): UseMatchQueueResult {
  const [state, dispatch] = useReducer(
    matchQueueReducer,
    initialCandidates,
    createMatchQueueState,
  );

  const candidateIdsRef = useRef(initialCandidates.map((candidate) => candidate.user.id));

  useEffect(() => {
    const nextIds = initialCandidates.map((candidate) => candidate.user.id);
    const hasChanged =
      nextIds.length !== candidateIdsRef.current.length ||
      nextIds.some((id, index) => id !== candidateIdsRef.current[index]);

    if (hasChanged) {
      candidateIdsRef.current = nextIds;
      dispatch({ type: "RESET", candidates: initialCandidates });
    }
  }, [initialCandidates]);

  const decide = useCallback((candidateId: string, decision: MatchDecision) => {
    dispatch({ type: "DECIDE", candidateId, decision });
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    dispatch({ type: "DISMISS_NOTIFICATION", notificationId });
  }, []);

  const enqueue = useCallback((candidates: MatchCandidate[]) => {
    if (candidates.length) {
      dispatch({ type: "ENQUEUE", candidates });
    }
  }, []);

  const reset = useCallback((candidates: MatchCandidate[]) => {
    dispatch({ type: "RESET", candidates });
  }, []);

  const activeCandidate =
    state.activeIndex >= 0 ? state.entries[state.activeIndex]?.candidate : undefined;

  const pendingCount = useMemo(
    () => state.entries.filter((entry) => entry.status === "pending").length,
    [state.entries],
  );

  const reviewedCount = state.entries.length - pendingCount;

  return {
    state,
    activeCandidate,
    pendingCount,
    reviewedCount,
    decide,
    dismissNotification,
    enqueue,
    reset,
  };
}
