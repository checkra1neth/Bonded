import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { SocialEngagementPanel } from "../SocialEngagementPanel";

describe("SocialEngagementPanel", () => {
  it("renders achievements, stories, leaderboards, and referral program", () => {
    render(<SocialEngagementPanel />);

    expect(screen.getByRole("heading", { name: /social engagement hub/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /achievements & badges/i })).toBeInTheDocument();
    expect(screen.getByText(/Challenge Closer/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /success stories/i })).toBeInTheDocument();
    expect(screen.getByText(/Match made in Base/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /community leaderboards/i })).toBeInTheDocument();
    const connectorsBoard = screen.getByRole("region", { name: /top connectors/i });
    expect(within(connectorsBoard).getByText(/Ava Protocol/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /referral rewards/i })).toBeInTheDocument();
    expect(screen.getByText(/conversions out of/i)).toBeInTheDocument();
  });

  it("tracks share interactions and surfaces toast feedback", () => {
    render(<SocialEngagementPanel />);

    const copyButtons = screen.getAllByRole("button", { name: /copy link/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]!);

    expect(screen.getByText(/Copied achievement link to your clipboard/i)).toBeInTheDocument();

    const achievementCard = copyButtons[0]!.closest("li");
    expect(achievementCard).toBeTruthy();

    if (achievementCard) {
      expect(within(achievementCard).getByText(/1 share/)).toBeInTheDocument();
    }
  });
});
