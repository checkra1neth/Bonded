"use client";

import { useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import {
  buildMatchCandidate,
  describeCategory,
  type CompatibilityProfile,
} from "@/lib/matching/compatibility";
import { MatchCard, type MatchDecision } from "./components/MatchCard";
import styles from "./page.module.css";

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Ava Protocol",
    personality: "DeFi Degen",
    basename: "ava.base",
    avatarColor: "linear-gradient(135deg, #5f5bff 0%, #00d1ff 100%)",
    location: "New York • EST",
    achievements: ["Base OG", "DAO Strategist"],
    bio: "Bridging TradFi intuition with DeFi execution."
  },
  portfolio: {
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
  },
};

const candidateProfiles: CompatibilityProfile[] = [
  {
    user: {
      id: "nova-yield",
      displayName: "Nova Yield",
      personality: "Diamond Hands",
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
  },
  {
    user: {
      id: "atlas",
      displayName: "Atlas Nodes",
      personality: "GameFi Player",
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
  },
  {
    user: {
      id: "serena",
      displayName: "Serena L2",
      personality: "Banker",
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
  },
];

type DecisionLog = {
  userId: string;
  displayName: string;
  decision: MatchDecision;
  score: number;
  category: string;
};

export default function Home() {
  const candidates = useMemo(
    () => candidateProfiles.map((candidate) => buildMatchCandidate(seekerProfile, candidate)),
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [decisionLog, setDecisionLog] = useState<DecisionLog[]>([]);

  const activeCandidate = candidates[activeIndex];

  const handleDecision = (decision: MatchDecision) => {
    if (!activeCandidate) {
      return;
    }

    setDecisionLog((previous) => [
      ...previous,
      {
        userId: activeCandidate.user.id,
        displayName: activeCandidate.user.displayName,
        decision,
        score: activeCandidate.compatibilityScore.overall,
        category: activeCandidate.compatibilityScore.category.label,
      },
    ]);

    setActiveIndex((index) => {
      const nextIndex = index + 1;
      return nextIndex >= candidates.length ? candidates.length : nextIndex;
    });
  };

  const progress = Math.round((decisionLog.length / candidates.length) * 100);
  const matchesReviewed = `${decisionLog.length}/${candidates.length}`;
  const positiveMatches = decisionLog.filter((entry) => entry.decision !== "pass");
  const superLikes = decisionLog.filter((entry) => entry.decision === "super");

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
            <Wallet />
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
            {candidates.map((candidate, index) => {
              const decision = decisionLog.find((entry) => entry.userId === candidate.user.id);
              const status =
                decision?.decision === "super"
                  ? "Super like sent"
                  : decision?.decision === "like"
                  ? "Liked"
                  : decision?.decision === "pass"
                  ? "Passed"
                  : index === activeIndex
                  ? "Reviewing now"
                  : index < activeIndex
                  ? "Reviewed"
                  : "In queue";

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

      <main className={styles.main}>
        <section className={styles.matchSection}>
          {activeCandidate ? (
            <MatchCard
              candidate={activeCandidate}
              isActive
              onDecision={handleDecision}
            />
          ) : (
            <div className={styles.emptyState}>
              <h2>Queue complete</h2>
              <p>New compatibility scans will refresh once fresh wallets opt in. Stay tuned!</p>
            </div>
          )}
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <h3>Your crypto fingerprint</h3>
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
            <h3>Decision log</h3>
            <ul className={styles.logList}>
              {decisionLog.length === 0 ? (
                <li className={styles.logEmpty}>No decisions yet. Review your first match to begin.</li>
              ) : (
                decisionLog.map((entry) => (
                  <li key={entry.userId}>
                    <div>
                      <strong>{entry.displayName}</strong>
                      <span>{Math.round(entry.score * 100)}%</span>
                    </div>
                    <span className={styles.logMeta}>
                      {entry.category} • {entry.decision === "pass" ? "Passed" : entry.decision === "like" ? "Liked" : "Super liked"}
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
