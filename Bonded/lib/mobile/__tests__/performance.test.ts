import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startMobilePerformanceMonitor } from "../performance";

declare global {
  interface Window {
    PerformanceObserver?: typeof PerformanceObserver;
  }
}

describe("mobile performance monitor", () => {
  beforeEach(() => {
    const callbacks: Array<FrameRequestCallback | null> = [];
    const originalObserver = window.PerformanceObserver;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length - 1;
    });
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
      if (callbacks[handle]) {
        callbacks[handle] = null;
      }
    });

    const observers: Array<(entries: PerformanceEntry[]) => void> = [];
    class MockObserver {
      callback: (entries: PerformanceEntry[]) => void;
      constructor(handler: (list: { getEntries: () => PerformanceEntry[] }) => void) {
        this.callback = (entries: PerformanceEntry[]) => handler({ getEntries: () => entries });
        observers.push(this.callback);
      }
      observe() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    }
    window.PerformanceObserver = MockObserver as unknown as typeof PerformanceObserver;

    vi.stubGlobal("__advanceFrame", (duration = 16.7) => {
      const callback = callbacks.shift();
      callbacks.push(null);
      if (callback) {
        callback(performance.now() + duration);
      }
    });

    vi.stubGlobal("__resetObserver", () => {
      window.PerformanceObserver = originalObserver;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as Record<string, unknown>).__resetObserver?.();
  });

  it("reports slow frames and observer metrics", () => {
    const samples: number[] = [];
    const handle = startMobilePerformanceMonitor((sample) => {
      samples.push(sample.slowFrameCount);
    });

    (globalThis as Record<string, unknown>).__advanceFrame?.(60);
    (globalThis as Record<string, unknown>).__advanceFrame?.(16);

    expect(samples.at(-1)).toBeGreaterThanOrEqual(1);

    handle.stop();
  });
});
