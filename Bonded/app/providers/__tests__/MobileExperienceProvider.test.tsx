import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileExperienceProvider } from "../MobileExperienceProvider";
import { useMobileExperience } from "../../hooks/useMobileExperience";

function TestComponent() {
  const experience = useMobileExperience();

  return (
    <div>
      <span data-testid="is-mobile">{experience.isMobileViewport ? "yes" : "no"}</span>
      <span data-testid="connection-type">{experience.connection?.effectiveType ?? "none"}</span>
      <span data-testid="data-saver">{experience.connection?.saveData ? "on" : "off"}</span>
      <span data-testid="online">{experience.online ? "yes" : "no"}</span>
      <span data-testid="prompt">{experience.promptInstall ? "available" : "missing"}</span>
      <span data-testid="push-permission">{experience.push.permission}</span>
      <span data-testid="performance-slow">{experience.performance.slowFrameCount}</span>
    </div>
  );
}

describe("MobileExperienceProvider", () => {
  const connectionListeners: Array<() => void> = [];
  const matchMediaListeners = new Map<string, Array<(event: MediaQueryListEvent) => void>>();

  beforeEach(() => {
    vi.useFakeTimers();

    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length - 1;
    });
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
      if (handle in rafCallbacks) {
        rafCallbacks[handle] = () => undefined;
      }
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn((query: string) => {
        const listeners: Array<(event: MediaQueryListEvent) => void> = [];
        matchMediaListeners.set(query, listeners);
        return {
          matches: query.includes("max-width") ? true : false,
          media: query,
          addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.push(listener);
          },
          removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
              listeners.splice(index, 1);
            }
          },
          dispatchEvent: (event: MediaQueryListEvent) => {
            listeners.forEach((listener) => listener(event));
            return true;
          },
        } as MediaQueryList;
      }),
    });

    const connection = {
      effectiveType: "4g",
      saveData: false,
      downlink: 5,
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "change") {
          connectionListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "change") {
          const index = connectionListeners.indexOf(listener);
          if (index >= 0) {
            connectionListeners.splice(index, 1);
          }
        }
      }),
    };

    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: connection,
    });

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;

    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: {
        permission: "default" as NotificationPermission,
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    connectionListeners.length = 0;
    matchMediaListeners.clear();
    delete (navigator as unknown as { connection?: unknown }).connection;
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    delete (window as unknown as { Notification?: unknown }).Notification;
  });

  it("provides responsive state and updates on connection changes", async () => {
    render(
      <MobileExperienceProvider>
        <TestComponent />
      </MobileExperienceProvider>,
    );

    screen.getAllByTestId("is-mobile").forEach((element) => {
      expect(element.textContent).toBe("yes");
    });
    screen.getAllByTestId("connection-type").forEach((element) => {
      expect(element.textContent).toBe("4g");
    });
    screen.getAllByTestId("data-saver").forEach((element) => {
      expect(element.textContent).toBe("off");
    });
    screen.getAllByTestId("push-permission").forEach((element) => {
      expect(element.textContent).toBe("default");
    });

    const connection = navigator.connection as {
      effectiveType: string;
      saveData: boolean;
    };
    connection.effectiveType = "3g";
    connection.saveData = true;

    const changeListener = connectionListeners.at(-1);
    expect(changeListener).toBeTypeOf("function");

    await act(async () => {
      changeListener?.();
      await vi.runAllTimersAsync();
    });

    screen.getAllByTestId("connection-type").forEach((element) => {
      expect(element.textContent).toBe("3g");
    });
    screen.getAllByTestId("data-saver").forEach((element) => {
      expect(element.textContent).toBe("on");
    });
  });

  it("exposes install prompts and online status events", async () => {
    render(
      <MobileExperienceProvider>
        <TestComponent />
      </MobileExperienceProvider>,
    );

    screen.getAllByTestId("prompt").forEach((element) => {
      expect(element.textContent).toBe("missing");
    });
    screen.getAllByTestId("online").forEach((element) => {
      expect(element.textContent).toBe("yes");
    });

    const beforeInstallPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "test" }),
      platforms: ["test"],
    };

    const installEvent = new Event("beforeinstallprompt") as Event & typeof beforeInstallPrompt;
    Object.assign(installEvent, beforeInstallPrompt);

    await act(async () => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(installEvent);
      await vi.runAllTimersAsync();
    });

    screen.getAllByTestId("online").forEach((element) => {
      expect(element.textContent).toBe("no");
    });
    screen.getAllByTestId("prompt").forEach((element) => {
      expect(element.textContent).toBe("available");
    });
    screen.getAllByTestId("performance-slow").forEach((element) => {
      expect(element.textContent).toBe("0");
    });
  });
});
