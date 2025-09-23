"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CompatibilityProfile,
  ProfileVerification,
  ProfileVerificationStatus,
} from "../../lib/matching/compatibility";
import {
  DEFAULT_PRIVACY_PREFERENCES,
  applyPrivacyPreferences,
  normalizePrivacyPreferences,
  type ActivityVisibilityLevel,
  type PortfolioPrivacyPreferences,
  type PortfolioVisibilityLevel,
} from "../../lib/portfolio/privacy";
import type { SanitizedPortfolioSnapshot } from "../../lib/portfolio/types";

import { ProfileEditor } from "./ProfileEditor";
import { ProfileOverview } from "./ProfileOverview";
import { ProfilePrivacyControls } from "./ProfilePrivacyControls";
import styles from "./ProfileManagementPanel.module.css";

interface ProfileDraft {
  displayName: string;
  basename: string;
  headline: string;
  bio: string;
  location: string;
}

interface ProfileManagementPanelProps {
  profile: CompatibilityProfile;
}

const DEFAULT_VERIFICATIONS: ProfileVerification[] = [
  {
    id: "wallet",
    label: "Wallet ownership",
    status: "verified",
    detail: "Signature confirmed on Base within the last 24 hours.",
    lastChecked: new Date("2024-10-01T09:00:00Z").getTime(),
  },
  {
    id: "basename",
    label: "Basename linked",
    status: "pending",
    detail: "Awaiting reverse record confirmation.",
    lastChecked: new Date("2024-09-29T17:30:00Z").getTime(),
  },
  {
    id: "proof_of_humanity",
    label: "Humanity proof",
    status: "unverified",
    detail: "Optional boost for premium discovery tiers.",
  },
];

