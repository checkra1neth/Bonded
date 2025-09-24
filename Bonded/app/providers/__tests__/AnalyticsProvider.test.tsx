import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as analyticsClient from "../../../lib/analytics/client";

import { AnalyticsProvider, useAnalyticsContext } from "../AnalyticsProvider";

const mockedSendAnalyticsEvent = vi
  .spyOn(analyticsClient, "sendAnalyticsEvent")
  .mockResolvedValue(undefined);

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    mockedSendAnalyticsEvent.mockClear();
  });

  afterEach(() => {
    mockedSendAnalyticsEvent.mockClear();
  });

  it("tracks a page view on mount", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnalyticsProvider>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalyticsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalEvents).toBeGreaterThanOrEqual(1);
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "page_view", category: "navigation" }),
    );
  });

  it("increments category counts when events are tracked", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnalyticsProvider>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalyticsContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalEvents).toBeGreaterThanOrEqual(1);
    });

    act(() => {
      result.current.trackEvent({
        name: "launch.action",
        category: "operations",
        properties: { id: "referral-sync" },
      });
    });

    await waitFor(() => {
      expect(result.current.eventsByCategory.operations).toBe(1);
      expect(result.current.lastEvent?.name).toBe("launch.action");
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "launch.action", category: "operations" }),
    );
  });
});
