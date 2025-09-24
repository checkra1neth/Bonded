export interface MobilePerformanceSample {
  lcp?: number;
  cls?: number;
  fid?: number;
  slowFrameCount: number;
  avgFrameDuration?: number;
  lastFrameDuration?: number;
  timestamp: number;
}

export interface MobilePerformanceMonitorHandle {
  stop: () => void;
}

type PerformanceObserverEntryList = {
  getEntries: () => PerformanceEntry[];
};

type PerformanceObserverLike = {
  observe: (options: { type: string; buffered?: boolean }) => void;
  disconnect: () => void;
};

type PerformanceObserverConstructor = new (
  callback: (list: PerformanceObserverEntryList) => void,
) => PerformanceObserverLike;

const SLOW_FRAME_THRESHOLD_MS = 42;
const REPORT_THROTTLE_MS = 1_200;

export function startMobilePerformanceMonitor(
  onSample: (sample: MobilePerformanceSample) => void,
): MobilePerformanceMonitorHandle {
  if (typeof window === "undefined") {
    return { stop: () => undefined };
  }

  let stopped = false;
  let lastFrameTime = performance.now();
  let slowFrameCount = 0;
  let accumulatedDuration = 0;
  let frameCount = 0;
  let rafId: number | null = null;
  let lastReportAt = performance.now();

  const report = (overrides: Partial<MobilePerformanceSample> & { force?: boolean } = {}) => {
    const now = performance.now();
    if (now - lastReportAt < REPORT_THROTTLE_MS && !overrides.force) {
      return;
    }
    lastReportAt = now;

    const avgFrameDuration = frameCount ? accumulatedDuration / frameCount : undefined;

    onSample({
      slowFrameCount,
      avgFrameDuration,
      lastFrameDuration: overrides.lastFrameDuration,
      lcp: overrides.lcp,
      cls: overrides.cls,
      fid: overrides.fid,
      timestamp: now,
    });
  };

  const loop = (now: number) => {
    if (stopped) {
      return;
    }

    const delta = now - lastFrameTime;
    lastFrameTime = now;

    accumulatedDuration += delta;
    frameCount += 1;

    if (delta > SLOW_FRAME_THRESHOLD_MS) {
      slowFrameCount += 1;
      report({ lastFrameDuration: delta, force: true });
    } else {
      report();
    }

    rafId = window.requestAnimationFrame(loop);
  };

  rafId = window.requestAnimationFrame(loop);

  const observers: PerformanceObserverLike[] = [];

  const PerformanceObserverImpl = (window as unknown as {
    PerformanceObserver?: PerformanceObserverConstructor;
  }).PerformanceObserver;

  if (PerformanceObserverImpl) {
    const observe = (type: string, handler: (entries: PerformanceEntry[]) => void) => {
      const observer = new PerformanceObserverImpl((list: PerformanceObserverEntryList) => {
        handler(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      observers.push(observer);
    };

    observe("largest-contentful-paint", (entries) => {
      const last = entries.at(-1) as PerformanceEntry & { startTime?: number } | undefined;
      if (!last) {
        return;
      }
      report({ lcp: last.startTime ?? last.duration, force: true });
    });

    observe("layout-shift", (entries) => {
      const total = entries.reduce((acc, entry) => {
        const value = (entry as unknown as { value?: number }).value ?? 0;
        const hadRecentInput = (entry as unknown as { hadRecentInput?: boolean }).hadRecentInput;
        return hadRecentInput ? acc : acc + value;
      }, 0);
      if (total > 0) {
        report({ cls: total, force: true });
      }
    });

    observe("first-input", (entries) => {
      const first = entries[0] as PerformanceEntry & { processingStart?: number } | undefined;
      if (!first) {
        return;
      }
      const fid = first.processingStart ? first.processingStart - first.startTime : first.duration;
      report({ fid, force: true });
    });
  }

  const stop = () => {
    if (stopped) {
      return;
    }
    stopped = true;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }
    observers.forEach((observer) => observer.disconnect());
  };

  return { stop };
}
