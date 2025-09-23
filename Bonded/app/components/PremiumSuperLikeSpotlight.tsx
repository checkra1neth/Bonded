"use client";

import { useMemo } from "react";

import type { SuperLikeSpotlightEntry } from "@/lib/premium";

import styles from "./PremiumSuperLikeSpotlight.module.css";

interface PremiumSuperLikeSpotlightProps {
  entries: SuperLikeSpotlightEntry[];
}

const formatRelative = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) {
    return "moments ago";
  }
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export function PremiumSuperLikeSpotlight({ entries }: PremiumSuperLikeSpotlightProps) {
  const visibleEntries = useMemo(() => entries.slice(0, 3), [entries]);

  if (!visibleEntries.length) {
    return (
      <div className={styles.empty}>
        <p>No super like spotlights yet. Send a 🚀 to unlock premium follow-ups.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3>Super like spotlight</h3>
        <span>High-intent matches are notified instantly.</span>
      </header>
      <ul className={styles.list}>
        {visibleEntries.map((entry) => (
          <li key={entry.id}>
            <div>
              <strong>{entry.displayName}</strong>
              <span>{entry.headline}</span>
            </div>
            <div className={styles.meta}>
              <span>{entry.compatibilityPercent}% match</span>
              <span>{entry.categoryLabel}</span>
              <span>{formatRelative(entry.timestamp)}</span>
            </div>
            <p>{entry.sharedSignal}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
