import styles from "./MatchCard.module.css";
import type { MatchCandidate } from "@/lib/matching/compatibility";

export type MatchDecision = "pass" | "like" | "super";

interface MatchCardProps {
  candidate: MatchCandidate;
  isActive?: boolean;
  onDecision?: (decision: MatchDecision) => void;
}

const DECISION_COPY: Record<MatchDecision, { label: string; emoji: string }> = {
  pass: { label: "Pass", emoji: "👋" },
  like: { label: "Like", emoji: "🔥" },
  super: { label: "Super Like", emoji: "🚀" },
};

export function MatchCard({ candidate, isActive = false, onDecision }: MatchCardProps) {
  const initials = candidate.user.displayName
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const score = Math.round(candidate.compatibilityScore.overall * 100);

  return (
    <article className={`${styles.card} ${isActive ? styles.active : ""}`}>
      <header className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: candidate.user.avatarColor ?? "linear-gradient(135deg, #5f5bff, #00d1ff)" }}
          aria-hidden
        >
          <span>{initials}</span>
        </div>
        <div className={styles.headerContent}>
          <p className={styles.subtitle}>Compatibility</p>
          <h3 className={styles.title}>
            {candidate.user.displayName}
            <span className={styles.score}>{score}%</span>
          </h3>
          <p className={styles.meta}>
            {candidate.user.personality} • {candidate.compatibilityScore.category.label}
          </p>
        </div>
      </header>

      <p className={styles.highlight}>{candidate.compatibilityScore.category.highlight}</p>

      <section className={styles.factors} aria-label="Compatibility breakdown">
        {candidate.compatibilityScore.factors.map((factor) => (
          <div key={factor.id} className={styles.factor}>
            <div className={styles.factorHeader}>
              <span>{factor.label}</span>
              <span className={styles.factorScore}>{Math.round(factor.score * 100)}%</span>
            </div>
            <div className={styles.progress}>
              <span
                className={styles.progressValue}
                style={{ width: `${Math.max(6, factor.score * 100)}%` }}
              />
            </div>
            <p className={styles.factorSummary}>{factor.summary}</p>
          </div>
        ))}
      </section>

      <section className={styles.detailSection} aria-label="Why this match works">
        <h4>Shared signals</h4>
        <ul>
          {candidate.compatibilityScore.reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className={styles.detailSection} aria-label="Conversation starters">
        <h4>Conversation starters</h4>
        <ul>
          {candidate.icebreakers.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </section>

      <footer className={styles.actions}>
        {(Object.keys(DECISION_COPY) as MatchDecision[]).map((decision) => (
          <button
            key={decision}
            type="button"
            onClick={() => onDecision?.(decision)}
            className={styles.actionButton}
            data-variant={decision}
          >
            <span aria-hidden>{DECISION_COPY[decision].emoji}</span>
            {DECISION_COPY[decision].label}
          </button>
        ))}
      </footer>
    </article>
  );
}
