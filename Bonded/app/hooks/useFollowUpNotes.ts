"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type FollowUpNoteStatus = "open" | "completed";

export interface FollowUpNoteRecord {
  matchId: string;
  body: string;
  status: FollowUpNoteStatus;
  updatedAt: number;
  completedAt?: number;
}

type FollowUpNoteState = Record<string, FollowUpNoteRecord>;

const STORAGE_KEY = "bonded.followUpNotes.v1";

const isBrowser = () => typeof window !== "undefined";

function readStorage(): FollowUpNoteState {
  if (!isBrowser()) {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const entries = parsed as Record<string, Partial<FollowUpNoteRecord>>;
    const records: FollowUpNoteState = {};

    Object.entries(entries).forEach(([matchId, entry]) => {
      if (!entry || typeof entry !== "object") {
        return;
      }

      if (typeof entry.body !== "string") {
        return;
      }

      if (entry.status !== "open" && entry.status !== "completed") {
        return;
      }

      if (typeof entry.updatedAt !== "number") {
        return;
      }

      records[matchId] = {
        matchId,
        body: entry.body,
        status: entry.status,
        updatedAt: entry.updatedAt,
        completedAt:
          entry.status === "completed" && typeof entry.completedAt === "number"
            ? entry.completedAt
            : undefined,
      };
    });

    return records;
  } catch {
    return {};
  }
}

function persistStorage(state: FollowUpNoteState) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to persist follow-up notes", error);
  }
}

export interface UseFollowUpNotesResult {
  records: FollowUpNoteState;
  get: (matchId: string) => FollowUpNoteRecord | null;
  save: (matchId: string, body: string) => void;
  complete: (matchId: string) => void;
  reopen: (matchId: string) => void;
  remove: (matchId: string) => void;
}

export function useFollowUpNotes(): UseFollowUpNotesResult {
  const [records, setRecords] = useState<FollowUpNoteState>(() => readStorage());

  useEffect(() => {
    persistStorage(records);
  }, [records]);

  const save = useCallback((matchId: string, body: string) => {
    setRecords((current) => {
      const trimmed = body.trim();
      if (!trimmed) {
        if (!current[matchId]) {
          return current;
        }

        const { [matchId]: _removed, ...rest } = current;
        return rest;
      }

      const existing = current[matchId];
      const now = Date.now();

      return {
        ...current,
        [matchId]: {
          matchId,
          body: trimmed,
          status: existing?.status === "completed" ? "completed" : "open",
          updatedAt: now,
          completedAt:
            existing?.status === "completed"
              ? existing.completedAt ?? now
              : undefined,
        },
      };
    });
  }, []);

  const complete = useCallback((matchId: string) => {
    setRecords((current) => {
      const existing = current[matchId];
      if (!existing || existing.status === "completed") {
        return current;
      }

      const now = Date.now();
      return {
        ...current,
        [matchId]: {
          ...existing,
          status: "completed",
          completedAt: now,
          updatedAt: now,
        },
      };
    });
  }, []);

  const reopen = useCallback((matchId: string) => {
    setRecords((current) => {
      const existing = current[matchId];
      if (!existing || existing.status === "open") {
        return current;
      }

      return {
        ...current,
        [matchId]: {
          ...existing,
          status: "open",
          completedAt: undefined,
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  const remove = useCallback((matchId: string) => {
    setRecords((current) => {
      if (!current[matchId]) {
        return current;
      }

      const { [matchId]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const get = useCallback(
    (matchId: string) => records[matchId] ?? null,
    [records],
  );

  return useMemo(
    () => ({
      records,
      get,
      save,
      complete,
      reopen,
      remove,
    }),
    [complete, get, records, reopen, remove, save],
  );
}

