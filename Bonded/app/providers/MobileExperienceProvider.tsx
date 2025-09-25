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
import miniAppSdk from "@farcaster/miniapp-sdk";
import { getPublicEnv } from "../../lib/config/public-env";

import {
  startMobilePerformanceMonitor,
  type MobilePerformanceSample,
} from "../../lib/mobile/performance";

type ConnectionInfo = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

type ServiceWorkerState = {
  supported: boolean;
  registered: boolean;
  ready: boolean;
  installing: boolean;
  updateAvailable: boolean;
};

type ServiceWorkerControls = {
  state: ServiceWorkerState;
  activateUpdate: () => void;
  registration: ServiceWorkerRegistration | null;
};

type MiniKitBridge = {
  available: boolean;
  ready: boolean;
  capabilities: string[];
  actions?: typeof miniAppSdk.actions;
  haptics?: typeof miniAppSdk.haptics;
};

type PushState = {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  isPromptInFlight: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<void>;
};

type MobilePerformanceMetrics = {
  slowFrameCount: number;
  avgFrameDuration?: number;
  lastFrameDuration?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  lastUpdated: number;
};

type MobileExperienceContextValue = {
  isMobileViewport: boolean;
  isStandalone: boolean;
  online: boolean;
  connection?: ConnectionInfo;
  serviceWorker: ServiceWorkerControls;
  promptInstall?: () => Promise<boolean>;
  miniKit: MiniKitBridge;
  push: PushState;
  performance: MobilePerformanceMetrics;
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type MutableConnection = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const noop = () => {
  /* noop */
};

const defaultServiceWorkerState: ServiceWorkerState = {
  supported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  registered: false,
  ready: false,
  installing: false,
  updateAvailable: false,
};

const defaultPushSnapshot = {
  supported: typeof window !== "undefined" && "Notification" in window,
  permission:
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  subscribed: false,
  isPromptInFlight: false,
};

const defaultPerformanceMetrics: MobilePerformanceMetrics = {
  slowFrameCount: 0,
  lastUpdated: 0,
};

const defaultContextValue: MobileExperienceContextValue = {
  isMobileViewport: false,
  isStandalone: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  connection: undefined,
  serviceWorker: {
    state: defaultServiceWorkerState,
    activateUpdate: noop,
    registration: null,
  },
  promptInstall: undefined,
  miniKit: {
    available: false,
    ready: false,
    capabilities: [],
  },
  push: {
    ...defaultPushSnapshot,
    requestPermission: async () =>
      typeof Notification === "undefined" ? "denied" : Notification.permission,
    subscribe: async () => null,
    unsubscribe: async () => undefined,
  },
  performance: defaultPerformanceMetrics,
};

const MobileExperienceContext = createContext<MobileExperienceContextValue>(
  defaultContextValue,
);

function getNavigatorConnection(): MutableConnection | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const nav = navigator as Navigator & {
    connection?: MutableConnection;
    mozConnection?: MutableConnection;
    webkitConnection?: MutableConnection;
  };

  return (
    (nav.connection as MutableConnection | undefined) ??
    nav.mozConnection ??
    nav.webkitConnection ??
    null
  );
}

