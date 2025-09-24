import { logger } from "../observability/logger";
import { telemetry } from "../observability/telemetry";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export interface UserFacingErrorOptions {
  title?: string;
  description?: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => Promise<void> | void;
  allowDismiss?: boolean;
  autoDismissMs?: number;
  severity?: ErrorSeverity;
}

export interface CaptureErrorOptions {
  message?: string;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  cause?: unknown;
  userFacing?: UserFacingErrorOptions | null;
}

export interface UserFacingErrorSnapshot extends UserFacingErrorOptions {
  title: string;
  allowDismiss: boolean;
  severity: ErrorSeverity;
}

export interface MonitoredErrorEvent {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  context?: Record<string, unknown>;
  cause?: unknown;
  stack?: string;
  userFacing?: UserFacingErrorSnapshot;
}

type ErrorMonitorListener = (event: MonitoredErrorEvent) => void;

const DEFAULT_MAX_EVENTS = 50;

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `err_${Math.random().toString(36).slice(2, 10)}`;
}

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error || fallback;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

export class ErrorMonitor {
  private readonly listeners = new Set<ErrorMonitorListener>();

  private readonly events: MonitoredErrorEvent[] = [];

  constructor(private readonly maxEvents = DEFAULT_MAX_EVENTS) {}

  capture(error: unknown, options: CaptureErrorOptions = {}): MonitoredErrorEvent {
    const severity = options.severity ?? "error";
    const message = options.message ?? toMessage(error, "Unexpected error");

    const event: MonitoredErrorEvent = {
      id: createEventId(),
      message,
      severity,
      timestamp: Date.now(),
      context: options.context,
      cause: error instanceof Error ? error : options.cause ?? error,
      stack: error instanceof Error ? error.stack : undefined,
    };

    if (options.userFacing) {
      event.userFacing = {
        title: options.userFacing.title ?? message,
        description: options.userFacing.description,
        hint: options.userFacing.hint,
        actionLabel: options.userFacing.actionLabel,
        onAction: options.userFacing.onAction,
        allowDismiss: options.userFacing.allowDismiss ?? true,
        autoDismissMs: options.userFacing.autoDismissMs,
        severity: options.userFacing.severity ?? severity,
      };
    }

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    if (severity === "error" || severity === "critical") {
      logger.error(`[ErrorMonitor:${severity}] ${message}`, {
        error,
        context: options.context,
      });

      telemetry.trackError({
        name: "Unhandled application error",
        message,
        severity,
        stack: event.stack,
        context: options.context,
      });
    } else {
      logger.warn(`[ErrorMonitor:${severity}] ${message}`, {
        error,
        context: options.context,
      });
    }

    this.listeners.forEach((listener) => listener(event));

    return event;
  }

  subscribe(listener: ErrorMonitorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getEvents(): readonly MonitoredErrorEvent[] {
    return this.events.slice();
  }
}

export const errorMonitor = new ErrorMonitor();

export function captureError(
  error: unknown,
  options?: CaptureErrorOptions,
): MonitoredErrorEvent {
  return errorMonitor.capture(error, options);
}
