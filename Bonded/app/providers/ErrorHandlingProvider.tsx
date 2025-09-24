"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  captureError as captureWithMonitor,
  errorMonitor,
  type CaptureErrorOptions,
  type ErrorSeverity,
  type MonitoredErrorEvent,
} from "../../lib/errors/monitoring";

import styles from "./errorHandling.module.css";

type UserFacingMessage = {
  id: string;
  title: string;
  description?: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => Promise<void> | void;
  allowDismiss: boolean;
  autoDismissMs?: number;
  severity: ErrorSeverity;
  status: "idle" | "running";
};

type ErrorHandlingContextValue = {
  captureError: (error: unknown, options?: CaptureErrorOptions) => MonitoredErrorEvent;
  notifyError: (
    message: string,
    options?: Omit<CaptureErrorOptions, "message">,
  ) => MonitoredErrorEvent;
  dismissError: (id?: string) => void;
  clearAllErrors: () => void;
  activeError: UserFacingMessage | null;
  offline: boolean;
  recentErrors: readonly MonitoredErrorEvent[];
};

const ErrorHandlingContext = createContext<ErrorHandlingContextValue | null>(null);

const GLOBAL_FALLBACK_TITLE = "Something went wrong";
const GLOBAL_FALLBACK_DESCRIPTION =
  "Bonded ran into an unexpected error. You can try to continue or reload the app.";

type ErrorBoundaryFallbackProps = {
  error: Error;
  reset: () => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: Error, info: React.ErrorInfo) => void;
  onReset: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset();
  };

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <GlobalErrorFallback error={error} reset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

