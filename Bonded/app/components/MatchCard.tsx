import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";

import styles from "./MatchCard.module.css";
import type { MatchCandidate, MatchDecision } from "@/lib/matching/compatibility";
import { PersonalityHighlight } from "./PersonalityHighlight";
import { useMobileExperience } from "../hooks/useMobileExperience";

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

const HORIZONTAL_THRESHOLD = 120;
const VERTICAL_THRESHOLD = 140;
const INTENT_PREVIEW_THRESHOLD = 45;
const EXIT_TRANSFORMS: Record<MatchDecision, { x: number; y: number }> = {
  pass: { x: -560, y: -40 },
  like: { x: 560, y: -40 },
  super: { x: 0, y: -640 },
};

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
};

const initialDragState: DragState = {
  active: false,
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
};

export function MatchCard({ candidate, isActive = false, onDecision }: MatchCardProps) {
  const initials = candidate.user.displayName
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const score = Math.round(candidate.compatibilityScore.overall * 100);

  const { connection, miniKit } = useMobileExperience();
  const miniKitReady = miniKit.ready;
  const miniKitHaptics = miniKit.haptics;
  const saveData = connection?.saveData ?? false;
  const slowNetwork = connection?.effectiveType
    ? /(2g|slow-2g)/i.test(connection.effectiveType)
    : false;
  const factorLimit = saveData ? 2 : slowNetwork ? 3 : candidate.compatibilityScore.factors.length;
  const reasoningLimit = saveData
    ? 3
    : slowNetwork
      ? 4
      : candidate.compatibilityScore.reasoning.length;
  const icebreakerLimit = saveData ? 2 : slowNetwork ? 3 : candidate.icebreakers.length;

  const [drag, setDrag] = useState<DragState>(initialDragState);
  const [intent, setIntent] = useState<MatchDecision | null>(null);
  const [outcome, setOutcome] = useState<MatchDecision | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const intentHapticRef = useRef<MatchDecision | null>(null);

  const factors = useMemo(
    () => candidate.compatibilityScore.factors.slice(0, Math.max(1, factorLimit)),
    [candidate.compatibilityScore.factors, factorLimit],
  );

  const reasoning = useMemo(
    () => candidate.compatibilityScore.reasoning.slice(0, Math.max(1, reasoningLimit)),
    [candidate.compatibilityScore.reasoning, reasoningLimit],
  );

  const icebreakers = useMemo(
    () => candidate.icebreakers.slice(0, Math.max(1, icebreakerLimit)),
    [candidate.icebreakers, icebreakerLimit],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    pointerIdRef.current = null;
    setDrag(() => ({ ...initialDragState }));
    setIntent(null);
    setOutcome(null);
  }, [candidate.user.id]);

  const calculateIntent = (x: number, y: number): MatchDecision | null => {
    if (x > INTENT_PREVIEW_THRESHOLD) {
      return "like";
    }
    if (x < -INTENT_PREVIEW_THRESHOLD) {
      return "pass";
    }
    if (-y > INTENT_PREVIEW_THRESHOLD && Math.abs(y) > Math.abs(x)) {
      return "super";
    }
    return null;
  };

  const determineDecision = (x: number, y: number): MatchDecision | null => {
    if (x > HORIZONTAL_THRESHOLD) {
      return "like";
    }
    if (x < -HORIZONTAL_THRESHOLD) {
      return "pass";
    }
    if (-y > VERTICAL_THRESHOLD) {
      return "super";
    }
    return null;
  };

  const triggerDecision = (decision: MatchDecision) => {
    if (!onDecision || outcome) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (miniKitReady && miniKitHaptics?.impactOccurred) {
      const style = decision === "super" ? "heavy" : decision === "pass" ? "light" : "medium";
      miniKitHaptics.impactOccurred(style);
    }

    setIntent(decision);
    setOutcome(decision);
    setDrag({
      active: false,
      startX: 0,
      startY: 0,
      x: EXIT_TRANSFORMS[decision].x,
      y: EXIT_TRANSFORMS[decision].y,
    });

    timeoutRef.current = window.setTimeout(() => {
      onDecision(decision);
    }, 240);
  };

  const resetDrag = () => {
    setDrag(() => ({ ...initialDragState }));
    setIntent(null);
    intentHapticRef.current = null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!isActive || outcome) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
    });

    if (miniKitReady && miniKitHaptics?.impactOccurred) {
      miniKitHaptics.impactOccurred("light");
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.active || pointerIdRef.current !== event.pointerId || outcome) {
      return;
    }

    const x = event.clientX - drag.startX;
    const y = event.clientY - drag.startY;
    setDrag((current) => ({ ...current, x, y }));
    setIntent(calculateIntent(x, y));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLElement>) => {
    if (!drag.active || pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const decision = determineDecision(drag.x, drag.y);
    if (decision) {
      triggerDecision(decision);
      return;
    }

    resetDrag();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
  };

  const handleButtonDecision = (decision: MatchDecision) => {
    triggerDecision(decision);
  };

  useEffect(() => {
    if (!miniKitReady || !miniKitHaptics?.selectionChanged) {
      return;
    }

    if (!intent) {
      intentHapticRef.current = null;
      return;
    }

    if (intentHapticRef.current === intent) {
      return;
    }

    miniKitHaptics.selectionChanged();
    intentHapticRef.current = intent;
  }, [intent, miniKitHaptics, miniKitReady]);

  useEffect(() => {
    if (!miniKitReady || !miniKitHaptics?.notificationOccurred || !outcome) {
      return;
    }

    const tone = outcome === "pass" ? "warning" : "success";
    miniKitHaptics.notificationOccurred(tone);
  }, [miniKitHaptics, miniKitReady, outcome]);

  const baseScale = isActive ? 1.01 : 1;
  const translateY = drag.y + (isActive ? -6 : 0);
  const transform = `translate3d(${drag.x}px, ${translateY}px, 0) rotate(${drag.x * 0.04}deg) scale(${baseScale})`;
  const cardStyle: CSSProperties = {
    transform,
    transition: drag.active ? "none" : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
    cursor: isActive ? (drag.active ? "grabbing" : "grab") : "default",
  };

  return (
    <article
      className={`${styles.card} ${isActive ? styles.active : ""}`}
      data-intent={intent ?? undefined}
      data-outcome={outcome ?? undefined}
      data-dragging={drag.active}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
      style={cardStyle}
    >
      <div className={styles.swipeOverlay} data-intent={intent ?? outcome ?? "none"} aria-hidden>
        <span data-role="like">Like</span>
        <span data-role="super">Super Like</span>
        <span data-role="pass">Pass</span>
      </div>
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

      <div className={styles.personalitySection}>
        <PersonalityHighlight assessment={candidate.personality} variant="compact" />
      </div>

      <section className={styles.factors} aria-label="Compatibility breakdown">
        {factors.map((factor) => (
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
          {reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className={styles.detailSection} aria-label="Conversation starters">
        <h4>Conversation starters</h4>
        <ul>
          {icebreakers.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </section>

      <footer className={styles.actions}>
        {(Object.keys(DECISION_COPY) as MatchDecision[]).map((decision) => (
          <button
            key={decision}
            type="button"
            onClick={() => handleButtonDecision(decision)}
            className={styles.actionButton}
            data-variant={decision}
            disabled={Boolean(outcome)}
          >
            <span aria-hidden>{DECISION_COPY[decision].emoji}</span>
            {DECISION_COPY[decision].label}
          </button>
        ))}
      </footer>
    </article>
  );
}
