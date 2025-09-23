import type { PersonalityAssessment } from "@/lib/personality/types";
import styles from "./PersonalityHighlight.module.css";

export interface PersonalityHighlightProps {
  assessment: PersonalityAssessment;
  variant?: "default" | "compact";
}

export function PersonalityHighlight({ assessment, variant = "default" }: PersonalityHighlightProps) {
  const topScores = [...assessment.scores].sort((a, b) => b.score - a.score);
  const visibleScores = variant === "compact" ? topScores.slice(0, 2) : topScores.slice(0, 3);
  const confidence = Math.round(assessment.confidence * 100);

  return (
    <div className={`${styles.container} ${styles[variant] ?? ""}`}>
      <div className={styles.header}>
        <span className={styles.label}>Crypto personality</span>
        <div className={styles.titleRow}>
          <h4>{assessment.type}</h4>
          <span className={styles.confidence}>Confidence {confidence}%</span>
        </div>
        <p className={styles.headline}>{assessment.headline}</p>
        <p className={styles.summary}>{assessment.summary}</p>
      </div>

      <ul className={styles.scoreList}>
        {visibleScores.map((score) => (
          <li key={score.type}>
            <div className={styles.scoreHeader}>
              <span>{score.type}</span>
              <span className={styles.scoreValue}>{Math.round(score.score * 100)}%</span>
            </div>
            <div className={styles.progress} aria-hidden>
              <span
                className={styles.progressValue}
                style={{ width: `${Math.max(8, Math.round(score.score * 100))}%` }}
              />
            </div>
            <p className={styles.scoreDescription}>{score.description}</p>
          </li>
        ))}
      </ul>

      {variant === "default" ? (
        <div className={styles.footer}>
          <div>
            <h5>Strengths</h5>
            <ul>
              {assessment.strengths.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Growth edges</h5>
            <ul>
              {assessment.growthAreas.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <ul className={styles.strengthInline}>
          {assessment.strengths.slice(0, 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
