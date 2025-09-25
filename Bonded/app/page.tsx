"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildMatchCandidate,
  describeCategory,
  type CompatibilityProfile,
  type MatchCandidate,
  type MatchDecision,
} from "@/lib/matching/compatibility";
import { assessPersonality } from "@/lib/personality/assessment";
import { MatchCard } from "./components/MatchCard";
import { PremiumSubscriptionPanel } from "./components/PremiumSubscriptionPanel";
import { PersonalityHighlight } from "./components/PersonalityHighlight";
import { WalletAuthPanel } from "./components/WalletAuthPanel";
import { IcebreakerSuggestions } from "./components/IcebreakerSuggestions";
import { ChatInterface } from "./components/ChatInterface";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { ProfileManagementPanel } from "./components/ProfileManagementPanel";
import { ChallengeEventHub } from "./components/ChallengeEventHub";
import { SocialEngagementPanel } from "./components/SocialEngagementPanel";
import { PremiumFiltersPanel } from "./components/PremiumFiltersPanel";
import { PremiumSuperLikeSpotlight } from "./components/PremiumSuperLikeSpotlight";
import { PremiumExclusiveContentPanel } from "./components/PremiumExclusiveContentPanel";
import { LaunchOperationsPanel } from "./components/LaunchOperationsPanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import styles from "./page.module.css";
import { useMatchQueue } from "./hooks/useMatchQueue";
import { usePremiumSubscription } from "./hooks/usePremiumSubscription";
import { useChallengeHub } from "./hooks/useChallengeHub";
import { useMobileExperience } from "./hooks/useMobileExperience";
import { useLaunchMetrics } from "./hooks/useLaunchMetrics";
import { useAnalytics } from "./hooks/useAnalytics";
import {
  buildPremiumFilterFacets,
  buildSuperLikeSpotlightEntry,
  filterCandidates,
  hasFeature,
  prioritizeCandidates,
  resolvePlan,
  summarizeFilters,
  type PremiumFilterOptions,
  type SuperLikeSpotlightEntry,
} from "@/lib/premium";
import { notifyMutualMatch } from "@/lib/mobile/notifications";
import { useIcebreakerSuggestions } from "./hooks/useIcebreakerSuggestions";
import {
  optimizeCandidateSeeds,
  resolveOptimizationIntent,
  type CandidateSeed,
} from "@/lib/mobile/optimization";

const SPOTLIGHT_LIMIT = 4;

const createDefaultPremiumFilters = (): PremiumFilterOptions => ({
  searchTerm: "",
  minScore: 0,
  categories: [],
  tokenSymbols: [],
  defiProtocols: [],
  activityFocus: [],
  personalities: [],
  warmSignalsOnly: false,
});

