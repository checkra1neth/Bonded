import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { ChallengeEventHub } from "../ChallengeEventHub";
import { useChallengeHub } from "../../hooks/useChallengeHub";

function Harness(props: Partial<React.ComponentProps<typeof ChallengeEventHub>>) {
  const view = useChallengeHub();
  return <ChallengeEventHub view={view} {...props} />;
}

describe("ChallengeEventHub", () => {
  it("renders weekly challenge overview with tasks and leaderboard", () => {
    render(<Harness />);

    expect(screen.getByText(/Weekly Base Challenge/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Mission control/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Squad leaderboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Challenge events/i)).toBeInTheDocument();

    const leaderboardEntries = screen.getAllByText(/pts$/i);
    expect(leaderboardEntries.length).toBeGreaterThan(0);
  });

  it("allows logging task progress and updates completion counts", async () => {
    render(<Harness />);

    const logButton = screen.getAllByRole("button", { name: /log progress/i })[0];
    const taskItem = logButton.closest("li");
    expect(taskItem).toBeTruthy();

    const progressLabelBefore = taskItem ? within(taskItem).getByText(/0\/3 completed/) : null;
    expect(progressLabelBefore).toBeInTheDocument();

    fireEvent.click(logButton);

    await screen.findByText(/1\/3 completed/);
  });

  it("highlights locked premium events when provided", () => {
    const LockedHarness = () => {
      const view = useChallengeHub();
      const locked = view.events.slice(1, 2);
      return (
        <ChallengeEventHub
          view={view}
          accessibleEvents={[view.events[0]!]}
          lockedEvents={locked}
        />
      );
    };
    render(<LockedHarness />);

    expect(screen.getByText(/premium event/i)).toBeInTheDocument();
  });
});