function GlobalErrorFallback({ error, reset }: ErrorBoundaryFallbackProps) {
  const refresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className={styles.fullscreenFallback} role="alert">
      <div className={styles.fallbackCard}>
        <h1 className={styles.fallbackTitle}>{GLOBAL_FALLBACK_TITLE}</h1>
        <p className={styles.fallbackDescription}>{GLOBAL_FALLBACK_DESCRIPTION}</p>
        <p className={styles.fallbackHint}>
          {error.message || "We paused your experience to keep things safe."}
        </p>
        <div className={styles.fallbackActions}>
          <button className={styles.primaryButton} type="button" onClick={reset}>
            Try again
          </button>
          <button className={styles.secondaryButton} type="button" onClick={refresh}>
            Reload Bonded
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorHud({
  offline,
  error,
  onDismiss,
  onAction,
}: {
  offline: boolean;
  error: UserFacingMessage | null;
  onDismiss: (id?: string) => void;
  onAction: (id: string) => void;
}) {
  if (!offline && !error) {
    return null;
  }

  const reload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const openOffline = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/offline");
    }
  };

  const severityClass = error ? styles[`severity-${error.severity}`] ?? "" : "";

  return (
    <div className={styles.overlayRoot} aria-live="polite">
      {offline ? (
        <div className={styles.offlineBanner} role="status">
          <h2 className={styles.offlineTitle}>Offline mode enabled</h2>
          <p className={styles.offlineDescription}>
            We saved a lightweight copy of your queue. Match actions will sync once you reconnect.
          </p>
          <div className={styles.offlineActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={reload}
            >
              Retry connection
            </button>
            <button
              className={styles.ghostButton}
              type="button"
              onClick={openOffline}
            >
              View offline mode
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className={`${styles.toast} ${severityClass}`} role="alert">
          <div className={styles.toastHeader}>
            <p className={styles.toastTitle}>{error.title}</p>
          </div>
          {error.description ? (
            <p className={styles.toastDescription}>{error.description}</p>
          ) : null}
          {error.hint ? <p className={styles.toastHint}>{error.hint}</p> : null}
          <div className={styles.toastActions}>
            {error.onAction ? (
              <button
                className={styles.primaryButton}
                type="button"
                disabled={error.status === "running"}
                onClick={() => onAction(error.id)}
              >
                {error.status === "running" ? "Working..." : error.actionLabel ?? "Resolve"}
              </button>
            ) : null}
            {error.allowDismiss ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => onDismiss(error.id)}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getInitialOfflineState() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return !navigator.onLine;
}

export function ErrorHandlingProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<UserFacingMessage[]>([]);
  const [recentEvents, setRecentEvents] = useState<readonly MonitoredErrorEvent[]>(
    () => errorMonitor.getEvents(),
  );
  const [offline, setOffline] = useState(getInitialOfflineState);

  const autoDismissTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: string) => {
    const timer = autoDismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      autoDismissTimers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const timers = autoDismissTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handleMonitoredEvent = useCallback((event: MonitoredErrorEvent) => {
    setRecentEvents((current) => [...current.slice(-49), event]);

    if (!event.userFacing) {
      return;
    }

    setMessages((current) => {
      const next = [
        ...current,
        {
          id: event.id,
          title: event.userFacing?.title ?? event.message,
          description: event.userFacing?.description,
          hint: event.userFacing?.hint,
          actionLabel: event.userFacing?.actionLabel,
          onAction: event.userFacing?.onAction,
          allowDismiss: event.userFacing?.allowDismiss ?? true,
          autoDismissMs: event.userFacing?.autoDismissMs,
          severity: event.userFacing?.severity ?? event.severity,
          status: "idle" as const,
        },
      ];

      const latest = next[next.length - 1];
      if (latest.autoDismissMs && !autoDismissTimers.current.has(latest.id)) {
        const timer = setTimeout(() => {
          setMessages((currentMessages) =>
            currentMessages.filter((message) => message.id !== latest.id),
          );
          autoDismissTimers.current.delete(latest.id);
        }, latest.autoDismissMs);
        autoDismissTimers.current.set(latest.id, timer);
      }

      return next;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = errorMonitor.subscribe(handleMonitoredEvent);
    return () => {
      unsubscribe();
    };
  }, [handleMonitoredEvent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWindowError = (event: ErrorEvent) => {
      captureWithMonitor(event.error ?? event.message, {
        message: event.message,
        severity: "critical",
        context: { scope: "window.error" },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureWithMonitor(event.reason, {
        message: "Unhandled promise rejection",
        severity: "error",
        context: { scope: "window.unhandledrejection" },
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const dismissError = useCallback((id?: string) => {
    if (!id) {
      autoDismissTimers.current.forEach((timer) => clearTimeout(timer));
      autoDismissTimers.current.clear();
      setMessages([]);
      return;
    }

    clearTimer(id);
    setMessages((current) => current.filter((message) => message.id !== id));
  }, [clearTimer]);

  const clearAllErrors = useCallback(() => {
    dismissError();
  }, [dismissError]);

  const captureError = useCallback(
    (error: unknown, options?: CaptureErrorOptions) => {
      return captureWithMonitor(error, options);
    },
    [],
  );

  const notifyError = useCallback(
    (message: string, options?: Omit<CaptureErrorOptions, "message">) => {
      const cause = options?.cause ?? new Error(message);
      return captureWithMonitor(cause, { ...options, message });
    },
    [],
  );

  const handleAction = useCallback(
    async (id: string) => {
      let action: (() => Promise<void> | void) | undefined;

      setMessages((current) => {
        return current.map((message) => {
          if (message.id === id) {
            action = message.onAction;
            return { ...message, status: "running" };
          }

          return message;
        });
      });

      if (!action) {
        dismissError(id);
        return;
      }

      try {
        await action();
        dismissError(id);
      } catch (error) {
        captureWithMonitor(error, {
          message: "User action failed",
          severity: "warning",
          context: { scope: "errorHandling.action", errorId: id },
        });

        setMessages((current) =>
          current.map((message) =>
            message.id === id ? { ...message, status: "idle" } : message,
          ),
        );
      }
    },
    [dismissError],
  );

  const contextValue = useMemo<ErrorHandlingContextValue>(() => {
    const active = messages[0] ?? null;

    return {
      captureError,
      notifyError,
      dismissError,
      clearAllErrors,
      activeError: active,
      offline,
      recentErrors: recentEvents,
    };
  }, [captureError, notifyError, dismissError, clearAllErrors, messages, offline, recentEvents]);

  return (
    <ErrorHandlingContext.Provider value={contextValue}>
      <AppErrorBoundary
        onError={(error, info) => {
          captureWithMonitor(error, {
            message: "A fatal error occurred in the UI",
            severity: "critical",
            context: { scope: "ui.boundary", componentStack: info.componentStack },
          });
        }}
        onReset={() => {
          clearAllErrors();
        }}
      >
        {children}
      </AppErrorBoundary>
      <ErrorHud
        offline={offline}
        error={messages[0] ?? null}
        onDismiss={dismissError}
        onAction={handleAction}
      />
    </ErrorHandlingContext.Provider>
  );
}

export function useErrorHandlingContext() {
  const context = useContext(ErrorHandlingContext);
  if (!context) {
    throw new Error("useErrorHandlingContext must be used within ErrorHandlingProvider");
  }

  return context;
}
