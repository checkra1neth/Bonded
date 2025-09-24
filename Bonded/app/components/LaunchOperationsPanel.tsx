import React from "react";

import {
  type AnalyticsHealth,
  type LaunchChecklistItem,
  type LaunchKpi,
  type LaunchMarketingHighlight,
  type LaunchOperationalAlert,
  type LaunchSummary,
  type LaunchSupportChannel,
} from "@/lib/analytics/launch";

import styles from "./LaunchOperationsPanel.module.css";

interface LaunchOperationsPanelProps {
  summary: LaunchSummary;
  checklist: LaunchChecklistItem[];
  kpis: LaunchKpi[];
  marketingHighlights: LaunchMarketingHighlight[];
  supportChannels: LaunchSupportChannel[];
  analyticsHealth: AnalyticsHealth;
  operations: LaunchOperationalAlert[];
  onAction?: (actionId: string) => void;
  onSupportSelect?: (channelId: string) => void;
}

const summaryStatusLabels: Record<LaunchSummary["status"], string> = {
  ready: "Launch ready",
  stabilizing: "Stabilizing",
  at_risk: "At risk",
};

const checklistStatusCopy: Record<LaunchChecklistItem["status"], string> = {
  complete: "Complete",
  "in_progress": "In progress",
  blocked: "Blocked",
};

const severityLabels: Record<LaunchOperationalAlert["severity"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function LaunchOperationsPanel({
  summary,
  checklist,
  kpis,
  marketingHighlights,
  supportChannels,
  analyticsHealth,
  operations,
  onAction,
  onSupportSelect,
}: LaunchOperationsPanelProps) {
  const confidence = Math.round(summary.confidence * 100);
  const coverage = Math.round(analyticsHealth.coverage * 100);

  return (
    <section className={styles.panel} aria-labelledby="launch-operations-heading">
      <header className={styles.header}>
        <div className={`${styles.statusBadge} ${styles[summary.status]}`}>
          {summaryStatusLabels[summary.status]}
        </div>
        <div>
          <h2 id="launch-operations-heading">Launch operations control center</h2>
          <p className={styles.headline}>{summary.headline}</p>
          <p className={styles.supporting}>{summary.supporting}</p>
        </div>
        <div className={styles.confidence}>
          <span>{confidence}%</span>
          <small>Launch confidence</small>
        </div>
      </header>

      <div className={styles.grid}>
        <article className={styles.card} aria-label="Launch readiness checklist">
          <h3>Launch readiness checklist</h3>
          <ul className={styles.checklist}>
            {checklist.map((item) => (
              <li key={item.id}>
                <div className={styles.checklistMeta}>
                  <span className={`${styles.statusDot} ${styles[item.status]}`} aria-hidden />
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
                <div className={styles.checklistMetric}>
                  <span>{item.metric}</span>
                  <small>{checklistStatusCopy[item.status]}</small>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card} aria-label="Launch key performance indicators">
          <h3>Launch KPIs</h3>
          <div className={styles.kpiGrid}>
            {kpis.map((kpi) => (
              <div key={kpi.id} className={styles.kpi}>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                <div className={styles.kpiValueRow}>
                  <strong>{kpi.value}</strong>
                  <span className={`${styles.trend} ${styles[kpi.trend]}`}>
                    {kpi.change > 0 ? "▲" : kpi.change < 0 ? "▼" : "➖"} {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                </div>
                <p>{kpi.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card} aria-label="Marketing runway">
          <h3>Marketing runway</h3>
          <ul className={styles.marketingList}>
            {marketingHighlights.map((highlight) => (
              <li key={highlight.id}>
                <div>
                  <strong>{highlight.title}</strong>
                  <span className={styles.marketingMetric}>{highlight.metric}</span>
                  <p>{highlight.description}</p>
                </div>
                <div className={styles.marketingFooter}>
                  <span className={`${styles.badge} ${styles[highlight.status]}`}>{highlight.status}</span>
                  {highlight.actionId && highlight.actionLabel ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (highlight.actionId) {
                          onAction?.(highlight.actionId);
                        }
                      }}
                    >
                      {highlight.actionLabel}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card} aria-label="Analytics coverage">
          <h3>Analytics &amp; telemetry</h3>
          <div className={styles.analyticsSummary}>
            <div>
              <strong>{coverage}% coverage</strong>
              <p>{analyticsHealth.recommendation}</p>
            </div>
            <div className={styles.analyticsMetrics}>
              <span>
                {analyticsHealth.totalSignals}
                <small>signals / 24h</small>
              </span>
              <span>
                {analyticsHealth.criticalSignals}
                <small>critical alerts</small>
              </span>
            </div>
          </div>

          <div className={styles.operations}>
            <h4>Operational alerts</h4>
            {operations.length === 0 ? (
              <p className={styles.noAlerts}>All clear. Keep monitoring runbooks during launch window.</p>
            ) : (
              <ul>
                {operations.map((alert) => (
                  <li key={alert.id}>
                    <div>
                      <strong>{alert.title}</strong>
                      <span className={`${styles.badge} ${styles[alert.severity]}`}>
                        {severityLabels[alert.severity]}
                      </span>
                    </div>
                    <p>{alert.description}</p>
                    <footer>
                      <span>{alert.metric}</span>
                      <button type="button" onClick={() => onAction?.(alert.id)}>
                        {alert.actionLabel}
                      </button>
                    </footer>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <article className={styles.card} aria-label="Support coverage">
          <h3>Support coverage</h3>
          <ul className={styles.supportList}>
            {supportChannels.map((channel) => (
              <li key={channel.id}>
                <div>
                  <strong>{channel.name}</strong>
                  <p>{channel.description}</p>
                </div>
                <div className={styles.supportMeta}>
                  <span className={`${styles.badge} ${styles[channel.status]}`}>
                    {channel.status === "online"
                      ? "Online"
                      : channel.status === "standby"
                        ? "Standby"
                        : "Offline"}
                  </span>
                  <span className={styles.sla}>{channel.slaMinutes}m SLA</span>
                  <button type="button" onClick={() => onSupportSelect?.(channel.id)}>
                    Open channel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
