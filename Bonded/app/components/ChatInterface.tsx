"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { MutualMatch } from "@/lib/matching/queue";
import type {
  CompatibilityProfile,
  MatchCandidate,
} from "@/lib/matching/compatibility";
import {
  planBasePayGift,
  planChallengeInvitation,
  planPortfolioSnippet,
  planReaction,
  planVoiceNote,
  type BasePayGiftPlanInput,
  type ChallengePlanInput,
  type ChallengeTemplate,
  type ReactionPlanInput,
  type VoiceNotePlanInput,
} from "@/lib/chat/advancedMessages";
import { extractReactions } from "@/lib/chat/reactions";
import type { ChatParticipant } from "@/lib/chat/types";
import type {
  ActivityVisibilityLevel,
  PortfolioPrivacyPreferencesInput,
  PortfolioVisibilityLevel,
} from "@/lib/portfolio/privacy";

import { useChatSession } from "../hooks/useChatSession";
import type { ChatMessageView } from "../hooks/useChatSession";
import { useFollowUpNotes } from "../hooks/useFollowUpNotes";
import { FollowUpNotePanel } from "./FollowUpNotePanel";
import styles from "./ChatInterface.module.css";

interface ChatInterfaceProps {
  matches: MutualMatch[];
  seeker: ChatParticipant;
  seekerPortfolio: CompatibilityProfile["portfolio"];
  candidatesById: Map<
    string,
    { candidate: MatchCandidate; portfolio?: CompatibilityProfile["portfolio"] }
  >;
}

type AdvancedAction = "gift" | "portfolio" | "challenge" | "voice";

type PortfolioSharePreferences = {
  shareTokens: boolean;
  shareDefi: boolean;
  shareNfts: boolean;
  shareActivity: boolean;
  shareHighlights: boolean;
  detailLevel: PortfolioVisibilityLevel;
  activityVisibility: ActivityVisibilityLevel;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
};

const EMPTY_STATE_MESSAGE = "Unlock a mutual match to start a conversation with shared alpha.";

const REACTION_EMOJIS = ["🚀", "🪙", "📈", "🔥", "🧠", "🤝"] as const;

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "base-sunrise",
    title: "Base Sunrise Sync",
    description: "Kick off the morning with a Base dashboard check-in together.",
    stakes: "Loser sends the other a matcha via Base Pay",
    category: "ritual",
  },
  {
    id: "defi-sprint",
    title: "DeFi Yield Sprint",
    description: "Swap weekly vault intel and share on-chain wins.",
    stakes: "Winner chooses the next protocol deep dive",
    category: "defi",
  },
  {
    id: "nft-gallery",
    title: "NFT Gallery Walk",
    description: "Co-curate a Base art mood board and share the vibe.",
    stakes: "Create a joint Farcaster frame to show it off",
    category: "nft",
  },
];

const DEFAULT_SHARE_PREFERENCES: PortfolioSharePreferences = {
  shareTokens: true,
  shareDefi: true,
  shareNfts: false,
  shareActivity: true,
  shareHighlights: true,
  detailLevel: "SUMMARY",
  activityVisibility: "PATTERNS",
};

