"use client";

import React from "react";
import type {
  ActivityVisibilityLevel,
  PortfolioPrivacyPreferences,
  PortfolioVisibilityLevel,
  TransactionVisibilityLevel,
} from "../../lib/portfolio/privacy";

import styles from "./ProfilePrivacyControls.module.css";

interface ProfilePrivacyControlsProps {
  privacy: PortfolioPrivacyPreferences;
  allowListInputs: {
    fids: string;
    wallets: string;
  };
  onToggleShare: (
    key:
      | "shareTokens"
      | "shareDefi"
      | "shareNfts"
      | "shareActivity"
      | "shareHighlights",
  ) => void;
  onVisibilityChange: (
    key: "tokenVisibility" | "defiVisibility" | "nftVisibility",
    value: PortfolioVisibilityLevel,
  ) => void;
  onActivityVisibilityChange: (value: ActivityVisibilityLevel) => void;
  onAllowListChange: (field: "fids" | "wallets", value: string) => void;
  onAdvancedToggle: (key: AdvancedPrivacyKey) => void;
  onTransactionVisibilityChange: (value: TransactionVisibilityLevel) => void;
  onTransactionWindowChange: (value: number) => void;
}

type AdvancedPrivacyKey =
  | "maskTokenConviction"
  | "maskTokenChains"
  | "maskDefiStrategies"
  | "maskDefiRisks"
  | "maskNftThemes"
  | "maskActivityRisk"
  | "redactHighlights"
  | "shareTransactions";

const VISIBILITY_LABELS: Record<PortfolioVisibilityLevel, string> = {
  HIDDEN: "Hidden",
  SUMMARY: "Summary",
  DETAILED: "Detailed",
};

const ACTIVITY_LABELS: Record<ActivityVisibilityLevel, string> = {
  HIDDEN: "Hidden",
  TIMEZONE_ONLY: "Timezone only",
  PATTERNS: "Patterns",
};

const TRANSACTION_VISIBILITY_LABELS: Record<TransactionVisibilityLevel, string> = {
  HIDDEN: "Hidden",
  ANONYMIZED: "Anonymized buckets",
  SUMMARY: "Privacy-safe summary",
};

const ADVANCED_TOGGLES: Array<{
  key: AdvancedPrivacyKey;
  label: string;
  description: string;
}> = [
  {
    key: "maskTokenConviction",
    label: "Hide conviction scores",
    description: "Only share allocation buckets, never conviction labels.",
  },
  {
    key: "maskTokenChains",
    label: "Hide chain provenance",
    description: "Strip Base/L2 chain tags from shared token data.",
  },
  {
    key: "maskDefiStrategies",
    label: "Mask DeFi strategies",
    description: "Share protocols without revealing strategy notes.",
  },
  {
    key: "maskDefiRisks",
    label: "Hide risk scoring",
    description: "Keep personal risk appetite private in shared views.",
  },
  {
    key: "maskNftThemes",
    label: "Redact NFT themes",
    description: "Share presence without exposing collection themes.",
  },
  {
    key: "maskActivityRisk",
    label: "Mask risk tolerance",
    description: "Display timezone windows while hiding risk alignment.",
  },
  {
    key: "redactHighlights",
    label: "Redact highlight details",
    description: "Swap precise milestones for privacy-safe summaries.",
  },
];