const seekerPortfolio: CompatibilityProfile["portfolio"] = {
  tokens: [
    { symbol: "ETH", allocation: 0.32, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.22, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
    { symbol: "UNI", allocation: 0.07 },
    { symbol: "AEROX", allocation: 0.05 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
    { name: "BaseSwap", category: "dex", risk: "adventurous" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 11, 19, 20, 21, 22],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["On-chain since 2018", "Runs a weekly governance call"],
};

const seekerAssessment = assessPersonality(seekerPortfolio);

const seekerProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Ava Protocol",
    headline: "Base-native strategist bridging DeFi and governance",
    personality: seekerAssessment.type,
    basename: "ava.base",
    avatarColor: "linear-gradient(135deg, #5f5bff 0%, #00d1ff 100%)",
    location: "New York • EST",
    achievements: ["Base OG", "DAO Strategist"],
    bio: "Bridging TradFi intuition with DeFi execution.",
    verifications: [
      {
        id: "wallet",
        label: "Wallet ownership",
        status: "verified",
        detail: "Signed in with primary Base account",
        lastChecked: new Date("2024-10-04T15:00:00Z").getTime(),
      },
      {
        id: "basename",
        label: "Basename linked",
        status: "verified",
        detail: "Reverse record configured for ava.base",
        lastChecked: new Date("2024-10-03T09:00:00Z").getTime(),
      },
      {
        id: "proof_of_humanity",
        label: "Humanity proof",
        status: "pending",
        detail: "Queued for verification via Base Identity",
      },
    ],
  },
  portfolio: seekerPortfolio,
};

const candidateSeeds: CandidateSeed[] = [
  {
    user: {
      id: "nova-yield",
      displayName: "Nova Yield",
      avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
      location: "Lisbon • WET",
      bio: "Vault architect turning yield curves into love stories.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.3, conviction: "high" },
        { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
        { symbol: "AERO", allocation: 0.16 },
        { symbol: "CBETH", allocation: 0.12 },
        { symbol: "USDC", allocation: 0.12 },
        { symbol: "BAL", allocation: 0.1 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
        { name: "EigenLayer", category: "staking", risk: "balanced" },
        { name: "BaseSwap", category: "dex", risk: "adventurous" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
        { name: "Opepens", theme: "art", vibe: "playful" },
      ],
      activity: {
        timezoneOffset: 0,
        activeHours: [9, 10, 11, 12, 19, 20, 21],
        tradingFrequency: "daily",
        riskTolerance: "balanced",
      },
    },
    interaction: {
      initialDecision: "like",
      autoResponse: { onSuperLike: "super" },
    },
  },
  {
    user: {
      id: "atlas",
      displayName: "Atlas Nodes",
      avatarColor: "linear-gradient(135deg, #7fffd4, #3d7afe)",
      location: "Singapore • SGT",
      bio: "Validator runner & metaverse curator on Base.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.28 },
        { symbol: "AERO", allocation: 0.2 },
        { symbol: "MAGIC", allocation: 0.15 },
        { symbol: "DEGEN", allocation: 0.1 },
        { symbol: "USDC", allocation: 0.12 },
        { symbol: "OP", allocation: 0.15 },
      ],
      defiProtocols: [
        { name: "Aerodrome", category: "dex", risk: "adventurous" },
        { name: "Moonwell", category: "lending", risk: "balanced" },
        { name: "Galxe", category: "infrastructure", risk: "balanced" },
      ],
      nftCollections: [
        { name: "Parallel", theme: "gaming", vibe: "luxury" },
        { name: "Zuku", theme: "gaming", vibe: "playful" },
      ],
      activity: {
        timezoneOffset: 8,
        activeHours: [6, 7, 20, 21, 22, 23],
        tradingFrequency: "weekly",
        riskTolerance: "adventurous",
      },
    },
    interaction: {
      autoResponse: { onLike: "pass", onSuperLike: "like" },
    },
  },
  {
    user: {
      id: "serena",
      displayName: "Serena L2",
      avatarColor: "linear-gradient(135deg, #ff93ff, #7f5dff)",
      location: "Chicago • CST",
      bio: "Structured products maxi keeping composability classy.",
    },
    portfolio: {
      tokens: [
        { symbol: "ETH", allocation: 0.34 },
        { symbol: "USDC", allocation: 0.18 },
        { symbol: "CBETH", allocation: 0.14 },
        { symbol: "AERO", allocation: 0.12 },
        { symbol: "DEGEN", allocation: 0.1 },
        { symbol: "LINK", allocation: 0.12 },
      ],
      defiProtocols: [
        { name: "Aave", category: "lending", risk: "balanced" },
        { name: "BaseSwap", category: "dex", risk: "balanced" },
        { name: "Sommelier", category: "yield", risk: "balanced" },
      ],
      nftCollections: [
        { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
        { name: "Sound XYZ", theme: "music", vibe: "luxury" },
      ],
      activity: {
        timezoneOffset: -6,
        activeHours: [7, 8, 9, 20, 21, 22],
        tradingFrequency: "weekly",
        riskTolerance: "balanced",
      },
    },
    interaction: {
      autoResponse: { onLike: "like" },
    },
  },
] as const;

const candidateProfiles: CompatibilityProfile[] = candidateSeeds.map((candidate) => {
  const assessment = assessPersonality(candidate.portfolio);
  return {
    user: {
      ...candidate.user,
      personality: assessment.type,
    },
    portfolio: candidate.portfolio,
  } satisfies CompatibilityProfile;
});

const candidateProfilesById = new Map<string, CompatibilityProfile>(
  candidateProfiles.map((profile) => [profile.user.id, profile]),
);

export default function Home() {
  const {
    connection,
    isMobileViewport,
    isStandalone,
    online,
    promptInstall,
    serviceWorker,
    push,
    performance,
  } = useMobileExperience();

  const serviceWorkerState = serviceWorker.state;
  const activateServiceWorkerUpdate = serviceWorker.activateUpdate;
  const serviceWorkerRegistration = serviceWorker.registration;
  const { requestPermission: requestPushPermission, subscribe: subscribeToPush } = push;
  const seenMatchNotificationsRef = useRef<Set<string>>(new Set());
  const pushSupported = push.supported;
  const pushPermission = push.permission;
  const pushSubscribed = push.subscribed;
  const pushPromptInFlight = push.isPromptInFlight;
  const analytics = useAnalytics();

  const optimizationIntent = useMemo(
    () =>
      resolveOptimizationIntent({
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
      }),
    [connection?.effectiveType, connection?.saveData],
  );

  const candidateLimit = useMemo(() => {
    if (optimizationIntent === "data-saver") {
      return Math.min(3, candidateSeeds.length);
    }

    if (optimizationIntent === "slow-network") {
      return Math.min(5, candidateSeeds.length);
    }

    if (typeof connection?.downlink === "number" && connection.downlink < 2) {
      return Math.min(6, candidateSeeds.length);
    }

    if (isMobileViewport) {
      return Math.min(7, candidateSeeds.length);
    }

    return candidateSeeds.length;
  }, [connection?.downlink, isMobileViewport, optimizationIntent]);

  const optimizedSeeds = useMemo(
    () =>
      optimizeCandidateSeeds(candidateSeeds, {
        limit: candidateLimit,
        intent: optimizationIntent,
      }),
    [candidateLimit, optimizationIntent],
  );

  const initialCandidates = useMemo(
    () =>
      optimizedSeeds.map((seed) => {
        const profile = candidateProfilesById.get(seed.user.id);
        const compatibilityProfile =
          profile ??
          ({
            user: {
              ...seed.user,
              personality: assessPersonality(seed.portfolio).type,
            },
            portfolio: seed.portfolio,
          } satisfies CompatibilityProfile);

        return buildMatchCandidate(seekerProfile, compatibilityProfile, {
          interaction: seed.interaction,
        });
      }),
    [optimizedSeeds],
  );

  const [premiumFilters, setPremiumFilters] = useState<PremiumFilterOptions>(
    createDefaultPremiumFilters,
  );
  const [superLikeSpotlight, setSuperLikeSpotlight] = useState<SuperLikeSpotlightEntry[]>([]);

  const premiumPlan = useMemo(() => resolvePlan("premium_founder"), []);
  const advancedFiltersEnabled = useMemo(
    () => hasFeature(premiumPlan, "advanced_filters"),
    [premiumPlan],
  );

  const prioritizedCandidates = useMemo(
    () => prioritizeCandidates(initialCandidates, premiumPlan),
    [initialCandidates, premiumPlan],
  );

  const filterFacets = useMemo(
    () => buildPremiumFilterFacets(prioritizedCandidates),
    [prioritizedCandidates],
  );

  const filteredCandidates = useMemo(
    () =>
      advancedFiltersEnabled
        ? filterCandidates(prioritizedCandidates, premiumFilters)
        : prioritizedCandidates,
    [advancedFiltersEnabled, prioritizedCandidates, premiumFilters],
  );

  const filterSummary = useMemo(() => summarizeFilters(premiumFilters), [premiumFilters]);

  const handleInstallPrompt = useCallback(() => {
    if (!promptInstall) {
      return;
    }

    promptInstall().catch(() => undefined);
  }, [promptInstall]);

  const handleServiceWorkerUpdate = useCallback(() => {
    activateServiceWorkerUpdate();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [activateServiceWorkerUpdate]);

  const handleEnableNotifications = useCallback(() => {
    if (!push.supported) {
      return;
    }
    requestPushPermission()
      .then((permission) => {
        if (permission === "granted") {
          return subscribeToPush();
        }
        return null;
      })
      .catch(() => undefined);
  }, [push.supported, requestPushPermission, subscribeToPush]);

  const handleResubscribeNotifications = useCallback(() => {
    subscribeToPush().catch(() => undefined);
  }, [subscribeToPush]);

  const experienceHints = useMemo(
    () => {
      const hints: Array<{
        id: string;
        title: string;
        description: string;
        action?: { label: string; onClick: () => void };
      }> = [];

      if (!online) {
        hints.push({
          id: "offline",
          title: "Offline mode",
          description:
            "You\u2019re browsing cached matches. We\u2019ll sync new data as soon as you reconnect.",
        });
      }

      if (serviceWorkerState.updateAvailable) {
        hints.push({
          id: "update-available",
          title: "Update ready",
          description: "Refresh to load the latest Bonded experience.",
          action: { label: "Refresh", onClick: handleServiceWorkerUpdate },
        });
      }

      if (!isStandalone && promptInstall) {
        hints.push({
          id: "install",
          title: "Install Bonded",
          description:
            "Add Bonded to your home screen for faster access and richer MiniKit support.",
          action: { label: "Install", onClick: handleInstallPrompt },
        });
      }

      if (pushSupported && pushPermission === "default") {
        hints.push({
          id: "push-enable",
          title: "Enable notifications",
          description:
            "Turn on push alerts to get notified the moment a match messages you.",
          action: {
            label: pushPromptInFlight ? "Requesting\u2026" : "Enable",
            onClick: handleEnableNotifications,
          },
        });
      } else if (pushSupported && pushPermission === "denied") {
        hints.push({
          id: "push-denied",
          title: "Notifications blocked",
          description:
            "Update your browser settings to allow notifications for Bonded and never miss a match alert.",
        });
      } else if (pushSupported && pushPermission === "granted" && !pushSubscribed) {
        hints.push({
          id: "push-resubscribe",
          title: "Activate alerts",
          description:
            "Subscribe to match notifications to get real-time updates on new connections.",
          action: { label: "Subscribe", onClick: handleResubscribeNotifications },
        });
      }

      if (optimizationIntent === "data-saver") {
        hints.push({
          id: "data-saver",
          title: "Data saver active",
          description:
            "We\u2019re trimming match insights to reduce data usage. Disable data saver for full detail.",
        });
      } else if (optimizationIntent === "slow-network") {
        hints.push({
          id: "slow-network",
          title: "Optimized for slow network",
          description:
            "We detected a slower connection and are loading lighter match details for smoother swipes.",
        });
      }

      if ((performance.lastFrameDuration ?? 0) > 80 || performance.slowFrameCount > 8) {
        hints.push({
          id: "performance",
          title: "Optimize responsiveness",
          description:
            "We noticed a few slow frames. Closing other heavy tabs can keep swipes buttery smooth.",
        });
      }

      return hints;
    }, [
      handleInstallPrompt,
      handleServiceWorkerUpdate,
      handleEnableNotifications,
      handleResubscribeNotifications,
      isStandalone,
      online,
      optimizationIntent,
      performance.lastFrameDuration,
      performance.slowFrameCount,
      promptInstall,
      pushPermission,
      pushPromptInFlight,
      pushSubscribed,
      pushSupported,
      serviceWorkerState.updateAvailable,
    ],
  );

  const handleFiltersChange = useCallback(
    (nextFilters: PremiumFilterOptions) => {
      setPremiumFilters(nextFilters);
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setPremiumFilters(createDefaultPremiumFilters());
  }, []);

  const {
    state: queueState,
    activeCandidate,
    decide,
    dismissNotification,
    reviewedCount,
    undoLastDecision,
  } = useMatchQueue(filteredCandidates);

  const filteredCount = filteredCandidates.length;
  const totalCandidates = queueState.entries.length;
  const progress = totalCandidates
    ? Math.round((reviewedCount / totalCandidates) * 100)
    : 0;
  const matchesReviewed = `${reviewedCount}/${totalCandidates}`;
  const positiveMatches = queueState.decisions.filter((entry) => entry.decision !== "pass");
  const superLikes = queueState.decisions.filter((entry) => entry.decision === "super");
  const decisionLog = [...queueState.decisions].sort((a, b) => b.createdAt - a.createdAt);
  const mutualMatches = [...queueState.matches].sort((a, b) => b.createdAt - a.createdAt);
  const notifications = queueState.notifications;
  const hasNotifications = experienceHints.length > 0 || notifications.length > 0;

  const candidatesById = useMemo(() => {
    return queueState.entries.reduce(
      (acc, entry) => {
        const profile = candidateProfilesById.get(entry.candidate.user.id);
        acc.set(entry.candidate.user.id, {
          candidate: entry.candidate,
          portfolio: profile?.portfolio,
        });
        return acc;
      },
      new Map<string, { candidate: MatchCandidate; portfolio?: CompatibilityProfile["portfolio"] }>(),
    );
  }, [queueState.entries]);

  const seekerParticipant = useMemo(
    () => ({
      userId: seekerProfile.user.id,
      displayName: seekerProfile.user.displayName,
      avatarColor: seekerProfile.user.avatarColor,
      role: "seeker" as const,
    }),
    [],
  );

  const { suggestions: icebreakerSuggestions, isDelivering: isDeliveringIcebreakers } =
    useIcebreakerSuggestions({
      matches: mutualMatches,
      seekerProfile,
      seekerPersonality: seekerAssessment,
      candidatesById,
    });

  useEffect(() => {
    if (!push.supported || push.permission !== "granted" || pushSubscribed) {
      return;
    }
    subscribeToPush().catch(() => undefined);
  }, [push.permission, push.supported, pushSubscribed, subscribeToPush]);

  useEffect(() => {
    if (!serviceWorkerRegistration || !push.supported || push.permission !== "granted") {
      return;
    }

    const knownIds = seenMatchNotificationsRef.current;
    const ids = new Set(notifications.map((notification) => notification.id));
    knownIds.forEach((id) => {
      if (!ids.has(id)) {
        knownIds.delete(id);
      }
    });

    notifications
      .filter((notification) => notification.type === "mutual-match")
      .forEach((notification) => {
        if (notification.read || knownIds.has(notification.id)) {
          return;
        }
        knownIds.add(notification.id);
        notifyMutualMatch(serviceWorkerRegistration, notification).catch(() => undefined);
      });
  }, [notifications, push.permission, push.supported, serviceWorkerRegistration]);

  const premium = usePremiumSubscription({ planId: premiumPlan.id, queueState });
  const [premiumNotice, setPremiumNotice] = useState<string | null>(null);

  const showFilters = premium.features.hasAdvancedFilters;
  const showSpotlight = premium.features.hasSuperLikeSpotlight;
  const showExclusiveContent = premium.features.hasExclusiveContent;
  const canUndo = premium.features.hasUndo && queueState.decisions.length > 0;
  const undoHelperText = canUndo
    ? "Revisit your previous match instantly."
    : "Swipe to enable undo.";

  useEffect(() => {
    setSuperLikeSpotlight((current) =>
      current.filter((entry) =>
        filteredCandidates.some((candidate) => candidate.user.id === entry.candidateId),
      ),
    );
  }, [filteredCandidates]);

  const challengeView = useChallengeHub();
  const eventPartition = useMemo(
    () => premium.partitionEvents(challengeView.events),
    [challengeView.events, premium],
  );

  const launchMetrics = useLaunchMetrics({
    queueState,
    positiveMatchCount: positiveMatches.length,
    superLikeCount: superLikes.length,
    mutualMatchCount: mutualMatches.length,
    premiumActive: Boolean(premium.subscription),
    premiumCheckoutCount: premium.checkoutSession ? 1 : 0,
    push: {
      supported: pushSupported,
      permission: pushPermission,
      subscribed: pushSubscribed,
    },
    serviceWorker: {
      ready: serviceWorkerState.ready,
      updateAvailable: serviceWorkerState.updateAvailable,
    },
    online,
    performance,
    marketingEvents: {
      accessible: challengeView.events.length,
      locked: eventPartition.locked.length,
    },
    analytics: {
      totalEvents: analytics.totalEvents,
      eventsByCategory: analytics.eventsByCategory,
    },
    baselineWaitlist: 4600,
    initialFeedback: {
      total: 26,
      promoters: 18,
      detractors: 3,
    },
  });

  const nextCandidate = queueState.entries.find((entry, index) => {
    if (queueState.activeIndex === -1) {
      return false;
    }
    return entry.status === "pending" && index > queueState.activeIndex;
  })?.candidate;

  const handleUndoLast = () => {
    const lastDecision = undoLastDecision();
    if (!lastDecision) {
      return;
    }
    premium.undoDecision(lastDecision);
    if (lastDecision.decision === "super") {
      setSuperLikeSpotlight((current) =>
        current.filter((entry) => entry.candidateId !== lastDecision.candidateId),
      );
    }
    setPremiumNotice(null);
  };

  const handleDecision = (decision: MatchDecision) => {
    if (!activeCandidate) {
      return;
    }

    const evaluation = premium.canSendDecision(decision);
    if (!evaluation.canSend) {
      setPremiumNotice(evaluation.reason ?? "Upgrade to continue sending likes.");
      return;
    }

    setPremiumNotice(null);

    if (decision === "super" && premium.features.hasSuperLikeSpotlight) {
      const entry = buildSuperLikeSpotlightEntry(activeCandidate, Date.now());
      setSuperLikeSpotlight((current) => {
        const withoutCandidate = current.filter(
          (existing) => existing.candidateId !== entry.candidateId,
        );
        return [entry, ...withoutCandidate].slice(0, SPOTLIGHT_LIMIT);
      });
    }

    premium.registerDecision(decision);
    decide(activeCandidate.user.id, decision);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Base Dating • MiniKit MVP</span>
          <h1>On-chain chemistry engineered for crypto romantics</h1>
          <p>
            Connect your Base wallet, unlock your crypto personality, and let the compatibility engine
            surface matches who share your token thesis, DeFi strategies, and NFT vibes.
          </p>
          <div className={styles.ctaRow}>
            <WalletAuthPanel />
            <div className={styles.heroStats}>
              <div>
                <span>{seekerProfile.user.personality}</span>
                <small>Personality Archetype</small>
              </div>
              <div>
                <span>{positiveMatches.length}</span>
                <small>Connections today</small>
              </div>
              <div>
                <span>{superLikes.length}</span>
                <small>Super likes sent</small>
              </div>
            </div>
          </div>
          <ul className={styles.requirements}>
            <li>Wallet-authenticated onboarding with Base Account</li>
            <li>Portfolio analysis without revealing balances</li>
            <li>AI-powered reasoning for every match</li>
            <li>Premium-ready super like mechanics</li>
          </ul>
        </div>

        <div className={styles.progressCard}>
          <h2>Matchmaking progress</h2>
          <p className={styles.progressCopy}>
            {matchesReviewed} matches processed • {progress}% through today&apos;s queue
          </p>
          <div className={styles.progressTrack}>
            <span className={styles.progressValue} style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
          <ul className={styles.progressList}>
            {queueState.entries.map((entry, index) => {
              const { candidate } = entry;
              const decision = entry.decision;
              const isActive = queueState.activeIndex === index;
              let status: string;

              if (decision) {
                if (decision.decision === "super") {
                  status = decision.mutual ? "Super match" : "Super like sent";
                } else if (decision.decision === "like") {
                  status = decision.mutual ? "Matched" : "Liked";
                } else {
                  status = "Passed";
                }
              } else if (isActive) {
                status = "Reviewing now";
              } else if (entry.status === "pending") {
                status = "In queue";
              } else {
                status = "Reviewed";
              }

              return (
                <li key={candidate.user.id}>
                  <div>
                    <strong>{candidate.user.displayName}</strong>
                    <span>{describeCategory(candidate.compatibilityScore)}</span>
                  </div>
                  <span className={styles.statusBadge}>{status}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      <section className={styles.onboardingSection}>
        <OnboardingWizard profile={seekerProfile} assessment={seekerAssessment} />
      </section>

      {hasNotifications && (
        <div className={styles.notifications}>
          {experienceHints.map((hint) => (
            <div key={hint.id} className={styles.notification}>
              <div>
                <strong>{hint.title}</strong>
                <span>{hint.description}</span>
              </div>
              {hint.action ? (
                <button type="button" onClick={hint.action.onClick}>
                  {hint.action.label}
                </button>
              ) : null}
            </div>
          ))}
          {notifications.map((notification) => (
            <div key={notification.id} className={styles.notification}>
              <div>
                <strong>New match</strong>
                <span>{notification.message}</span>
              </div>
              <button type="button" onClick={() => dismissNotification(notification.id)}>
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.primaryColumn}>
          <section className={styles.profileSection}>
            <ProfileManagementPanel
              profile={seekerProfile}
              premiumHighlight={premium.profileHighlight}
            />
          </section>
          <section id="matches" className={styles.matchSection}>
            {premiumNotice ? (
              <div className={styles.premiumNotice}>
                <span>{premiumNotice}</span>
                <button type="button" onClick={() => setPremiumNotice(null)}>
                  Dismiss
                </button>
              </div>
            ) : null}
            {premium.features.hasUndo ? (
              <div className={styles.undoRow}>
                <button type="button" onClick={handleUndoLast} disabled={!canUndo}>
                  Undo last swipe
                </button>
                <span>{undoHelperText}</span>
              </div>
            ) : null}
            <div className={styles.deck}>
              {nextCandidate ? (
                <div className={styles.previewCard} aria-hidden>
                  <strong>{nextCandidate.user.displayName}</strong>
                  <span>
                    {Math.round(nextCandidate.compatibilityScore.overall * 100)}% match • {describeCategory(nextCandidate.compatibilityScore)}
                  </span>
                </div>
              ) : null}
              {activeCandidate ? (
                <div className={styles.cardSlot}>
                  <MatchCard
                    key={activeCandidate.user.id}
                    candidate={activeCandidate}
                    isActive
                    onDecision={handleDecision}
                  />
                </div>
              ) : (
                <div className={`${styles.emptyState} ${styles.deckEmpty}`}>
                  <h2>{filteredCount ? "Queue complete" : "No matches meet your filters"}</h2>
                  <p>
                    {filteredCount
                      ? "New compatibility scans will refresh once fresh wallets opt in. Stay tuned!"
                      : "Adjust your advanced filters to expand the matchmaking net."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className={styles.challengeSection}>
            <ChallengeEventHub
              view={challengeView}
              accessibleEvents={eventPartition.accessible}
              lockedEvents={eventPartition.locked}
            />
          </section>

          <section id="chat" className={styles.chatSection}>
            <ChatInterface
              matches={mutualMatches}
              seeker={seekerParticipant}
              seekerPortfolio={seekerProfile.portfolio}
              candidatesById={candidatesById}
            />
          </section>

          <section className={styles.socialSection}>
            <SocialEngagementPanel />
          </section>

          <section className={styles.launchSection}>
            <LaunchOperationsPanel
              summary={launchMetrics.summary}
              checklist={launchMetrics.checklist}
              kpis={launchMetrics.kpis}
              marketingHighlights={launchMetrics.marketingHighlights}
              supportChannels={launchMetrics.supportChannels}
              analyticsHealth={launchMetrics.analyticsHealth}
              operations={launchMetrics.operations}
              onAction={launchMetrics.trackAction}
              onSupportSelect={launchMetrics.trackSupport}
            />
          </section>
        </div>

        <aside className={styles.sidebar}>
          {showFilters ? (
            <PremiumFiltersPanel
              filters={premiumFilters}
              facets={filterFacets}
              summary={filterSummary}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          ) : null}
          <section className={styles.panel}>
            <PremiumSubscriptionPanel
              plan={premium.plan}
              allowance={premium.allowance}
              whoLikedMe={premium.whoLikedMe}
              subscription={premium.subscription}
              lockedEvents={eventPartition.locked}
              isProcessing={premium.isProcessingCheckout}
              checkoutError={premium.checkoutError}
              onUpgrade={() =>
                premium.startCheckout({ walletAddress: "0xseeker" }).catch(() => undefined)
              }
            />
          </section>
          {showSpotlight ? (
            <PremiumSuperLikeSpotlight entries={superLikeSpotlight} />
          ) : null}
          {showExclusiveContent ? (
            <PremiumExclusiveContentPanel items={premium.exclusiveContent} />
          ) : null}
          <section className={styles.panel}>
            <h3>Your crypto fingerprint</h3>
            <PersonalityHighlight assessment={seekerAssessment} />
            <ul>
              <li>
                <strong>Top tokens</strong>
                <span>
                  {seekerProfile.portfolio.tokens
                    .slice(0, 3)
                    .map((token) => token.symbol)
                    .join(" · ")}
                </span>
              </li>
              <li>
                <strong>DeFi focus</strong>
                <span>
                  {seekerProfile.portfolio.defiProtocols
                    .slice(0, 2)
                    .map((protocol) => protocol.name)
                    .join(" · ")}
                </span>
              </li>
              <li>
                <strong>Active hours</strong>
                <span>Evenings EST • Governance calls Wednesdays</span>
              </li>
            </ul>
          </section>

          <section className={styles.panel}>
            <IcebreakerSuggestions
              matches={mutualMatches}
              suggestions={icebreakerSuggestions}
              isGenerating={isDeliveringIcebreakers}
            />
          </section>

          <section className={styles.panel}>
            <h3>Mutual matches</h3>
            {mutualMatches.length === 0 ? (
              <p className={styles.emptyCopy}>
                No mutual matches yet. Keep exploring and send a super like to spark a connection.
              </p>
            ) : (
              <ul className={styles.matchList}>
                {mutualMatches.map((match) => (
                  <li key={match.id}>
                    <div>
                      <strong>{match.displayName}</strong>
                      <span>
                        {Math.round(match.compatibilityScore * 100)}% •
                        {" "}
                        {match.decision === "super" ? "Super like" : "Liked"}
                      </span>
                    </div>
                    <span className={styles.matchBadge}>Matched</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <h3>Decision log</h3>
            <ul className={styles.logList}>
              {decisionLog.length === 0 ? (
                <li className={styles.logEmpty}>No decisions yet. Review your first match to begin.</li>
              ) : (
                decisionLog.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{entry.candidateName}</strong>
                      <span>{Math.round(entry.compatibilityScore * 100)}%</span>
                    </div>
                    <span className={styles.logMeta}>
                      {entry.mutual
                        ? "Matched"
                        : entry.decision === "pass"
                        ? "Passed"
                        : entry.decision === "like"
                        ? "Liked"
                        : "Super liked"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={styles.panel}>
            <h3>Upcoming features</h3>
            <ul className={styles.featureList}>
              <li>Real-time chat drops with Base Pay micro-gifts</li>
              <li>AI icebreakers tuned to market events</li>
              <li>Viral compatibility reports for social amplification</li>
              <li>Weekly on-chain couple challenges with badges</li>
            </ul>
          </section>

          <section className={styles.panel}>
            <FeedbackPanel stats={launchMetrics.feedback} onSubmitSuccess={launchMetrics.registerFeedback} />
          </section>
        </aside>
      </main>
    </div>
  );
}
