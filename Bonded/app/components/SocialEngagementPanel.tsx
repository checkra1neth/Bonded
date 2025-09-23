"use client";

import React from "react";

import { useSocialEngagement } from "../hooks/useSocialEngagement";
import styles from "./SocialEngagementPanel.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

const timeSince = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const days = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const rarityLabel: Record<string, string> = {
  core: "Core",
  elite: "Elite",
  legendary: "Legendary",
};

export function SocialEngagementPanel() {
  const {
    achievements,
    shareOptions,
    successStories,
    leaderboards,
    referral,
    shareTotals,
    lastShare,
    shareAchievement,
  } = useSocialEngagement();

  return (
    <section className={styles.container} aria-labelledby="social-engagement-title">
      <header className={styles.header}>
        <div>
          <span className={styles.pill}>Community signal</span>
          <h2 id="social-engagement-title">Social engagement hub</h2>
          <p>
            Celebrate your onchain wins, see who is lighting up the community feed, and convert your referral energy into
            rewards.
          </p>
        </div>
        <div className={styles.stats}>
          <div>
            <span>{Object.values(shareTotals).reduce((total, value) => total + value, 0)}</span>
            <small>Shares triggered</small>
          </div>
          <div>
            <span>{referral.conversions}</span>
            <small>Referral conversions</small>
          </div>
          <div>
            <span>{leaderboards[0]?.entries[0]?.points ?? 0}</span>
            <small>Top connector pts</small>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <article className={styles.achievements} aria-labelledby="achievements-title">
          <div className={styles.sectionHeader}>
            <h3 id="achievements-title">Achievements & badges</h3>
            <span>Showcase milestones and broadcast them to your circles.</span>
          </div>
          <ul className={styles.achievementList}>
            {achievements.map((achievement) => (
              <li key={achievement.id} className={styles.achievementCard}>
                <div className={styles.badgeIcon} aria-hidden="true">
                  {achievement.badge?.icon ?? "🏅"}
                </div>
                <div className={styles.achievementContent}>
                  <div className={styles.achievementHeader}>
                    <div>
                      <strong>{achievement.title}</strong>
                      <span>{achievement.description}</span>
                    </div>
                    <span className={`${styles.rarity} ${styles[`rarity-${achievement.rarity}`]}`}>
                      {rarityLabel[achievement.rarity] ?? achievement.rarity}
                    </span>
                  </div>
                  <div className={styles.achievementMeta}>
                    <span>{achievement.spotlight}</span>
                    <span>
                      Earned {dateFormatter.format(achievement.earnedAt)} • {timeSince(achievement.earnedAt)}
                    </span>
                  </div>
                  <div className={styles.shareRow}>
                    <span className={styles.shareLabel}>
                      {shareTotals[achievement.id] ?? 0} share{(shareTotals[achievement.id] ?? 0) === 1 ? "" : "s"}
                    </span>
                    <div className={styles.shareActions}>
                      {shareOptions[achievement.id]?.map((option) => (
                        <button
                          key={`${achievement.id}-${option.channel}`}
                          type="button"
                          className={styles.shareButton}
                          data-channel={option.channel}
                          onClick={() => shareAchievement(achievement.id, option.channel)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.successStories} aria-labelledby="stories-title">
          <div className={styles.sectionHeader}>
            <h3 id="stories-title">Success stories</h3>
            <span>Social proof from couples who met through Bonded challenges.</span>
          </div>
          <ul>
            {successStories.map((story) => (
              <li key={story.id} className={styles.storyCard}>
                <header>
                  <strong>{story.headline}</strong>
                  <span>{story.summary}</span>
                </header>
                <blockquote>“{story.quote}”</blockquote>
                <footer>
                  <span>
                    {story.pair.seeker} × {story.pair.partner}
                  </span>
                  <ul>
                    {story.metrics.map((metric) => (
                      <li key={`${story.id}-${metric.label}`}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </li>
                    ))}
                  </ul>
                </footer>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.leaderboards} aria-labelledby="leaderboard-title">
          <div className={styles.sectionHeader}>
            <h3 id="leaderboard-title">Community leaderboards</h3>
            <span>Track who is driving culture, conversions, and coordination.</span>
          </div>
          <div className={styles.leaderboardGrid}>
            {leaderboards.map((board) => (
              <section key={board.id} className={styles.leaderboardCard} aria-label={board.title}>
                <header>
                  <strong>{board.title}</strong>
                  <span>{board.description}</span>
                </header>
                <ol>
                  {board.entries.map((entry) => (
                    <li key={entry.userId}>
                      <div className={styles.entryMeta}>
                        <span className={styles.rank}>{entry.rank}</span>
                        <div>
                          <strong>{entry.displayName}</strong>
                          <span>{entry.category}</span>
                        </div>
                      </div>
                      <div className={styles.entryStats}>
                        <span>{entry.points} pts</span>
                        <span className={styles.rankDelta} data-delta={Math.sign(entry.change)}>
                          {entry.change >= 0 ? `↑${entry.change}` : `↓${Math.abs(entry.change)}`}
                        </span>
                      </div>
                      <p>{entry.highlight}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </article>

        <article className={styles.referral} aria-labelledby="referral-title">
          <div className={styles.sectionHeader}>
            <h3 id="referral-title">Referral rewards</h3>
            <span>Mobilize your network and unlock premium perks.</span>
          </div>
          <div className={styles.referralCard}>
            <div className={styles.referralHeader}>
              <div>
                <strong>{referral.tier.label}</strong>
                <span>{referral.tier.reward}</span>
              </div>
              <code>{referral.code}</code>
            </div>
            <p>
              {referral.conversions} conversions out of {referral.invitesSent} invites sent.{" "}
              {referral.nextTier
                ? `Only ${Math.max(referral.nextTier.requiredInvites - referral.conversions, 0)} more to reach ${referral.nextTier.label}.`
                : "You have unlocked every tier available!"}
            </p>
            <div className={styles.progressTrack}>
              <span className={styles.progressValue} style={{ width: `${Math.max(referral.progressPercent, 4)}%` }} />
            </div>
            {referral.bonusAvailable && referral.bonusDescription ? (
              <p className={styles.bonus}>{referral.bonusDescription}</p>
            ) : null}
            <h4>Rewards unlocked</h4>
            <ul className={styles.ledger}>
              {referral.ledger.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.label}</strong>
                    <span>{entry.reward}</span>
                  </div>
                  <time dateTime={new Date(entry.awardedAt).toISOString()}>
                    {dateFormatter.format(entry.awardedAt)}
                  </time>
                </li>
              ))}
            </ul>
            <a className={styles.referralLink} href={referral.shareUrl} target="_blank" rel="noreferrer">
              Share your invite link
            </a>
          </div>
        </article>
      </div>

      {lastShare ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <strong>Share prepared</strong>
          <span>
            {lastShare.channel === "copy"
              ? "Copied achievement link to your clipboard."
              : `Open the ${lastShare.channel} composer to publish.`}
          </span>
        </div>
      ) : null}
    </section>
  );
}