export function ProfileManagementPanel({ profile }: ProfileManagementPanelProps) {
  const initialPrivacy = useMemo(
    () => normalizePrivacyPreferences(DEFAULT_PRIVACY_PREFERENCES),
    [],
  );

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => ({
    displayName: profile.user.displayName,
    basename: profile.user.basename ?? "",
    headline:
      profile.user.headline ?? `${profile.user.personality} energy seeking aligned co-pilot`,
    bio: profile.user.bio ?? "",
    location: profile.user.location ?? "",
  }));
  const [achievements, setAchievements] = useState<string[]>(
    () => profile.user.achievements ?? [],
  );
  const [privacy, setPrivacy] = useState<PortfolioPrivacyPreferences>(initialPrivacy);
  const [allowListInputs, setAllowListInputs] = useState(() => ({
    fids: initialPrivacy.allowList.fids.join(", "),
    wallets: initialPrivacy.allowList.walletAddresses.join(", "),
  }));
  const [verifications, setVerifications] = useState<ProfileVerification[]>(() =>
    mergeVerifications(profile.user.verifications),
  );
  const [pendingRevision, setPendingRevision] = useState(0);
  const [syncState, setSyncState] = useState<"idle" | "saving">("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());

  const sanitizedPortfolio = useMemo<SanitizedPortfolioSnapshot>(
    () => applyPrivacyPreferences(profile.portfolio, privacy),
    [privacy, profile.portfolio],
  );

  const markDirty = useCallback(() => {
    setPendingRevision((value) => value + 1);
    setSyncState("saving");
  }, []);

  useEffect(() => {
    if (pendingRevision === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLastSyncedAt(Date.now());
      setSyncState("idle");
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [pendingRevision]);

  const handleProfileChange = useCallback(
    <Field extends keyof ProfileDraft>(field: Field, value: ProfileDraft[Field]) => {
      let changed = false;
      setProfileDraft((prev) => {
        if (prev[field] === value) {
          return prev;
        }
        changed = true;
        return {
          ...prev,
          [field]: value,
        };
      });

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleAchievementAdd = useCallback(
    (value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return false;
      }

      let added = false;
      setAchievements((prev) => {
        if (prev.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
          return prev;
        }
        added = true;
        return [...prev, normalized];
      });

      if (added) {
        markDirty();
      }

      return added;
    },
    [markDirty],
  );

  const handleAchievementRemove = useCallback(
    (value: string) => {
      let removed = false;
      setAchievements((prev) => {
        if (!prev.includes(value)) {
          return prev;
        }
        removed = true;
        return prev.filter((entry) => entry !== value);
      });

      if (removed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleToggleShare = useCallback(
    (
      key:
        | "shareTokens"
        | "shareDefi"
        | "shareNfts"
        | "shareActivity"
        | "shareHighlights",
    ) => {
      let changed = false;
      setPrivacy((prev) => {
        const next = {
          ...prev,
          [key]: !prev[key],
        } as PortfolioPrivacyPreferences;
        changed = next[key] !== prev[key];
        return next;
      });

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleVisibilityChange = useCallback(
    (key: "tokenVisibility" | "defiVisibility" | "nftVisibility", value: PortfolioVisibilityLevel) => {
      let changed = false;
      setPrivacy((prev) => {
        if (prev[key] === value) {
          return prev;
        }
        changed = true;
        return {
          ...prev,
          [key]: value,
        };
      });

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleActivityVisibilityChange = useCallback(
    (value: ActivityVisibilityLevel) => {
      let changed = false;
      setPrivacy((prev) => {
        if (prev.activityVisibility === value) {
          return prev;
        }
        changed = true;
        return {
          ...prev,
          activityVisibility: value,
        };
      });

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleAllowListChange = useCallback(
    (field: "fids" | "wallets", value: string) => {
      setAllowListInputs((prev) => ({
        ...prev,
        [field]: value,
      }));

      let changed = false;
      setPrivacy((prev) => {
        const nextAllowList =
          field === "fids"
            ? {
                ...prev.allowList,
                fids: parseFids(value),
              }
            : {
                ...prev.allowList,
                walletAddresses: parseWallets(value),
              };

        const normalized = normalizePrivacyPreferences({
          ...prev,
          allowList: nextAllowList,
        });

        const prevValues =
          field === "fids" ? prev.allowList.fids : prev.allowList.walletAddresses;
        const nextValues =
          field === "fids"
            ? normalized.allowList.fids
            : normalized.allowList.walletAddresses;

        if (arraysEqual(prevValues, nextValues)) {
          return prev;
        }

        changed = true;
        return normalized;
      });

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const handleVerificationChange = useCallback(
    (id: string, status: ProfileVerificationStatus) => {
      let changed = false;
      setVerifications((prev) =>
        prev.map((verification) => {
          if (verification.id !== id) {
            return verification;
          }
          if (verification.status === status) {
            return verification;
          }
          changed = true;
          return {
            ...verification,
            status,
            lastChecked: Date.now(),
          };
        }),
      );

      if (changed) {
        markDirty();
      }
    },
    [markDirty],
  );

  const previewProfile = useMemo(
    () => ({
      displayName: profileDraft.displayName,
      basename: profileDraft.basename,
      personality: profile.user.personality,
      headline: profileDraft.headline,
      location: profileDraft.location,
      bio: profileDraft.bio,
      avatarColor: profile.user.avatarColor,
      achievements,
    }),
    [achievements, profile.user.avatarColor, profile.user.personality, profileDraft],
  );

  return (
    <section className={styles.container} aria-labelledby="profile-management-heading">
      <header className={styles.header}>
        <div>
          <h2 id="profile-management-heading">Profile management</h2>
          <p>Keep your Base identity, achievements, and portfolio privacy in sync.</p>
        </div>
        <div className={styles.status} data-testid="profile-sync-status">
          <strong>{syncState === "saving" ? "Saving changes" : "All changes saved"}</strong>
          <span>
            {syncState === "saving"
              ? "Updating preview in real time"
              : `Last synced ${formatRelativeTime(lastSyncedAt)}`}
          </span>
        </div>
      </header>

      <div className={styles.grid}>
        <ProfileEditor
          profile={profileDraft}
          achievements={achievements}
          verifications={verifications}
          onProfileChange={handleProfileChange}
          onAddAchievement={handleAchievementAdd}
          onRemoveAchievement={handleAchievementRemove}
          onVerificationChange={handleVerificationChange}
        />
        <ProfileOverview
          profile={previewProfile}
          sanitizedPortfolio={sanitizedPortfolio}
          verifications={verifications}
          privacy={privacy}
        />
      </div>

      <div className={styles.footer}>
        <ProfilePrivacyControls
          privacy={privacy}
          allowListInputs={allowListInputs}
          onToggleShare={handleToggleShare}
          onVisibilityChange={handleVisibilityChange}
          onActivityVisibilityChange={handleActivityVisibilityChange}
          onAllowListChange={handleAllowListChange}
        />
      </div>
    </section>
  );
}

function mergeVerifications(custom: ProfileVerification[] | undefined): ProfileVerification[] {
  const base = new Map<string, ProfileVerification>(
    DEFAULT_VERIFICATIONS.map((verification) => [verification.id, { ...verification }]),
  );

  for (const verification of custom ?? []) {
    base.set(verification.id, { ...base.get(verification.id), ...verification });
  }

  return Array.from(base.values());
}

function parseFids(value: string): number[] {
  return Array.from(
    new Set(
      value
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => Number.parseInt(entry, 10))
        .filter((fid) => Number.isInteger(fid) && fid >= 0),
    ),
  );
}

function parseWallets(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.toLowerCase()),
    ),
  );
}

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
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
