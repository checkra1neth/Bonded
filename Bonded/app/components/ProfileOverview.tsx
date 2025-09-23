"use client";

import React from "react";
import type { ProfileVerification } from "../../lib/matching/compatibility";
import type { PortfolioPrivacyPreferences } from "../../lib/portfolio/privacy";
import type { SanitizedPortfolioSnapshot } from "../../lib/portfolio/types";

import styles from "./ProfileOverview.module.css";

interface PreviewProfile {
  displayName: string;
  basename?: string;
  personality: string;
  headline?: string;
  location?: string;
  bio: string;
  avatarColor?: string;
  achievements: string[];
}

interface ProfileOverviewProps {
  profile: PreviewProfile;
  sanitizedPortfolio: SanitizedPortfolioSnapshot;
  verifications: ProfileVerification[];
  privacy: PortfolioPrivacyPreferences;
}

const STATUS_CLASS: Record<ProfileVerification["status"], string> = {
  verified: styles.statusVerified,
  pending: styles.statusPending,
  unverified: styles.statusUnverified,
};

const STATUS_COPY: Record<ProfileVerification["status"], string> = {
  verified: "Verified",
  pending: "Pending",
  unverified: "Not verified",
};

const ACTIVITY_PERIOD_LABELS: Record<string, string> = {
  early_morning: "Early morning",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  late_night: "Late night",
};

export function ProfileOverview({
  profile,
  sanitizedPortfolio,
  verifications,
  privacy,
}: ProfileOverviewProps) {
  const headline = profile.headline?.trim() || `${profile.personality} energy seeking aligned co-pilot`;
  const location = profile.location?.trim() || "Location not shared";
  const bio = profile.bio?.trim() || "Add a short bio to showcase your Base-native vibe.";
  const avatarStyle = profile.avatarColor ? { background: profile.avatarColor } : undefined;
  const initials = profile.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className={styles.container} aria-label="Profile preview">
      <header className={styles.header}>
        <div className={styles.avatar} style={avatarStyle} aria-hidden>
          <span>{initials || "B"}</span>
        </div>
        <div className={styles.identity}>
          <h4 className={styles.displayName} data-testid="profile-preview-name">
            {profile.displayName}
          </h4>
          <span className={styles.meta}>
            {profile.basename ? `${profile.basename} • ` : ""}
            {location}
          </span>
        </div>
      </header>

      <p className={styles.headline}>{headline}</p>
      <p className={styles.bio}>{bio}</p>

      <div className={styles.section}>
        <h5>Achievements & badges</h5>
        {profile.achievements.length ? (
          <ul className={styles.badgeList} data-testid="profile-preview-achievements">
            {profile.achievements.map((achievement) => (
              <li key={achievement} className={styles.badge}>
                {achievement}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>Add at least one achievement to highlight your on-chain wins.</p>
        )}
      </div>

      <div className={styles.section}>
        <h5>Verification status</h5>
        {verifications.length ? (
          <ul className={styles.verificationList}>
            {verifications.map((verification) => (
              <li key={verification.id} className={styles.verification}>
                <div>
                  <strong>{verification.label}</strong>
                  {verification.detail ? <p>{verification.detail}</p> : null}
                </div>
                <span
                  className={`${styles.status} ${STATUS_CLASS[verification.status]}`}
                  data-testid={`verification-${verification.id}`}
                >
                  {STATUS_COPY[verification.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>Connect at least one verification to boost trust and discovery.</p>
        )}
      </div>

      <div className={styles.section}>
        <h5>What matches can see</h5>
        <div className={styles.portfolioGrid}>
          <div className={styles.portfolioRow}>
            <strong>Tokens</strong>
            {privacy.shareTokens && privacy.tokenVisibility !== "HIDDEN" && sanitizedPortfolio.tokens.length ? (
              <ul className={styles.tokenList} data-testid="profile-preview-tokens">
                {sanitizedPortfolio.tokens.map((token) => (
                  <li key={token.symbol}>
                    <span>{token.symbol}</span>
                    <small>{token.allocationBucket}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                {privacy.shareTokens && privacy.tokenVisibility !== "HIDDEN"
                  ? "No token insights shared yet."
                  : "Token visibility disabled for matches."}
              </p>
            )}
          </div>

          <div className={styles.portfolioRow}>
            <strong>DeFi</strong>
            {privacy.shareDefi && privacy.defiVisibility !== "HIDDEN" && sanitizedPortfolio.defiProtocols.length ? (
              <ul className={styles.protocolList}>
                {sanitizedPortfolio.defiProtocols.map((protocol) => (
                  <li key={protocol.name}>
                    <span>{protocol.name}</span>
                    <small>{protocol.category}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                {privacy.shareDefi && privacy.defiVisibility !== "HIDDEN"
                  ? "DeFi strategies hidden until you opt in."
                  : "DeFi visibility disabled for matches."}
              </p>
            )}
          </div>

          <div className={styles.portfolioRow}>
            <strong>NFTs</strong>
            {privacy.shareNfts && privacy.nftVisibility !== "HIDDEN" && sanitizedPortfolio.nftCollections.length ? (
              <ul className={styles.nftList}>
                {sanitizedPortfolio.nftCollections.map((collection) => (
                  <li key={collection.name}>
                    <span>{collection.name}</span>
                    <small>{collection.theme}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                {privacy.shareNfts && privacy.nftVisibility !== "HIDDEN"
                  ? "NFT galleries hidden until you add collections."
                  : "NFT visibility disabled for matches."}
              </p>
            )}
          </div>

          <div className={styles.portfolioRow}>
            <strong>Highlights</strong>
            {privacy.shareHighlights && sanitizedPortfolio.highlights.length ? (
              <ul className={styles.highlightList}>
                {sanitizedPortfolio.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                {privacy.shareHighlights
                  ? "No highlights shared yet."
                  : "Highlights hidden until you enable sharing."}
              </p>
            )}
          </div>

          <div className={styles.portfolioRow}>
            <strong>Activity</strong>
            {privacy.shareActivity && sanitizedPortfolio.activity ? (
              <div className={styles.activityCard}>
                <span>Timezone • {sanitizedPortfolio.activity.timezone}</span>
                {sanitizedPortfolio.activity.activePeriods.length ? (
                  <span className={styles.activityMeta}>
                    Active:
                    {" "}
                    {sanitizedPortfolio.activity.activePeriods
                      .map((period) => ACTIVITY_PERIOD_LABELS[period] ?? period)
                      .join(" · ")}
                  </span>
                ) : null}
                <span className={styles.activityMeta}>
                  Trading {sanitizedPortfolio.activity.tradingFrequency} • Risk {sanitizedPortfolio.activity.riskTolerance}
                </span>
              </div>
            ) : (
              <p className={styles.muted}>
                {privacy.shareActivity
                  ? "Activity patterns hidden at this visibility level."
                  : "Activity sharing disabled for matches."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
