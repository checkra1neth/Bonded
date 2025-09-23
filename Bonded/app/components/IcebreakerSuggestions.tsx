"use client";

import { useEffect, useMemo, useState } from "react";

import type { MutualMatch } from "@/lib/matching/queue";

import type { IcebreakerSuggestionView } from "../hooks/useIcebreakerSuggestions";
import styles from "./IcebreakerSuggestions.module.css";

interface IcebreakerSuggestionsProps {
  matches: MutualMatch[];
  suggestions: IcebreakerSuggestionView[];
  isGenerating: boolean;
}

const formatConfidence = (value: number) => `${Math.round(value * 100)}%`; 

export function IcebreakerSuggestions({ matches, suggestions, isGenerating }: IcebreakerSuggestionsProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!suggestions.length) {
      setSelectedMatchId(null);
      return;
    }

    if (selectedMatchId && suggestions.some((entry) => entry.matchId === selectedMatchId)) {
      return;
    }

    const next =
      suggestions.find((entry) => entry.status === "ready") ?? suggestions[0] ?? null;
    setSelectedMatchId(next?.matchId ?? null);
  }, [suggestions, selectedMatchId]);

  const activeSuggestion = useMemo(() => {
    if (!selectedMatchId) {
      return suggestions[0];
    }
    return suggestions.find((entry) => entry.matchId === selectedMatchId) ?? suggestions[0];
  }, [selectedMatchId, suggestions]);

  const hasMatches = matches.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Icebreaker suggestions</h3>
        {isGenerating ? <span className={styles.badge}>Generating</span> : null}
      </div>

      {!hasMatches ? (
        <p className={styles.empty}>Unlock mutual matches to receive AI-crafted openers.</p>
      ) : !suggestions.length ? (
        <p className={styles.empty}>Review a match to generate tailored conversation starters.</p>
      ) : (
        <>
          <div className={styles.tabs}>
            {suggestions.map((entry) => {
              const isActive = entry.matchId === activeSuggestion?.matchId;
              return (
                <button
                  key={entry.matchId}
                  type="button"
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                  onClick={() => setSelectedMatchId(entry.matchId)}
                >
                  <span>{entry.candidateName}</span>
                  <small>
                    {entry.status === "ready"
                      ? `${entry.items.length} ideas`
                      : entry.status === "error"
                      ? "Error"
                      : "Generating"}
                  </small>
                </button>
              );
            })}
          </div>

          {activeSuggestion ? (
            <div className={styles.panel}>
              <div className={styles.variant}>
                <span className={styles.variantLabel}>{activeSuggestion.variantConfig.label} variant</span>
                <span className={styles.variantMeta}>{activeSuggestion.variantConfig.description}</span>
              </div>

              {activeSuggestion.status === "loading" ? (
                <p className={styles.status}>Calibrating icebreakers with shared alpha…</p>
              ) : activeSuggestion.status === "error" ? (
                <p className={`${styles.status} ${styles.error}`}>{activeSuggestion.error}</p>
              ) : (
                <>
                  <ul className={styles.icebreakers}>
                    {activeSuggestion.items.map((item) => (
                      <li key={item.message}>
                        <p>{item.message}</p>
                        <div className={styles.meta}>
                          <span>{item.category}</span>
                          <span>{item.humorLevel} humor</span>
                          <span>{formatConfidence(item.confidence)} confidence</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {activeSuggestion.marketInsights.length ? (
                    <div className={styles.insights}>
                      <h4>Market intel powering these prompts</h4>
                      <ul>
                        {activeSuggestion.marketInsights.map((insight) => (
                          <li key={insight.title}>
                            <strong>{insight.title}</strong>
                            <span>{insight.summary}</span>
                            <div className={styles.insightMeta}>
                              {insight.assets?.length ? (
                                <span>{insight.assets.join(" • ")}</span>
                              ) : null}
                              {insight.timeframe ? <span>{insight.timeframe}</span> : null}
                              <span className={styles.sentiment}>{insight.sentiment}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
