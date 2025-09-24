import { describe, expect, it, vi } from "vitest";

import {
  ErrorMonitor,
  captureError,
  errorMonitor,
  type CaptureErrorOptions,
} from "../monitoring";

describe("ErrorMonitor", () => {
  it("records events and notifies subscribers", () => {
    const monitor = new ErrorMonitor(5);
    const listener = vi.fn();

    const unsubscribe = monitor.subscribe(listener);

    const error = new Error("boom");
    const event = monitor.capture(error, {
      message: "Authentication failed",
      severity: "error",
      context: { scope: "auth" },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
    expect(event.message).toBe("Authentication failed");
    expect(event.context).toEqual({ scope: "auth" });
    expect(monitor.getEvents()).toHaveLength(1);

    unsubscribe();

    monitor.capture(new Error("ignored"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("normalizes user facing options", () => {
    const monitor = new ErrorMonitor(5);

    const event = monitor.capture(new Error("offline"), {
      severity: "warning",
      userFacing: {
        description: "We switched you to offline mode",
        actionLabel: "Retry",
        allowDismiss: false,
      },
    });

    expect(event.userFacing).toMatchObject({
      title: "offline",
      description: "We switched you to offline mode",
      actionLabel: "Retry",
      allowDismiss: false,
      severity: "warning",
    });
  });

  it("limits stored events", () => {
    const monitor = new ErrorMonitor(2);

    monitor.capture(new Error("first"));
    monitor.capture(new Error("second"));
    monitor.capture(new Error("third"));

    const events = monitor.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].message).toBe("second");
    expect(events[1].message).toBe("third");
  });
});

describe("captureError", () => {
  it("uses the shared monitor instance", () => {
    const listener = vi.fn();
    const unsubscribe = errorMonitor.subscribe(listener);

    const options: CaptureErrorOptions = {
      message: "Unable to sync",
      severity: "warning",
      context: { scope: "sync" },
    };

    const event = captureError(new Error("sync failure"), options);

    expect(listener).toHaveBeenCalledWith(event);
    expect(event.message).toBe("Unable to sync");
    expect(event.context).toEqual({ scope: "sync" });

    unsubscribe();
  });
});
