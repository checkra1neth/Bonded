"use client";

import React from "react";

import type { ChallengeHubView } from "../hooks/useChallengeHub";
import styles from "./ChallengeEventHub.module.css";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const toPercent = (value: number) => `${Math.round(value * 100)}%`;

interface ChallengeEventHubProps {
  view: ChallengeHubView;
  accessibleEvents?: ChallengeHubView["events"];
  lockedEvents?: ChallengeHubView["events"];
}

export function ChallengeEventHub({ view, accessibleEvents, lockedEvents = [] }: ChallengeEventHubProps) {
  const events = accessibleEvents ?? view.events;
  const { challenge, me, leaderboard, connections, badgeAwards, badgeDetails, projectedBadges, logProgress } = view;

  return (
    <section className={styles.container} aria-labelledby="challenge-hub-title">
      <header className={styles.header}>
        <div>
          <span className={styles.pill}>Weekly Base Challenge</span>
          <h2 id="challenge-hub-title">{challenge.theme}</h2>
          <p className={styles.summary}>{challenge.summary}</p>
        </div>
        <div className={styles.timeframe}>
          <span>{formatDate(challenge.startsAt)}</span>
          <span className={styles.timeframeDivider}>→</span>
          <span>{formatDate(challenge.endsAt)}</span>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.tasks}>
          <h3>Mission control</h3>
          <ul>
            {challenge.tasks.map((task) => {
              const progress = me.progress[task.id];
              const isComplete = progress?.status === "complete";
              const percent = progress ? progress.percentComplete : 0;
              return (
                <li key={task.id}>
                  <div className={styles.taskHeader}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.summary}</span>
                    </div>
                    <span className={`${styles.taskBadge} ${styles[`type-${task.type}`]}`}>{task.type}</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <span>{task.points} pts</span>
                    <span>
                      {progress?.completed ?? 0}/{task.target.goal} completed
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <span className={styles.progressValue} style={{ width: toPercent(percent) }} />
                  </div>
                  <div className={styles.taskFooter}>
                    <span className={styles.status} data-status={progress?.status ?? "not_started"}>
                      {progress?.status === "complete"
                        ? "Complete"
                        : progress?.status === "in_progress"
                        ? "In progress"
                        : "Not started"}
                    </span>
                    <button
                      type="button"
                      onClick={() => logProgress(task.id)}
                      disabled={isComplete}
                      className={styles.cta}
                    >
                      {isComplete ? "Mission logged" : "Log progress"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.panel} aria-labelledby="leaderboard-title">
            <h3 id="leaderboard-title">Squad leaderboard</h3>
            <ul className={styles.leaderboard}>
              {leaderboard.map((entry) => (
                <li key={entry.userId}>
                  <div>
                    <strong>{entry.displayName}</strong>
                    <span>{entry.focusAreas.slice(0, 2).join(" • ")}</span>
                  </div>
                  <div className={styles.leaderboardMeta}>
                    <span>{entry.points} pts</span>
                    <span className={`${styles.trend} ${styles[`trend-${entry.trend}`]}`}>{entry.trend}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="badges-title">
            <h3 id="badges-title">Badges & rewards</h3>
            <ul className={styles.badges}>
              {projectedBadges.map((projection) => {
                const badge = badgeDetails[projection.badgeId];
                return (
                  <li key={projection.badgeId}>
                    <div className={styles.badgeIcon}>{badge?.icon ?? "🏅"}</div>
                    <div>
                      <strong>{badge?.title ?? projection.badgeId}</strong>
                      <span>{projection.requirement}</span>
                    </div>
                    <div className={styles.badgeProgress}>
                      <span style={{ width: `${projection.percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {badgeAwards.length > 0 && (
              <p className={styles.badgeCallout}>
                <strong>{badgeAwards.length}</strong> badge{badgeAwards.length === 1 ? "" : "s"} issued this week
              </p>
            )}
          </section>
        </div>
      </div>

      <div className={styles.events}>
        <div className={styles.eventsHeader}>
          <h3>Challenge events</h3>
          <span>{events.length} sessions scheduled</span>
        </div>
        <div className={styles.eventGrid}>
          {events.map((event) => (
            <article key={event.id} className={styles.eventCard}>
              <header>
                <span className={`${styles.eventType} ${styles[`event-${event.type}`]}`}>{event.type.replace(/_/g, " ")}</span>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
              </header>
              <dl className={styles.eventMeta}>
                <div>
                  <dt>When</dt>
                  <dd>{formatDate(event.startTime)}</dd>
                </div>
                <div>
                  <dt>Host</dt>
                  <dd>{event.host}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>{event.focusAreas.join(" • ")}</dd>
                </div>
              </dl>
              <footer>
                <ul>
                  {event.agenda.slice(0, 3).map((item, index) => (
                    <li key={`${event.id}-agenda-${index}`}>
                      <strong>{item.title}</strong>
                      <span>{item.outcome}</span>
                    </li>
                  ))}
                </ul>
              </footer>
            </article>
          ))}
        </div>
        {lockedEvents.length > 0 && (
          <p className={styles.lockedNotice}>
            {lockedEvents.length} premium event{lockedEvents.length === 1 ? "" : "s"} available with Founder access.
          </p>
        )}
      </div>

      {connections.length > 0 && (
        <div className={styles.connections}>
          <h3>Connection spotlights</h3>
          <ul>
            {connections.map((connection) => (
              <li key={`${connection.eventId}-${connection.participants.map((participant) => participant.userId).join("-")}`}>
                <div>
                  <strong>{connection.participants.map((participant) => participant.displayName).join(" ↔ ")}</strong>
                  <span>{connection.reason}</span>
                </div>
                <span className={styles.connectionHighlight}>{connection.highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
