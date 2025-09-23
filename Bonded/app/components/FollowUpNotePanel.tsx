"use client";

import { useEffect, useMemo, useState } from "react";

import type { ChatConnectionStatus } from "../hooks/useChatSession";
import type { FollowUpNoteRecord } from "../hooks/useFollowUpNotes";
import styles from "./FollowUpNotePanel.module.css";

interface FollowUpNotePanelProps {
  note: FollowUpNoteRecord | null;
  matchName: string;
  status: ChatConnectionStatus;
  onSave: (body: string) => void;
  onComplete: () => void;
  onReopen: () => void;
  onRemove: () => void;
}

const STATUS_COPY: Record<ChatConnectionStatus, string> = {
  connected: "Use a quick note to capture your next move without leaving the flow.",
  connecting: "Connection in progress — jot a reminder so nothing slips.",
  disconnected:
    "Chat is offline or capped. Leave yourself a follow-up so you know where to restart.",
};

export function FollowUpNotePanel({
  note,
  matchName,
  status,
  onSave,
  onComplete,
  onReopen,
  onRemove,
}: FollowUpNotePanelProps) {
  const [draft, setDraft] = useState<string>(note?.body ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);

  const isCompleted = note?.status === "completed";
  const normalizedDraft = draft.trim();
  const savedValue = note?.body ?? "";
  const hasChanges = normalizedDraft !== savedValue.trim();
  const canSave = normalizedDraft.length > 0 && hasChanges && !isCompleted;

  useEffect(() => {
    setDraft(note?.body ?? "");
    setFeedback(null);
  }, [note?.body, note?.status]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const helperCopy = useMemo(() => STATUS_COPY[status], [status]);

  const timelineLabel = useMemo(() => {
    if (!note) {
      return null;
    }

    if (note.status === "completed" && note.completedAt) {
      return `Marked done ${formatRelativeTime(note.completedAt)}`;
    }

    return `Updated ${formatRelativeTime(note.updatedAt)}`;
  }, [note]);

  const handleSave = () => {
    if (!normalizedDraft.length) {
      return;
    }

    onSave(draft);
    setFeedback("Follow-up note saved.");
  };

  const handleClear = () => {
    setDraft("");
    onRemove();
    setFeedback("Follow-up note cleared.");
  };

  const handleComplete = () => {
    onComplete();
    setFeedback("Task marked as completed.");
  };

  const handleReopen = () => {
    onReopen();
    setFeedback("Note reopened for editing.");
  };

  return (
    <section className={styles.container} aria-labelledby="follow-up-note-heading">
      <div className={styles.header}>
        <div>
          <h4 id="follow-up-note-heading" className={styles.title}>
            Follow-up note for {matchName}
          </h4>
          <p className={styles.helper}>{helperCopy}</p>
        </div>
        {isCompleted ? <span className={styles.statusBadge}>Completed</span> : null}
      </div>

      <textarea
        className={styles.textarea}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Capture the next action, context, or reminder."
        disabled={isCompleted}
      />

      <div className={styles.actions}>
        <div className={styles.meta}>
          {timelineLabel ? <span>{timelineLabel}</span> : <span>No note saved yet.</span>}
          {status === "disconnected" ? (
            <span className={styles.warning}>
              Token limit hit? Save the plan here and follow up once messages reset.
            </span>
          ) : null}
        </div>

        <div className={styles.buttons}>
          {isCompleted ? (
            <button type="button" className={styles.button} onClick={handleReopen}>
              Reopen note
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={handleClear}
                disabled={!savedValue}
              >
                Clear
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={handleComplete}
                disabled={!savedValue}
              >
                Mark completed
              </button>
            </>
          )}
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            Save note
          </button>
        </div>
      </div>

      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </section>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const absDiff = Math.abs(diff);

  const MINUTE = 60_000;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  if (absDiff < MINUTE) {
    return "just now";
  }

  if (absDiff < HOUR) {
    const minutes = Math.round(absDiff / MINUTE);
    return `${minutes} min ago`;
  }

  if (absDiff < DAY) {
    const hours = Math.round(absDiff / HOUR);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(absDiff / DAY);
  if (days <= 3) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(timestamp).toLocaleString();
}

