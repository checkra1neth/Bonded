"use client";

import { useMemo } from "react";
import {
  buildMatchCandidate,
  describeCategory,
  type CandidateInteractionProfile,
  type CompatibilityProfile,
  type MatchCandidate,
  type MatchDecision,
} from "@/lib/matching/compatibility";
import { assessPersonality } from "@/lib/personality/assessment";
import { MatchCard } from "./components/MatchCard";
import { PersonalityHighlight } from "./components/PersonalityHighlight";
import { WalletAuthPanel } from "./components/WalletAuthPanel";
import { IcebreakerSuggestions } from "./components/IcebreakerSuggestions";
import { ChatInterface } from "./components/ChatInterface";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { ProfileManagementPanel } from "./components/ProfileManagementPanel";
import styles from "./page.module.css";
import { useMatchQueue } from "./hooks/useMatchQueue";
import { useIcebreakerSuggestions } from "./hooks/useIcebreakerSuggestions";

const seekerPortfolio: CompatibilityProfile["portfolio"] = {
  tokens: [
    { symbol: "ETH", allocation: 0.32, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.22, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
    { symbol: "UNI", allocation: 0.07 },
    { symbol: "AEROX", allocation: 0.05 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
    { name: "BaseSwap", category: "dex", risk: "adventurous" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 11, 19, 20, 21, 22],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["On-chain since 2018", "Runs a weekly governance call"],
};

const seekerAssessment = assessPersonality(seekerPortfolio);

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Ava Protocol",
    headline: "Base-native strategist bridging DeFi and governance",
    personality: seekerAssessment.type,
    basename: "ava.base",
    avatarColor: "linear-gradient(135deg, #5f5bff 0%, #00d1ff 100%)",
    location: "New York • EST",
    achievements: ["Base OG", "DAO Strategist"],
    bio: "Bridging TradFi intuition with DeFi execution.",
    verifications: [
      {
        id: "wallet",
        label: "Wallet ownership",
        status: "verified",
        detail: "Signed in with primary Base account",
        lastChecked: new Date("2024-10-04T15:00:00Z").getTime(),
      },
      {
        id: "basename",
        label: "Basename linked",
        status: "verified",
        detail: "Reverse record configured for ava.base",
        lastChecked: new Date("2024-10-03T09:00:00Z").getTime(),
      },
      {
        id: "proof_of_humanity",
        label: "Humanity proof",
        status: "pending",
        detail: "Queued for verification via Base Identity",
      },
    ],
  },
  portfolio: seekerPortfolio,
};

const candidateSeeds: Array<{
  user: CompatibilityProfile["user"];
  portfolio: CompatibilityProfile["portfolio"];
  interaction?: CandidateInteractionProfile;
}> = [
  {
    user: {
      id: "nova-yield",
      displayName: "Nova Yield",
      avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
      location: "Lisbon • WET",
      bio: "Vault architect turning yield curves into love stories.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.3, conviction: "high" },
        { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
        { symbol: "AERO", allocation: 0.16 },
        { symbol: "CBETH", allocation: 0.12 },
        { symbol: "USDC", allocation: 0.12 },
        { symbol: "BAL", allocation: 0.1 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
        { name: "EigenLayer", category: "staking", risk: "balanced" },
        { name: "BaseSwap", category: "dex", risk: "adventurous" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
        { name: "Opepens", theme: "art", vibe: "playful" },
      ],
      activity: {
        timezoneOffset: 0,
        activeHours: [9, 10, 11, 12, 19, 20, 21],
        tradingFrequency: "daily",
        riskTolerance: "balanced",
      },
    },
    interaction: {
      initialDecision: "like",
      autoResponse: { onSuperLike: "super" },
    },
  },
  {
    user: {
      id: "atlas",
      displayName: "Atlas Nodes",
      avatarColor: "linear-gradient(135deg, #7fffd4, #3d7afe)",
      location: "Singapore • SGT",
      bio: "Validator runner & metaverse curator on Base.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.28 },
        { symbol: "AERO", allocation: 0.2 },
        { symbol: "MAGIC", allocation: 0.15 },
        { symbol: "DEGEN", allocation: 0.1 },
        { symbol: "USDC", allocation: 0.12 },
        { symbol: "OP", allocation: 0.15 },
      ],
      defiProtocols: [
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
        { name: "Moonwell", category: "lending", risk: "balanced" },
        { name: "Galxe", category: "infrastructure", risk: "balanced" },
      ],
      nftCollections: [
        { name: "Parallel", theme: "gaming", vibe: "luxury" },
        { name: "Zuku", theme: "gaming", vibe: "playful" },
      ],
      activity: {
        timezoneOffset: 8,
        activeHours: [6, 7, 20, 21, 22, 23],
        tradingFrequency: "weekly",
        riskTolerance: "adventurous",
      },
    },
    interaction: {
      autoResponse: { onLike: "pass", onSuperLike: "like" },
    },
  },
  {
    user: {
      id: "serena",
      displayName: "Serena L2",
      avatarColor: "linear-gradient(135deg, #ff93ff, #7f5dff)",
      location: "Chicago • CST",
      bio: "Structured products maxi keeping composability classy.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.34 },
        { symbol: "USDC", allocation: 0.18 },
        { symbol: "CBETH", allocation: 0.14 },
        { symbol: "AERO", allocation: 0.12 },
        { symbol: "DEGEN", allocation: 0.1 },
        { symbol: "LINK", allocation: 0.12 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "BaseSwap", category: "dex", risk: "balanced" },
        { name: "Sommelier", category: "yield", risk: "balanced" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
        { name: "Sound XYZ", theme: "music", vibe: "luxury" },
      ],
      activity: {
        timezoneOffset: -6,
        activeHours: [7, 8, 9, 20, 21, 22],
        tradingFrequency: "weekly",
        riskTolerance: "balanced",
      },
    },
    interaction: {
      autoResponse: { onLike: "like" },
    },
  },
] as const;

const candidateProfiles: CompatibilityProfile[] = candidateSeeds.map((candidate) => {
  const assessment = assessPersonality(candidate.portfolio);
  return {
    user: {
      ...candidate.user,
      personality: assessment.type,
    },
    portfolio: candidate.portfolio,
  } satisfies CompatibilityProfile;
});

const candidateProfilesById = new Map<string, CompatibilityProfile>(
  candidateProfiles.map((profile) => [profile.user.id, profile]),
);

export default function Home() {
  const initialCandidates = useMemo(
    () =>
      candidateProfiles.map((candidate, index) =>
        buildMatchCandidate(seekerProfile, candidate, {
          interaction: candidateSeeds[index]?.interaction,
        }),
      ),
    [],
  );

  const { state: queueState, activeCandidate, decide, dismissNotification, reviewedCount } =
    useMatchQueue(initialCandidates);

  const totalCandidates = queueState.entries.length;
  const progress = totalCandidates
    ? Math.round((reviewedCount / totalCandidates) * 100)
    : 0;
  const matchesReviewed = `${reviewedCount}/${totalCandidates}`;
  const positiveMatches = queueState.decisions.filter((entry) => entry.decision !== "pass");
  const superLikes = queueState.decisions.filter((entry) => entry.decision === "super");
  const decisionLog = [...queueState.decisions].sort((a, b) => b.createdAt - a.createdAt);
  const mutualMatches = [...queueState.matches].sort((a, b) => b.createdAt - a.createdAt);
  const notifications = queueState.notifications;

  const candidatesById = useMemo(() => {
    return queueState.entries.reduce(
      (acc, entry) => {
        const profile = candidateProfilesById.get(entry.candidate.user.id);
        acc.set(entry.candidate.user.id, {
          candidate: entry.candidate,
          portfolio: profile?.portfolio,
        });
        return acc;
      },
      new Map<string, { candidate: MatchCandidate; portfolio?: CompatibilityProfile["portfolio"] }>(),
    );
  }, [queueState.entries]);

  const seekerParticipant = useMemo(
    () => ({
      userId: seekerProfile.user.id,
      displayName: seekerProfile.user.displayName,
      avatarColor: seekerProfile.user.avatarColor,
      role: "seeker" as const,
    }),
    [],
  );

  const { suggestions: icebreakerSuggestions, isDelivering: isDeliveringIcebreakers } =
    useIcebreakerSuggestions({
      matches: mutualMatches,
      seekerProfile,
      seekerPersonality: seekerAssessment,
      candidatesById,
    });

  const nextCandidate = queueState.entries.find((entry, index) => {
    if (queueState.activeIndex === -1) {
      return false;
    }
    return entry.status === "pending" && index > queueState.activeIndex;
  })?.candidate;

  const handleDecision = (decision: MatchDecision) => {
    if (!activeCandidate) {
      return;
    }

    decide(activeCandidate.user.id, decision);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Base Dating • MiniKit MVP</span>
          <h1>On-chain chemistry engineered for crypto romantics</h1>
          <p>
            Connect your Base wallet, unlock your crypto personality, and let the compatibility engine
            surface matches who share your token thesis, DeFi strategies, and NFT vibes.
          </p>
          <div className={styles.ctaRow}>
            <WalletAuthPanel />
            <div className={styles.heroStats}>
              <div>
                <span>{seekerProfile.user.personality}</span>
                <small>Personality Archetype</small>
              </div>
              <div>
                <span>{positiveMatches.length}</span>
                <small>Connections today</small>
              </div>
              <div>
                <span>{superLikes.length}</span>
                <small>Super likes sent</small>
              </div>
            </div>
          </div>
          <ul className={styles.requirements}>
            <li>Wallet-authenticated onboarding with Base Account</li>
            <li>Portfolio analysis without revealing balances</li>
            <li>AI-powered reasoning for every match</li>
            <li>Premium-ready super like mechanics</li>
          </ul>
        </div>

        <div className={styles.progressCard}>
          <h2>Matchmaking progress</h2>
          <p className={styles.progressCopy}>
            {matchesReviewed} matches processed • {progress}% through today&apos;s queue
          </p>
          <div className={styles.progressTrack}>
            <span className={styles.progressValue} style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
          <ul className={styles.progressList}>
            {queueState.entries.map((entry, index) => {
              const { candidate } = entry;
              const decision = entry.decision;
              const isActive = queueState.activeIndex === index;
              let status: string;

              if (decision) {
                if (decision.decision === "super") {
                  status = decision.mutual ? "Super match" : "Super like sent";
                } else if (decision.decision === "like") {
                  status = decision.mutual ? "Matched" : "Liked";
                } else {
                  status = "Passed";
                }
              } else if (isActive) {
                status = "Reviewing now";
              } else if (entry.status === "pending") {
                status = "In queue";
              } else {
                status = "Reviewed";
              }

              return (
                <li key={candidate.user.id}>
                  <div>
                    <strong>{candidate.user.displayName}</strong>
                    <span>{describeCategory(candidate.compatibilityScore)}</span>
                  </div>
                  <span className={styles.statusBadge}>{status}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      <section className={styles.onboardingSection}>
        <OnboardingWizard profile={seekerProfile} assessment={seekerAssessment} />
      </section>

      {notifications.length > 0 && (
        <div className={styles.notifications}>
          {notifications.map((notification) => (
            <div key={notification.id} className={styles.notification}>
              <div>
                <strong>New match</strong>
                <span>{notification.message}</span>
              </div>
              <button type="button" onClick={() => dismissNotification(notification.id)}>
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.primaryColumn}>
          <section className={styles.profileSection}>
            <ProfileManagementPanel profile={seekerProfile} />
          </section>
          <section className={styles.matchSection}>
            <div className={styles.deck}>
              {nextCandidate ? (
                <div className={styles.previewCard} aria-hidden>
                  <strong>{nextCandidate.user.displayName}</strong>
                  <span>
                    {Math.round(nextCandidate.compatibilityScore.overall * 100)}% match • {describeCategory(nextCandidate.compatibilityScore)}
                  </span>
                </div>
              ) : null}
              {activeCandidate ? (
                <div className={styles.cardSlot}>
                  <MatchCard
                    key={activeCandidate.user.id}
                    candidate={activeCandidate}
                    isActive
                    onDecision={handleDecision}
                  />
                </div>
              ) : (
                <div className={`${styles.emptyState} ${styles.deckEmpty}`}>
                  <h2>Queue complete</h2>
                  <p>New compatibility scans will refresh once fresh wallets opt in. Stay tuned!</p>
                </div>
              )}
            </div>
          </section>

          <section className={styles.chatSection}>
            <ChatInterface
              matches={mutualMatches}
              seeker={seekerParticipant}
              seekerPortfolio={seekerProfile.portfolio}
              candidatesById={candidatesById}
            />
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <h3>Your crypto fingerprint</h3>
            <PersonalityHighlight assessment={seekerAssessment} />
            <ul>
              <li>
                <strong>Top tokens</strong>
                <span>
                  {seekerProfile.portfolio.tokens
                    .slice(0, 3)
                    .map((token) => token.symbol)
                    .join(" · ")}
                </span>
              </li>
              <li>
                <strong>DeFi focus</strong>
                <span>
                  {seekerProfile.portfolio.defiProtocols
                    .slice(0, 2)
                    .map((protocol) => protocol.name)
                    .join(" · ")}
                </span>
              </li>
              <li>
                <strong>Active hours</strong>
                <span>Evenings EST • Governance calls Wednesdays</span>
              </li>
            </ul>
          </section>

          <section className={styles.panel}>
            <IcebreakerSuggestions
              matches={mutualMatches}
              suggestions={icebreakerSuggestions}
              isGenerating={isDeliveringIcebreakers}
            />
          </section>

          <section className={styles.panel}>
            <h3>Mutual matches</h3>
            {mutualMatches.length === 0 ? (
              <p className={styles.emptyCopy}>
                No mutual matches yet. Keep exploring and send a super like to spark a connection.
              </p>
            ) : (
              <ul className={styles.matchList}>
                {mutualMatches.map((match) => (
                  <li key={match.id}>
                    <div>
                      <strong>{match.displayName}</strong>
                      <span>
                        {Math.round(match.compatibilityScore * 100)}% •
                        {" "}
                        {match.decision === "super" ? "Super like" : "Liked"}
                      </span>
                    </div>
                    <span className={styles.matchBadge}>Matched</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <h3>Decision log</h3>
            <ul className={styles.logList}>
              {decisionLog.length === 0 ? (
                <li className={styles.logEmpty}>No decisions yet. Review your first match to begin.</li>
              ) : (
                decisionLog.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{entry.candidateName}</strong>
                      <span>{Math.round(entry.compatibilityScore * 100)}%</span>
                    </div>
                    <span className={styles.logMeta}>
                      {entry.mutual
                        ? "Matched"
                        : entry.decision === "pass"
                        ? "Passed"
                        : entry.decision === "like"
                        ? "Liked"
                        : "Super liked"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>Upcoming features</h3>
            <ul className={styles.featureList}>
              <li>Real-time chat drops with Base Pay micro-gifts</li>
              <li>AI icebreakers tuned to market events</li>
              <li>Viral compatibility reports for social amplification</li>
              <li>Weekly on-chain couple challenges with badges</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
