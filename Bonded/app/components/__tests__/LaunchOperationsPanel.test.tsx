import React from "react";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LaunchOperationsPanel } from "../LaunchOperationsPanel";

const summary = {
  status: "ready" as const,
  confidence: 0.91,
  headline: "Launch runway cleared",
  supporting: "Telemetry, marketing, and support coverage are go for launch.",
};

const checklist = [
  {
    id: "onboarding",
    label: "Onboarding",
    status: "complete" as const,
    description: "Wallet → analysis → profile flow",
    metric: "94%",
    impact: "critical" as const,
  },
  {
    id: "analytics",
    label: "Analytics",
    status: "in_progress" as const,
    description: "Event parity checks",
    metric: "82%",
    impact: "high" as const,
  },
];

const kpis = [
  {
    id: "dau",
    label: "Daily active wallets",
    value: "1.8k",
    change: 4.5,
    trend: "up" as const,
    description: "Retention rate 87%",
  },
];

const marketingHighlights = [
  {
    id: "waitlist",
    title: "Waitlist momentum",
    metric: "4.8k wallets",
    status: "live" as const,
    description: "Organic referrals from Base ecosystem partners.",
    actionLabel: "Sync referral drop",
    actionId: "referral-sync",
  },
];

const supportChannels = [
  {
    id: "concierge",
    name: "Concierge",
    status: "online" as const,
    slaMinutes: 12,
    description: "Premium onboarding desk",
    contact: "concierge@bonded.club",
  },
];

const analyticsHealth = {
  coverage: 0.86,
  totalSignals: 912,
  criticalSignals: 64,
  recommendation: "Backfill a few straggler events before launch.",
};

const operations = [
  {
    id: "performance",
    title: "Tune performance budget",
    severity: "medium" as const,
    description: "Verify CDN caching rules.",
    actionLabel: "Open runbook",
    metric: "312ms p95",
  },
];

describe("LaunchOperationsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders launch summary, checklist, and KPIs", () => {
    render(
      <LaunchOperationsPanel
        summary={summary}
        checklist={checklist}
        kpis={kpis}
        marketingHighlights={marketingHighlights}
        supportChannels={supportChannels}
        analyticsHealth={analyticsHealth}
        operations={operations}
      />,
    );

    expect(screen.getByRole("heading", { name: /Launch operations control center/i })).toBeInTheDocument();
    expect(screen.getByText(/Launch runway cleared/i)).toBeInTheDocument();
    expect(screen.getByText(/94%/)).toBeInTheDocument();
    expect(screen.getByText(/1.8k/)).toBeInTheDocument();
  });

  it("invokes callbacks for marketing and support actions", () => {
    const actionSpy = vi.fn();
    const supportSpy = vi.fn();

    render(
      <LaunchOperationsPanel
        summary={summary}
        checklist={checklist}
        kpis={kpis}
        marketingHighlights={marketingHighlights}
        supportChannels={supportChannels}
        analyticsHealth={analyticsHealth}
        operations={operations}
        onAction={actionSpy}
        onSupportSelect={supportSpy}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Sync referral drop/i }));
    expect(actionSpy).toHaveBeenCalledWith("referral-sync");

    fireEvent.click(screen.getByRole("button", { name: /Open runbook/i }));
    expect(actionSpy).toHaveBeenCalledWith("performance");

    fireEvent.click(screen.getByRole("button", { name: /Open channel/i }));
    expect(supportSpy).toHaveBeenCalledWith("concierge");
  });
});
