import React from "react";

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackPanel } from "../FeedbackPanel";

const trackEvent = vi.fn();

vi.mock("../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackEvent,
    totalEvents: 0,
    eventsByCategory: {},
    lastEvent: null,
    pendingDeliveries: 0,
    trackPageView: vi.fn(),
  }),
}));

const stats = {
  total: 26,
  promoters: 18,
  detractors: 3,
  opportunities: 8,
  npsScore: 58,
};

describe("FeedbackPanel", () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders stats and prevents submission when message is short", async () => {
    const submitSpy = vi.fn();
    render(<FeedbackPanel stats={stats} onSubmitSuccess={submitSpy} />);

    expect(screen.getByText(/Launch feedback loop/i)).toBeInTheDocument();
    expect(screen.getByText(/Promoters are rallying/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Focus area/i), { target: { value: "matching" } });
    const [messageInput] = screen.getAllByLabelText(/What should we know/i);
    fireEvent.change(messageInput, { target: { value: "short" } });
    const [submitButton] = screen.getAllByRole("button", { name: /Send feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Share a bit more detail/i)).toBeInTheDocument();
    });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("submits feedback and notifies parent on success", async () => {
    const sentiments: string[] = [];
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true }),
    } as Response);

    render(
      <FeedbackPanel
        stats={stats}
        onSubmitSuccess={(sentiment) => {
          sentiments.push(sentiment);
        }}
      />,
    );

    const [messageInput] = screen.getAllByLabelText(/What should we know/i);
    fireEvent.change(messageInput, {
      target: { value: "The concierge flow feels magical." },
    });

    const [submitButton] = screen.getAllByRole("button", { name: /Send feedback/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await screen.findByText(/Feedback queued/i);
    await waitFor(() => {
      expect(sentiments).toContain("positive");
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "feedback.submitted", category: "feedback" }),
    );

    fetchSpy.mockRestore();
  });
});
