"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { sendAnalyticsEvent, type AnalyticsEventInput } from "../../lib/analytics/client";

type AnalyticsEventRecord = AnalyticsEventInput & { timestamp: number };

type AnalyticsState = {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  lastEvent: AnalyticsEventRecord | null;
  pendingDeliveries: number;
};

type AnalyticsAction =
  | { type: "TRACK_EVENT"; payload: AnalyticsEventRecord }
  | { type: "SET_PENDING"; payload: number };

const initialState: AnalyticsState = {
  totalEvents: 0,
  eventsByCategory: {},
  lastEvent: null,
  pendingDeliveries: 0,
};

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case "TRACK_EVENT": {
      const { payload } = action;
      const nextEventsByCategory = {
        ...state.eventsByCategory,
        [payload.category]: (state.eventsByCategory[payload.category] ?? 0) + 1,
      };

      return {
        totalEvents: state.totalEvents + 1,
        eventsByCategory: nextEventsByCategory,
        lastEvent: payload,
        pendingDeliveries: state.pendingDeliveries,
      };
    }
    case "SET_PENDING": {
      return { ...state, pendingDeliveries: action.payload };
    }
    default:
      return state;
  }
}

export interface AnalyticsContextValue extends AnalyticsState {
  trackEvent: (event: AnalyticsEventInput) => void;
  trackPageView: (page: string, properties?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const pendingRef = useRef(0);

  const setPending = useCallback((value: number) => {
    pendingRef.current = value;
    dispatch({ type: "SET_PENDING", payload: value });
  }, []);

  const deliver = useCallback((event: AnalyticsEventInput) => {
    const record: AnalyticsEventRecord = { ...event, timestamp: Date.now() };
    dispatch({ type: "TRACK_EVENT", payload: record });
    setPending(pendingRef.current + 1);

    void sendAnalyticsEvent(event)
      .catch((error) => {
        if (process.env.NODE_ENV !== "test") {
          console.warn("Analytics delivery failed", error);
        }
      })
      .finally(() => {
        setPending(Math.max(0, pendingRef.current - 1));
      });
  }, [setPending]);

  const trackEvent = useCallback(
    (event: AnalyticsEventInput) => {
      deliver(event);
    },
    [deliver],
  );

  const trackPageView = useCallback(
    (page: string, properties?: Record<string, unknown>) => {
      trackEvent({
        name: "page_view",
        category: "navigation",
        properties: { page, ...properties },
      });
    },
    [trackEvent],
  );

  useEffect(() => {
    trackPageView("home", { variant: "launch-mvp" });
  }, [trackPageView]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      ...state,
      trackEvent,
      trackPageView,
    }),
    [state, trackEvent, trackPageView],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalyticsContext must be used within AnalyticsProvider");
  }
  return context;
}
