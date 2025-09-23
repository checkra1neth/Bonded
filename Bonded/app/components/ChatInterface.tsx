"use client";

import { useEffect, useMemo, useState } from "react";

import type { MutualMatch } from "@/lib/matching/queue";
import type { MatchCandidate } from "@/lib/matching/compatibility";

import { useChatSession } from "../hooks/useChatSession";
import type { ChatParticipant } from "@/lib/chat/types";
import styles from "./ChatInterface.module.css";
import { FollowUpNotePanel } from "./FollowUpNotePanel";
import { useFollowUpNotes } from "../hooks/useFollowUpNotes";

interface ChatInterfaceProps {
  matches: MutualMatch[];
  seeker: ChatParticipant;
  candidatesById: Map<string, { candidate: MatchCandidate; portfolio?: unknown }>;
}

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
};

const EMPTY_STATE_MESSAGE = "Unlock a mutual match to start a conversation with shared alpha.";

export function ChatInterface({ matches, seeker, candidatesById }: ChatInterfaceProps) {
  const [activeId, setActiveId] = useState<string | null>(matches[0]?.id ?? null);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => b.createdAt - a.createdAt);
  }, [matches]);

  const activeMatch = useMemo(() => {
    if (!sortedMatches.length) {
      return null;
    }
    return sortedMatches.find((match) => match.id === activeId) ?? sortedMatches[0];
  }, [activeId, sortedMatches]);

  const peerCandidate = activeMatch
    ? candidatesById.get(activeMatch.candidateId)?.candidate ?? null
    : null;

  const peer: ChatParticipant | undefined = peerCandidate
    ? {
        userId: peerCandidate.user.id,
        displayName: peerCandidate.user.displayName,
        avatarColor: peerCandidate.user.avatarColor,
        role: "candidate",
      }
    : undefined;

  const { messages, typingUsers, status, sendMessage, notifyTyping } = useChatSession({
    conversationId: activeMatch?.id ?? null,
    participant: seeker,
    peer,
  });

  const {
    records: noteRecords,
    save: saveNote,
    complete: completeNote,
    reopen: reopenNote,
    remove: removeNote,
  } = useFollowUpNotes();
  const activeNote = activeMatch ? noteRecords[activeMatch.id] ?? null : null;

  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft("");
  }, [activeMatch?.id]);

  const isReady = status === "connected";
  const canSend = draft.trim().length > 0 && isReady;

  const activeTyping = typingUsers.filter((entry) => entry.userId !== seeker.userId);

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }
    sendMessage(draft.trim());
    setDraft("");
  };

  if (!sortedMatches.length) {
    return (
      <div className={styles.emptyState}>
        <h3>Chat</h3>
        <p>{EMPTY_STATE_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <h3>Chat</h3>
          <span className={styles.status} data-status={status}>
            {status === "connected"
              ? "Live"
              : status === "connecting"
              ? "Connecting"
              : "Offline"}
          </span>
        </div>
        <ul className={styles.matchList}>
          {sortedMatches.map((match) => {
            const candidate = candidatesById.get(match.candidateId)?.candidate;
            const isActive = match.id === activeMatch?.id;
            return (
              <li key={match.id}>
                <button
                  type="button"
                  className={`${styles.matchButton} ${isActive ? styles.matchButtonActive : ""}`}
                  onClick={() => setActiveId(match.id)}
                >
                  <span className={styles.avatar} style={{ background: candidate?.user.avatarColor }}>
                    {initials(candidate?.user.displayName ?? match.displayName)}
                  </span>
                  <div className={styles.matchMeta}>
                    <strong>{candidate?.user.displayName ?? match.displayName}</strong>
                    <span>{formatMatchDetail(match, candidate)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className={styles.chatPanel}>
        {activeMatch && peer ? (
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <span className={styles.avatar} style={{ background: peer.avatarColor }}>
                {initials(peer.displayName)}
              </span>
              <div>
                <strong>{peer.displayName}</strong>
                <span>{formatMatchDetail(activeMatch, peerCandidate ?? undefined)}</span>
              </div>
            </div>
            <span className={styles.matchBadge}>{Math.round(activeMatch.compatibilityScore * 100)}% match</span>
          </div>
        ) : null}

        <div className={styles.messageList}>
          {!messages.length ? (
            <div className={styles.emptyConversation}>
              <p>Break the ice with an on-chain themed opener.</p>
            </div>
          ) : (
            <ul>
              {messages.map((message) => (
                <li key={message.id} className={styles.messageRow} data-local={message.isLocal}>
                  <div className={styles.messageBubble}>
                    <p>{message.body}</p>
                    <div className={styles.messageMeta}>
                      <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
                      {message.isLocal ? (
                        <span>{STATUS_LABELS[message.status] ?? message.status}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeTyping.length ? (
          <div className={styles.typing}>
            {activeTyping.map((user) => (
              <span key={user.userId}>{user.displayName} is typing…</span>
            ))}
          </div>
        ) : null}

        <div className={styles.composer}>
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              notifyTyping();
            }}
            placeholder={isReady ? "Share your latest alpha" : "Connecting to chat"}
            disabled={!isReady}
          />
          <button type="button" onClick={handleSend} disabled={!canSend}>
            Send
          </button>
        </div>

        {activeMatch ? (
          <FollowUpNotePanel
            note={activeNote}
            matchName={peer?.displayName ?? activeMatch.displayName}
            status={status}
            onSave={(body) => saveNote(activeMatch.id, body)}
            onComplete={() => completeNote(activeMatch.id)}
            onReopen={() => reopenNote(activeMatch.id)}
            onRemove={() => removeNote(activeMatch.id)}
          />
        ) : null}
      </section>
    </div>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMatchDetail(match: MutualMatch, candidate?: MatchCandidate | null) {
  if (candidate) {
    return `${candidate.user.personality ?? ""} • ${Math.round(match.compatibilityScore * 100)}%`;
  }
  return `${Math.round(match.compatibilityScore * 100)}% compatibility`;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
