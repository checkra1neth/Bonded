"use client";

import { useCallback, type ChangeEventHandler } from "react";

import type {
  PremiumFilterFacets,
  PremiumFilterOptions,
  PremiumFilterSummary,
} from "@/lib/premium";

import styles from "./PremiumFiltersPanel.module.css";

interface PremiumFiltersPanelProps {
  filters: PremiumFilterOptions;
  facets: PremiumFilterFacets;
  summary: PremiumFilterSummary;
  onChange: (filters: PremiumFilterOptions) => void;
  onReset: () => void;
}

const formatCategoryLabel = (id: string) =>
  id
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const toggleValue = (values: string[] | undefined, value: string): string[] => {
  const list = new Set(values ?? []);
  if (list.has(value)) {
    list.delete(value);
  } else {
    list.add(value);
  }
  return Array.from(list);
};

export function PremiumFiltersPanel({ filters, facets, summary, onChange, onReset }: PremiumFiltersPanelProps) {
  const handleSearchChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onChange({
        ...filters,
        searchTerm: event.currentTarget.value,
      });
    },
    [filters, onChange],
  );

  const handleScoreChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const value = Number.parseInt(event.currentTarget.value, 10) / 100;
      onChange({
        ...filters,
        minScore: Number.isNaN(value) ? 0 : value,
      });
    },
    [filters, onChange],
  );

  const handleCategoryToggle = useCallback(
    (category: string) => {
      onChange({
        ...filters,
        categories: toggleValue(filters.categories, category),
      });
    },
    [filters, onChange],
  );

  const handleTokenToggle = useCallback(
    (token: string) => {
      onChange({
        ...filters,
        tokenSymbols: toggleValue(filters.tokenSymbols, token),
      });
    },
    [filters, onChange],
  );

  const handleDefiToggle = useCallback(
    (protocol: string) => {
      onChange({
        ...filters,
        defiProtocols: toggleValue(filters.defiProtocols, protocol),
      });
    },
    [filters, onChange],
  );

  const handleActivityToggle = useCallback(
    (activity: string) => {
      onChange({
        ...filters,
        activityFocus: toggleValue(filters.activityFocus, activity),
      });
    },
    [filters, onChange],
  );

  const handlePersonalityToggle = useCallback(
    (personality: string) => {
      onChange({
        ...filters,
        personalities: toggleValue(filters.personalities, personality),
      });
    },
    [filters, onChange],
  );

  const handleWarmSignalToggle = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onChange({
        ...filters,
        warmSignalsOnly: event.currentTarget.checked,
      });
    },
    [filters, onChange],
  );

  return (
    <section className={styles.container} aria-labelledby="premium-filters-title">
      <header className={styles.header}>
        <div>
          <h3 id="premium-filters-title">Advanced filters</h3>
          <p>{summary.description}</p>
        </div>
        <button type="button" onClick={onReset} className={styles.resetButton}>
          Reset
        </button>
      </header>

      <div className={styles.fieldset}>
        <label htmlFor="premium-search">Search</label>
        <input
          id="premium-search"
          type="search"
          placeholder="Tokens, personas, shared interests"
          value={filters.searchTerm ?? ""}
          onChange={handleSearchChange}
        />
      </div>

      <div className={styles.fieldset}>
        <label htmlFor="premium-score">Minimum compatibility</label>
        <div className={styles.sliderRow}>
          <input
            id="premium-score"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((filters.minScore ?? 0) * 100)}
            onChange={handleScoreChange}
          />
          <span>{Math.round((filters.minScore ?? 0) * 100)}%</span>
        </div>
      </div>

      {facets.categories.length ? (
        <div className={styles.fieldset}>
          <span className={styles.legend}>Compatibility tiers</span>
          <div className={styles.optionsGrid}>
            {facets.categories.map((category) => {
              const active = filters.categories?.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  data-active={active || undefined}
                >
                  {formatCategoryLabel(category)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {facets.tokenSymbols.length ? (
        <div className={styles.fieldset}>
          <span className={styles.legend}>Token focus</span>
          <div className={styles.optionsGrid}>
            {facets.tokenSymbols.map((token) => {
              const active = filters.tokenSymbols?.includes(token);
              return (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleTokenToggle(token)}
                  data-active={active || undefined}
                >
                  {token}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {facets.defiProtocols.length ? (
        <div className={styles.fieldset}>
          <span className={styles.legend}>DeFi alignment</span>
          <div className={styles.optionsGrid}>
            {facets.defiProtocols.map((protocol) => {
              const normalized = protocol.toUpperCase();
              const active = filters.defiProtocols?.includes(protocol);
              return (
                <button
                  key={protocol}
                  type="button"
                  onClick={() => handleDefiToggle(protocol)}
                  data-active={active || undefined}
                >
                  {normalized}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {facets.activityFocus.length ? (
        <div className={styles.fieldset}>
          <span className={styles.legend}>Activity alignment</span>
          <div className={styles.optionsGrid}>
            {facets.activityFocus.map((activity) => {
              const active = filters.activityFocus?.includes(activity);
              const label =
                activity === "active_hours" ? "Active hours" : "Risk alignment";
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => handleActivityToggle(activity)}
                  data-active={active || undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {facets.personalities.length ? (
        <div className={styles.fieldset}>
          <span className={styles.legend}>Personality archetypes</span>
          <div className={styles.optionsGrid}>
            {facets.personalities.map((personality) => {
              const active = filters.personalities?.includes(personality);
              return (
                <button
                  key={personality}
                  type="button"
                  onClick={() => handlePersonalityToggle(personality)}
                  data-active={active || undefined}
                >
                  {personality}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={Boolean(filters.warmSignalsOnly)}
          onChange={handleWarmSignalToggle}
        />
        <span>Warm signals only</span>
      </label>
    </section>
  );
}