export function ProfilePrivacyControls({
  privacy,
  allowListInputs,
  onToggleShare,
  onVisibilityChange,
  onActivityVisibilityChange,
  onAllowListChange,
  onAdvancedToggle,
  onTransactionVisibilityChange,
  onTransactionWindowChange,
}: ProfilePrivacyControlsProps) {
  return (
    <section className={styles.container} aria-label="Privacy controls">
      <div className={styles.header}>
        <h4>Privacy controls</h4>
        <p>Decide how much of your portfolio signal you want surfaced to fresh matches.</p>
      </div>

      <div className={styles.toggleGrid}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareTokens}
            onChange={() => onToggleShare("shareTokens")}
          />
          <span>
            <strong>Share token allocations</strong>
            Show a curated slice of your top holdings.
          </span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareDefi}
            onChange={() => onToggleShare("shareDefi")}
          />
          <span>
            <strong>Share DeFi strategies</strong>
            Highlight active protocols to spark strategy talk.
          </span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareNfts}
            onChange={() => onToggleShare("shareNfts")}
          />
          <span>
            <strong>Show NFT galleries</strong>
            Surface collections that reflect your vibe.
          </span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareActivity}
            onChange={() => onToggleShare("shareActivity")}
          />
          <span>
            <strong>Share activity rhythm</strong>
            Sync on active hours without exposing exact timestamps.
          </span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareHighlights}
            onChange={() => onToggleShare("shareHighlights")}
          />
          <span>
            <strong>Display highlights</strong>
            Share sanitized milestones from your on-chain history.
          </span>
        </label>
      </div>

      <div className={styles.visibilityGrid}>
        <label>
          <span>Token visibility</span>
          <select
            value={privacy.tokenVisibility}
            onChange={(event) => onVisibilityChange("tokenVisibility", event.target.value as PortfolioVisibilityLevel)}
          >
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>DeFi visibility</span>
          <select
            value={privacy.defiVisibility}
            onChange={(event) => onVisibilityChange("defiVisibility", event.target.value as PortfolioVisibilityLevel)}
          >
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>NFT visibility</span>
          <select
            value={privacy.nftVisibility}
            onChange={(event) => onVisibilityChange("nftVisibility", event.target.value as PortfolioVisibilityLevel)}
          >
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Activity visibility</span>
          <select
            value={privacy.activityVisibility}
            onChange={(event) =>
              onActivityVisibilityChange(event.target.value as ActivityVisibilityLevel)
            }
          >
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.allowList}>
        <div>
          <h5>Allow list (optional)</h5>
          <p>Gate deeper insights to specific Farcaster friends or wallet addresses.</p>
        </div>
        <label>
          <span>Farcaster FIDs</span>
          <input
            type="text"
            value={allowListInputs.fids}
            placeholder="1234, 7777"
            onChange={(event) => onAllowListChange("fids", event.target.value)}
          />
        </label>
        <label>
          <span>Wallet addresses</span>
          <textarea
            value={allowListInputs.wallets}
            placeholder="0xabc..., base:ava.eth"
            rows={2}
            onChange={(event) => onAllowListChange("wallets", event.target.value)}
          />
        </label>
      </div>

      <div className={styles.advancedSection}>
        <div className={styles.advancedHeader}>
          <h5>Advanced privacy filters</h5>
          <p>Mask additional metadata before sharing snapshots.</p>
        </div>
        <div className={styles.advancedGrid}>
          {ADVANCED_TOGGLES.map(({ key, label, description }) => (
            <label key={key} className={styles.toggle}>
              <input
                type="checkbox"
                checked={Boolean(privacy[key])}
                onChange={() => onAdvancedToggle(key)}
              />
              <span>
                <strong>{label}</strong>
                {description}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.transactionSection}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={privacy.shareTransactions}
            onChange={() => onAdvancedToggle("shareTransactions")}
          />
          <span>
            <strong>Share anonymized transaction flow</strong>
            Publish only bucketed inbound/outbound counts with masked counterparties.
          </span>
        </label>

        {privacy.shareTransactions ? (
          <div className={styles.transactionControls}>
            <label>
              <span>Visibility mode</span>
              <select
                value={privacy.transactionVisibility}
                onChange={(event) =>
                  onTransactionVisibilityChange(event.target.value as TransactionVisibilityLevel)
                }
              >
                {Object.entries(TRANSACTION_VISIBILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Rolling window (days)</span>
              <input
                type="number"
                min={1}
                max={365}
                value={privacy.transactionWindowDays}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  onTransactionWindowChange(Number.isFinite(parsed) ? parsed : privacy.transactionWindowDays);
                }}
              />
            </label>
            <p className={styles.transactionCopy}>
              We aggregate transfers into privacy-safe buckets and mask counterparties using hashed labels.
            </p>
          </div>
        ) : (
          <p className={styles.transactionCopy}>
            Keep this disabled to prevent any transaction cadence data from leaving your vault.
          </p>
        )}
      </div>
    </section>
  );
}
