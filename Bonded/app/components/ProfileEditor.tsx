"use client";

import React, { type KeyboardEvent, useEffect, useState } from "react";

import type {
  ProfileVerification,
  ProfileVerificationStatus,
} from "../../lib/matching/compatibility";

import styles from "./ProfileEditor.module.css";

interface ProfileDraft {
  displayName: string;
  basename: string;
  headline: string;
  bio: string;
  location: string;
}

interface ProfileEditorProps {
  profile: ProfileDraft;
  achievements: string[];
  verifications: ProfileVerification[];
  onProfileChange: <Field extends keyof ProfileDraft>(field: Field, value: ProfileDraft[Field]) => void;
  onAddAchievement: (value: string) => boolean;
  onRemoveAchievement: (value: string) => void;
  onVerificationChange: (id: string, status: ProfileVerificationStatus) => void;
}

export function ProfileEditor({
  profile,
  achievements,
  verifications,
  onProfileChange,
  onAddAchievement,
  onRemoveAchievement,
  onVerificationChange,
}: ProfileEditorProps) {
  const [achievementDraft, setAchievementDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleAchievementSubmit = () => {
    const success = onAddAchievement(achievementDraft);
    if (success) {
      setAchievementDraft("");
      setFeedback("Badge added to your profile preview.");
    } else if (achievementDraft.trim().length) {
      setFeedback("That highlight is already part of your profile.");
    }
  };

  const handleAchievementKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAchievementSubmit();
    }
  };

  return (
    <section className={styles.container} aria-label="Profile editor">
      <div className={styles.header}>
        <h3>Profile editor</h3>
        <p>Fine-tune how your matches experience your Base-native identity.</p>
      </div>

      <div className={styles.fieldGrid}>
        <label>
          <span>Display name</span>
          <input
            type="text"
            value={profile.displayName}
            onChange={(event) => onProfileChange("displayName", event.target.value)}
          />
        </label>
        <label>
          <span>Basename</span>
          <input
            type="text"
            value={profile.basename}
            placeholder="ava.base"
            onChange={(event) => onProfileChange("basename", event.target.value)}
          />
        </label>
        <label>
          <span>Location</span>
          <input
            type="text"
            value={profile.location}
            placeholder="New York • EST"
            onChange={(event) => onProfileChange("location", event.target.value)}
          />
        </label>
      </div>

      <label className={styles.fullWidth}>
        <span>Headline</span>
        <input
          type="text"
          value={profile.headline}
          placeholder="Base energy seeking aligned co-pilot"
          onChange={(event) => onProfileChange("headline", event.target.value)}
        />
      </label>

      <label className={styles.fullWidth}>
        <span>Bio</span>
        <textarea
          value={profile.bio}
          placeholder="Share how you blend on-chain moves with real-world energy."
          onChange={(event) => onProfileChange("bio", event.target.value)}
        />
      </label>

      <div className={styles.achievementSection}>
        <div className={styles.achievementHeader}>
          <h4>Achievements & badges</h4>
          <span>{achievements.length} curated</span>
        </div>
        {achievements.length ? (
          <ul className={styles.achievementList}>
            {achievements.map((achievement) => (
              <li key={achievement} className={styles.achievementChip}>
                <span>{achievement}</span>
                <button type="button" onClick={() => onRemoveAchievement(achievement)} aria-label={`Remove ${achievement}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.feedback}>Add at least one badge to boost discovery.</p>
        )}
        <div className={styles.addAchievement}>
          <input
            type="text"
            value={achievementDraft}
            placeholder="Add a highlight (e.g. Base OG)"
            onChange={(event) => setAchievementDraft(event.target.value)}
            onKeyDown={handleAchievementKeyDown}
          />
          <button type="button" onClick={handleAchievementSubmit} disabled={!achievementDraft.trim()}>
            Add highlight
          </button>
        </div>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </div>

      <div className={styles.verificationSection}>
        <h4>Verification signals</h4>
        <p>Keep your verifications fresh to increase trust and unlock premium matching tiers.</p>
        <ul className={styles.verificationList}>
          {verifications.map((verification) => (
            <li key={verification.id} className={styles.verificationItem}>
              <label htmlFor={`verification-${verification.id}`}>
                <span>{verification.label}</span>
                {verification.detail ? <p>{verification.detail}</p> : null}
              </label>
              <select
                id={`verification-${verification.id}`}
                value={verification.status}
                onChange={(event) =>
                  onVerificationChange(verification.id, event.target.value as ProfileVerificationStatus)
                }
              >
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="unverified">Not verified</option>
              </select>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