export function ChatInterface({
  matches,
  seeker,
  seekerPortfolio,
  candidatesById,
}: ChatInterfaceProps) {
  const [activeId, setActiveId] = useState<string | null>(matches[0]?.id ?? null);
  const [activeAction, setActiveAction] = useState<AdvancedAction | null>(null);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);

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
    setActiveAction(null);
    setReactionTargetId(null);
  }, [activeMatch?.id]);

  const isReady = status === "connected";
  const canSend = draft.trim().length > 0 && isReady;

  const activeTyping = typingUsers.filter((entry) => entry.userId !== seeker.userId);

  const { reactions, nonReactionMessages } = useMemo(() => extractReactions(messages), [messages]);

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body) {
      return;
    }
    sendMessage({ body, kind: "text" });
    setDraft("");
  }, [draft, sendMessage]);

  const handleGiftSubmit = useCallback(
    (input: BasePayGiftPlanInput) => {
      const plan = planBasePayGift(input);
      sendMessage({ body: plan.summary, kind: "gift", metadata: plan.metadata });
      setActiveAction(null);
    },
    [sendMessage],
  );

  const handlePortfolioSubmit = useCallback(
    (preferences: PortfolioPrivacyPreferencesInput) => {
      const plan = planPortfolioSnippet({ snapshot: seekerPortfolio, preferences });
      sendMessage({ body: plan.summary, kind: "portfolio_snippet", metadata: plan.metadata });
      setActiveAction(null);
    },
    [seekerPortfolio, sendMessage],
  );

  const handleChallengeSubmit = useCallback(
    ({ template, startAt, durationDays }: ChallengePlanInput) => {
      const plan = planChallengeInvitation({ template, startAt, durationDays });
      sendMessage({ body: plan.summary, kind: "challenge", metadata: plan.metadata });
      setActiveAction(null);
    },
    [sendMessage],
  );

  const handleVoiceSubmit = useCallback(
    (input: VoiceNotePlanInput) => {
      const plan = planVoiceNote(input);
      sendMessage({ body: plan.summary, kind: "voice", metadata: plan.metadata });
      setActiveAction(null);
    },
    [sendMessage],
  );

  const handleReaction = useCallback(
    (planInput: ReactionPlanInput) => {
      const plan = planReaction(planInput);
      sendMessage({ body: plan.summary, kind: "reaction", metadata: plan.metadata });
      setReactionTargetId(null);
    },
    [sendMessage],
  );

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

        <div className={styles.quickActions}>
          <button
            type="button"
            className={`${styles.quickActionButton} ${activeAction === "gift" ? styles.quickActionButtonActive : ""}`}
            onClick={() => setActiveAction(activeAction === "gift" ? null : "gift")}
            disabled={!isReady}
          >
            Base Pay gift
          </button>
          <button
            type="button"
            className={`${styles.quickActionButton} ${
              activeAction === "portfolio" ? styles.quickActionButtonActive : ""
            }`}
            onClick={() => setActiveAction(activeAction === "portfolio" ? null : "portfolio")}
            disabled={!isReady}
          >
            Share portfolio snippet
          </button>
          <button
            type="button"
            className={`${styles.quickActionButton} ${
              activeAction === "challenge" ? styles.quickActionButtonActive : ""
            }`}
            onClick={() => setActiveAction(activeAction === "challenge" ? null : "challenge")}
            disabled={!isReady}
          >
            Invite to challenge
          </button>
          <button
            type="button"
            className={`${styles.quickActionButton} ${activeAction === "voice" ? styles.quickActionButtonActive : ""}`}
            onClick={() => setActiveAction(activeAction === "voice" ? null : "voice")}
            disabled={!isReady}
          >
            Drop voice note
          </button>
        </div>

        {activeAction === "gift" ? (
          <GiftComposer isReady={isReady} onSubmit={handleGiftSubmit} onCancel={() => setActiveAction(null)} />
        ) : null}
        {activeAction === "portfolio" ? (
          <PortfolioComposer
            isReady={isReady}
            defaultPreferences={DEFAULT_SHARE_PREFERENCES}
            onSubmit={handlePortfolioSubmit}
            onCancel={() => setActiveAction(null)}
          />
        ) : null}
        {activeAction === "challenge" ? (
          <ChallengeComposer
            isReady={isReady}
            templates={CHALLENGE_TEMPLATES}
            onSubmit={handleChallengeSubmit}
            onCancel={() => setActiveAction(null)}
          />
        ) : null}
        {activeAction === "voice" ? (
          <VoiceComposer isReady={isReady} onSubmit={handleVoiceSubmit} onCancel={() => setActiveAction(null)} />
        ) : null}

        <div className={styles.messageList}>
          {!nonReactionMessages.length ? (
            <div className={styles.emptyConversation}>
              <p>Break the ice with an on-chain themed opener.</p>
            </div>
          ) : (
            <ul>
              {nonReactionMessages.map((message) => (
                <li key={message.id} className={styles.messageRow} data-local={message.isLocal}>
                  <div className={styles.messageBubble}>
                    {renderMessageContent(message)}
                    <div className={styles.messageMeta}>
                      <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
                      {message.isLocal ? (
                        <span>{STATUS_LABELS[message.status] ?? message.status}</span>
                      ) : null}
                    </div>
                    {renderReactions(message.id, reactions)}
                    <div className={styles.messageActions}>
                      <button
                        type="button"
                        className={styles.actionToggle}
                        onClick={() =>
                          setReactionTargetId((current) => (current === message.id ? null : message.id))
                        }
                        disabled={!isReady}
                        aria-expanded={reactionTargetId === message.id}
                      >
                        React
                      </button>
                      {reactionTargetId === message.id ? (
                        <div className={styles.reactionPicker} role="listbox">
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() =>
                                handleReaction({ emoji, targetMessageId: message.id })
                              }
                              role="option"
                              aria-label={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
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

function renderMessageContent(message: ChatMessageView) {
  const metadata = message.metadata;
  if (message.kind === "gift" && metadata?.type === "gift") {
    return <GiftMessage metadata={metadata} body={message.body} />;
  }
  if (message.kind === "portfolio_snippet" && metadata?.type === "portfolio_snippet") {
    return <PortfolioMessage metadata={metadata} body={message.body} />;
  }
  if (message.kind === "challenge" && metadata?.type === "challenge") {
    return <ChallengeMessage metadata={metadata} body={message.body} />;
  }
  if (message.kind === "voice" && metadata?.type === "voice") {
    return <VoiceMessage metadata={metadata} body={message.body} />;
  }

  return <p>{message.body}</p>;
}

function renderReactions(messageId: string, reactions: ReturnType<typeof extractReactions>["reactions"]) {
  const entries = reactions.get(messageId);
  if (!entries || !entries.length) {
    return null;
  }

  return (
    <div className={styles.reactionRow}>
      {entries.map((entry) => (
        <span key={`${messageId}:${entry.emoji}`} className={styles.reactionChip}>
          {entry.emoji}
          {entry.count > 1 ? <small>{entry.count}</small> : null}
        </span>
      ))}
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

function formatDateRange(startIso: string, endIso: string) {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.toLocaleDateString(undefined, options)} → ${end.toLocaleDateString(undefined, options)}`;
}

interface GiftMessageProps {
  metadata: ReturnType<typeof planBasePayGift>["metadata"];
  body: string;
}

function GiftMessage({ metadata, body }: GiftMessageProps) {
  return (
    <div className={styles.giftCard}>
      <strong>{body}</strong>
      <div>
        <span>Status: {metadata.status === "settled" ? "Completed" : "Processing"}</span>
        {metadata.fiatEstimateUsd ? (
          <span>≈ ${metadata.fiatEstimateUsd.toFixed(2)} USD</span>
        ) : null}
      </div>
      {metadata.note ? <p className={styles.giftNote}>{metadata.note}</p> : null}
      <small>Transfer ref: {metadata.reference.slice(0, 8)}</small>
    </div>
  );
}

interface PortfolioMessageProps {
  metadata: ReturnType<typeof planPortfolioSnippet>["metadata"];
  body: string;
}

function PortfolioMessage({ metadata, body }: PortfolioMessageProps) {
  const { snapshot } = metadata;
  return (
    <div className={styles.portfolioCard}>
      <strong>{body}</strong>
      <p className={styles.portfolioNote}>{metadata.privacyNote}</p>
      <dl>
        {snapshot.tokens.length ? (
          <div>
            <dt>Tokens</dt>
            <dd>{snapshot.tokens.map((token) => `${token.symbol} (${token.allocationBucket})`).join(", ")}</dd>
          </div>
        ) : null}
        {snapshot.defiProtocols.length ? (
          <div>
            <dt>DeFi</dt>
            <dd>{snapshot.defiProtocols.map((protocol) => protocol.name).join(", ")}</dd>
          </div>
        ) : null}
        {snapshot.nftCollections.length ? (
          <div>
            <dt>NFTs</dt>
            <dd>{snapshot.nftCollections.map((collection) => collection.name).join(", ")}</dd>
          </div>
        ) : null}
        {snapshot.activity ? (
          <div>
            <dt>Activity</dt>
            <dd>
              {snapshot.activity.timezone} • {snapshot.activity.tradingFrequency} trader • {snapshot.activity.riskTolerance} risk
            </dd>
          </div>
        ) : null}
        {snapshot.highlights.length ? (
          <div>
            <dt>Highlights</dt>
            <dd>{snapshot.highlights.join(" • ")}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

interface ChallengeMessageProps {
  metadata: ReturnType<typeof planChallengeInvitation>["metadata"];
  body: string;
}

function ChallengeMessage({ metadata, body }: ChallengeMessageProps) {
  return (
    <div className={styles.challengeCard}>
      <strong>{body}</strong>
      <p>{metadata.description}</p>
      <div className={styles.challengeMeta}>
        <span>{formatDateRange(metadata.timeline.startAt, metadata.timeline.endAt)}</span>
        <span>{metadata.stakes}</span>
      </div>
    </div>
  );
}

interface VoiceMessageProps {
  metadata: ReturnType<typeof planVoiceNote>["metadata"];
  body: string;
}

function VoiceMessage({ metadata, body }: VoiceMessageProps) {
  return (
    <div className={styles.voiceCard}>
      <strong>{body}</strong>
      <div className={styles.voiceMeta}>
        <span>{metadata.durationSeconds}s • {metadata.vibe} vibe</span>
        {metadata.transcription ? <span>“{metadata.transcription}”</span> : null}
      </div>
      <div className={styles.waveform} aria-hidden>
        {metadata.waveform.map((value, index) => (
          <span key={index} className={styles.waveformBar} style={{ height: `${Math.max(18, value * 48)}px` }} />
        ))}
      </div>
    </div>
  );
}

interface GiftComposerProps {
  isReady: boolean;
  onSubmit: (input: BasePayGiftPlanInput) => void;
  onCancel: () => void;
}

function GiftComposer({ isReady, onSubmit, onCancel }: GiftComposerProps) {
  const [asset, setAsset] = useState<BasePayGiftPlanInput["asset"]>("USDC");
  const [amount, setAmount] = useState<number>(5);
  const [note, setNote] = useState<string>("Base coffee on me!");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady || amount <= 0) {
      return;
    }
    onSubmit({ asset, amount, note });
  };

  return (
    <form className={styles.actionPanel} onSubmit={handleSubmit}>
      <div className={styles.actionHeader}>
        <strong>Send a Base Pay micro-gift</strong>
        <p>Keep it playful with a quick on-chain treat.</p>
      </div>
      <div className={styles.actionRow}>
        <label>
          Token
          <select value={asset} onChange={(event) => setAsset(event.target.value)}>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
            <option value="DEGEN">DEGEN</option>
            <option value="AERO">AERO</option>
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </label>
      </div>
      <label className={styles.fullWidthField}>
        Note
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a short message"
          />
      </label>
      <div className={styles.actionButtons}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={!isReady || amount <= 0}>
          Send gift
        </button>
      </div>
    </form>
  );
}

interface PortfolioComposerProps {
  isReady: boolean;
  defaultPreferences: PortfolioSharePreferences;
  onSubmit: (preferences: PortfolioPrivacyPreferencesInput) => void;
  onCancel: () => void;
}

function PortfolioComposer({ isReady, defaultPreferences, onSubmit, onCancel }: PortfolioComposerProps) {
  const [preferences, setPreferences] = useState<PortfolioSharePreferences>(defaultPreferences);

  useEffect(() => {
    setPreferences(defaultPreferences);
  }, [defaultPreferences]);

  const handleCheckbox = (key: keyof PortfolioSharePreferences) => (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setPreferences((current) => ({ ...current, [key]: checked }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) {
      return;
    }
    onSubmit({
      shareTokens: preferences.shareTokens,
      shareDefi: preferences.shareDefi,
      shareNfts: preferences.shareNfts,
      shareActivity: preferences.shareActivity,
      shareHighlights: preferences.shareHighlights,
      tokenVisibility: preferences.detailLevel,
      defiVisibility: preferences.detailLevel,
      nftVisibility: preferences.detailLevel,
      activityVisibility: preferences.shareActivity ? preferences.activityVisibility : "HIDDEN",
    });
  };

  return (
    <form className={styles.actionPanel} onSubmit={handleSubmit}>
      <div className={styles.actionHeader}>
        <strong>Share a privacy-safe snapshot</strong>
        <p>Control how much alpha you reveal on the first message.</p>
      </div>
      <div className={styles.preferenceGrid}>
        <label>
          <input
            type="checkbox"
            checked={preferences.shareTokens}
            onChange={handleCheckbox("shareTokens")}
          />
          Tokens
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.shareDefi}
            onChange={handleCheckbox("shareDefi")}
          />
          DeFi strategies
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.shareNfts}
            onChange={handleCheckbox("shareNfts")}
          />
          NFT vibes
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.shareActivity}
            onChange={handleCheckbox("shareActivity")}
          />
          Activity window
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.shareHighlights}
            onChange={handleCheckbox("shareHighlights")}
          />
          Highlights
        </label>
      </div>
      <div className={styles.actionRow}>
        <label>
          Detail level
          <select
            value={preferences.detailLevel}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, detailLevel: event.target.value as PortfolioVisibilityLevel }))
            }
          >
            <option value="SUMMARY">Summary</option>
            <option value="DETAILED">Detailed</option>
          </select>
        </label>
        <label>
          Activity share
          <select
            value={preferences.activityVisibility}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                activityVisibility: event.target.value as ActivityVisibilityLevel,
              }))
            }
            disabled={!preferences.shareActivity}
          >
            <option value="PATTERNS">Patterns only</option>
            <option value="TIMEZONE_ONLY">Timezone only</option>
          </select>
        </label>
      </div>
      <div className={styles.actionButtons}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={!isReady}>
          Share snippet
        </button>
      </div>
    </form>
  );
}

interface ChallengeComposerProps {
  isReady: boolean;
  templates: ChallengeTemplate[];
  onSubmit: (input: ChallengePlanInput) => void;
  onCancel: () => void;
}

function ChallengeComposer({ isReady, templates, onSubmit, onCancel }: ChallengeComposerProps) {
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState<number>(7);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0],
    [templates, templateId],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady || !selectedTemplate) {
      return;
    }
    onSubmit({ template: selectedTemplate, startAt: new Date(startDate), durationDays: duration });
  };

  return (
    <form className={styles.actionPanel} onSubmit={handleSubmit}>
      <div className={styles.actionHeader}>
        <strong>Invite them to a challenge</strong>
        <p>Turn shared strategies into a fun on-chain mission.</p>
      </div>
      <label className={styles.fullWidthField}>
        Theme
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </label>
      {selectedTemplate ? <p className={styles.challengeDescription}>{selectedTemplate.description}</p> : null}
      <div className={styles.actionRow}>
        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          Duration
          <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
            <option value={3}>Weekend (3 days)</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
          </select>
        </label>
      </div>
      <div className={styles.actionButtons}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={!isReady || !selectedTemplate}>
          Send invite
        </button>
      </div>
    </form>
  );
}

interface VoiceComposerProps {
  isReady: boolean;
  onSubmit: (input: VoiceNotePlanInput) => void;
  onCancel: () => void;
}

function VoiceComposer({ isReady, onSubmit, onCancel }: VoiceComposerProps) {
  const [duration, setDuration] = useState<number>(18);
  const [vibe, setVibe] = useState<VoiceNotePlanInput["vibe"]>("chill");
  const [transcription, setTranscription] = useState<string>("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) {
      return;
    }
    onSubmit({ durationSeconds: duration, vibe, transcription });
  };

  return (
    <form className={styles.actionPanel} onSubmit={handleSubmit}>
      <div className={styles.actionHeader}>
        <strong>Drop a voice note</strong>
        <p>Perfect for mobile — let your tone set the vibe.</p>
      </div>
      <label className={styles.fullWidthField}>
        Mood
        <select value={vibe} onChange={(event) => setVibe(event.target.value as VoiceNotePlanInput["vibe"])}>
          <option value="chill">Chill</option>
          <option value="excited">Excited</option>
          <option value="romantic">Romantic</option>
          <option value="strategic">Strategic</option>
        </select>
      </label>
      <label className={styles.fullWidthField}>
        Length: {duration}s
        <input
          type="range"
          min={6}
          max={60}
          step={1}
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
      </label>
      <label className={styles.fullWidthField}>
        Optional transcript
        <textarea
          value={transcription}
          onChange={(event) => setTranscription(event.target.value)}
          placeholder="Give them context before they hit play"
          rows={2}
        />
      </label>
      <div className={styles.actionButtons}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={!isReady}>
          Share voice note
        </button>
      </div>
    </form>
  );
}