export function MobileExperienceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [connection, setConnection] = useState<ConnectionInfo>();
  const [serviceWorkerState, setServiceWorkerState] = useState<ServiceWorkerState>(
    defaultServiceWorkerState,
  );
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [miniKitState, setMiniKitState] = useState<MiniKitBridge>({
    available: false,
    ready: false,
    capabilities: [],
  });
  const [pushSnapshot, setPushSnapshot] = useState(defaultPushSnapshot);
  const [performanceMetrics, setPerformanceMetrics] = useState<MobilePerformanceMetrics>(
    defaultPerformanceMetrics,
  );

  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = window.matchMedia("(max-width: 768px)");
    const updateViewport = () => {
      setIsMobileViewport(query.matches);
    };

    updateViewport();

    query.addEventListener("change", updateViewport);
    return () => {
      query.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => {
      const isIosStandalone =
        typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithStandalone).standalone);
      setIsStandalone(standaloneQuery.matches || isIosStandalone);
    };

    updateStandalone();

    standaloneQuery.addEventListener("change", updateStandalone);
    window.addEventListener("appinstalled", updateStandalone);

    return () => {
      standaloneQuery.removeEventListener("change", updateStandalone);
      window.removeEventListener("appinstalled", updateStandalone);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setOnline(window.navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const navConnection = getNavigatorConnection();
    if (!navConnection) {
      return;
    }

    const updateConnection = () => {
      setConnection({
        effectiveType: navConnection.effectiveType,
        saveData: navConnection.saveData,
        downlink: navConnection.downlink,
      });
    };

    updateConnection();

    const changeHandler = () => updateConnection();

    navConnection.addEventListener?.("change", changeHandler);

    return () => {
      navConnection.removeEventListener?.("change", changeHandler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt as EventListener);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handlePrompt as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "test"
    ) {
      setServiceWorkerState((prev) => ({
        ...prev,
        supported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
      }));
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (cancelled) {
          return;
        }

        setServiceWorkerRegistration(registration);
        setServiceWorkerState({
          supported: true,
          registered: true,
          ready: Boolean(registration.active),
          installing: Boolean(registration.installing),
          updateAvailable: false,
        });

        const monitorInstallingWorker = (worker: ServiceWorker | null) => {
          if (!worker) {
            return;
          }

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              waitingWorkerRef.current = worker;
              setServiceWorkerState((prev) => ({
                ...prev,
                installing: false,
                updateAvailable: navigator.serviceWorker.controller !== null,
              }));
            }
          });
        };

        monitorInstallingWorker(registration.installing);

        registration.addEventListener("updatefound", () => {
          setServiceWorkerState((prev) => ({ ...prev, installing: true }));
          monitorInstallingWorker(registration.installing);
        });

        navigator.serviceWorker.ready
          .then((readyRegistration) => {
            if (cancelled) {
              return;
            }

            waitingWorkerRef.current = readyRegistration.waiting ?? null;
            setServiceWorkerRegistration(readyRegistration);

            setServiceWorkerState({
              supported: true,
              registered: true,
              ready: true,
              installing: false,
              updateAvailable: Boolean(readyRegistration.waiting),
            });
          })
          .catch(() => {
            /* ignore readiness errors */
          });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (cancelled) {
            return;
          }

          waitingWorkerRef.current = null;
          setServiceWorkerState((prev) => ({
            ...prev,
            updateAvailable: false,
          }));
        });
      } catch (error) {
        console.error("Service worker registration failed", error);
        if (!cancelled) {
          setServiceWorkerState({
            supported: true,
            registered: false,
            ready: false,
            installing: false,
            updateAvailable: false,
          });
          setServiceWorkerRegistration(null);
        }
      }
    };

    register();

    return () => {
      cancelled = true;
      setServiceWorkerRegistration(null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapMiniKit = async () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const available = await miniAppSdk.isInMiniApp?.();
        if (!available || cancelled) {
          return;
        }

        const [capabilities] = await Promise.all([
          miniAppSdk.getCapabilities?.().catch(() => []),
          miniAppSdk.actions.ready?.().catch(() => undefined),
        ]);

        if (cancelled) {
          return;
        }

        setMiniKitState({
          available: true,
          ready: true,
          capabilities: Array.isArray(capabilities) ? capabilities : [],
          actions: miniAppSdk.actions,
          haptics: miniAppSdk.haptics,
        });
      } catch (error) {
        console.warn("MiniKit integration unavailable", error);
      }
    };

    bootstrapMiniKit();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const monitor = startMobilePerformanceMonitor((sample: MobilePerformanceSample) => {
      setPerformanceMetrics((prev) => ({
        slowFrameCount: sample.slowFrameCount,
        avgFrameDuration: sample.avgFrameDuration ?? prev.avgFrameDuration,
        lastFrameDuration: sample.lastFrameDuration ?? prev.lastFrameDuration,
        lcp: sample.lcp ?? prev.lcp,
        cls: sample.cls ?? prev.cls,
        fid: sample.fid ?? prev.fid,
        lastUpdated: sample.timestamp,
      }));
    });

    return () => {
      monitor.stop();
    };
  }, []);

  useEffect(() => {
    const supported = typeof window !== "undefined" && "Notification" in window;
    const permission =
      supported && typeof Notification !== "undefined" ? Notification.permission : "denied";

    setPushSnapshot((prev) => ({
      ...prev,
      supported,
      permission: supported ? permission : "denied",
    }));

    if (!supported || !serviceWorkerRegistration) {
      if (!supported) {
        setPushSnapshot((prev) => ({ ...prev, subscribed: false }));
      }
      return;
    }

    let cancelled = false;

    serviceWorkerRegistration.pushManager
      .getSubscription()
      .then((subscription) => {
        if (cancelled) {
          return;
        }
        setPushSnapshot((prev) => ({
          ...prev,
          supported,
          permission,
          subscribed: Boolean(subscription),
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [serviceWorkerRegistration]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) {
      return;
    }

    const handleSubscriptionChange = () => {
      if (!serviceWorkerRegistration) {
        return;
      }
      serviceWorkerRegistration.pushManager
        .getSubscription()
        .then((subscription) => {
          setPushSnapshot((prev) => ({ ...prev, subscribed: Boolean(subscription) }));
        })
        .catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener(
      "pushsubscriptionchange",
      handleSubscriptionChange as EventListener,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "pushsubscriptionchange",
        handleSubscriptionChange as EventListener,
      );
    };
  }, [serviceWorkerRegistration]);

  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPushSnapshot((prev) => ({ ...prev, supported: false, permission: "denied" }));
      return "denied";
    }

    setPushSnapshot((prev) => ({ ...prev, isPromptInFlight: true }));
    let result: NotificationPermission = Notification.permission;
    try {
      result = await Notification.requestPermission();
    } finally {
      setPushSnapshot((prev) => ({
        ...prev,
        permission: result,
        isPromptInFlight: false,
      }));
    }

    return result;
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!serviceWorkerRegistration || typeof Notification === "undefined") {
      return null;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await requestPushPermission();
    }

    if (permission !== "granted") {
      setPushSnapshot((prev) => ({ ...prev, permission, subscribed: false }));
      return null;
    }

    try {
      const existing = await serviceWorkerRegistration.pushManager.getSubscription();
      if (existing) {
        setPushSnapshot((prev) => ({ ...prev, permission, subscribed: true }));
        return existing;
      }

      const options: PushSubscriptionOptionsInit = { userVisibleOnly: true };
      const applicationServerKey = getPublicEnv("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY");
      if (applicationServerKey) {
        options.applicationServerKey = urlBase64ToUint8Array(applicationServerKey);
      }

      const subscription = await serviceWorkerRegistration.pushManager.subscribe(options);
      setPushSnapshot((prev) => ({ ...prev, permission, subscribed: true }));
      return subscription;
    } catch (error) {
      console.warn("Push subscription failed", error);
      setPushSnapshot((prev) => ({ ...prev, subscribed: false }));
      return null;
    }
  }, [requestPushPermission, serviceWorkerRegistration]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!serviceWorkerRegistration) {
      return;
    }
    try {
      const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.warn("Push unsubscribe failed", error);
    } finally {
      setPushSnapshot((prev) => ({ ...prev, subscribed: false }));
    }
  }, [serviceWorkerRegistration]);

  const promptInstallApp = useCallback(async () => {
    if (!installPrompt) {
      return false;
    }

    installPrompt.prompt();
    try {
      const result = await installPrompt.userChoice;
      return result.outcome === "accepted";
    } finally {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const activateUpdate = useCallback(() => {
    const waitingWorker = waitingWorkerRef.current;
    if (!waitingWorker) {
      return;
    }

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const contextValue = useMemo<MobileExperienceContextValue>(
    () => ({
      isMobileViewport,
      isStandalone,
      online,
      connection,
      miniKit: miniKitState,
      serviceWorker: {
        state: serviceWorkerState,
        activateUpdate,
        registration: serviceWorkerRegistration,
      },
      promptInstall: installPrompt ? promptInstallApp : undefined,
      push: {
        ...pushSnapshot,
        requestPermission: requestPushPermission,
        subscribe: subscribeToPush,
        unsubscribe: unsubscribeFromPush,
      },
      performance: performanceMetrics,
    }),
    [
      activateUpdate,
      connection,
      installPrompt,
      isMobileViewport,
      isStandalone,
      miniKitState,
      online,
      performanceMetrics,
      pushSnapshot,
      promptInstallApp,
      requestPushPermission,
      serviceWorkerRegistration,
      serviceWorkerState,
      subscribeToPush,
      unsubscribeFromPush,
    ],
  );

  return (
    <MobileExperienceContext.Provider value={contextValue}>
      {children}
    </MobileExperienceContext.Provider>
  );
}

export function useMobileExperienceContext() {
  return useContext(MobileExperienceContext);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  let rawData: string;
  if (typeof window === "undefined") {
    if (typeof atob === "function") {
      rawData = atob(base64);
    } else {
      rawData = Buffer.from(base64, "base64").toString("binary");
    }
  } else {
    rawData = window.atob(base64);
  }
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}
