"use client";

import * as React from "react";
import type { ChangeEvent } from "react";

import { useAuth } from "../providers/AuthProvider";
import { WalletAuthPanel } from "./WalletAuthPanel";
import { PersonalityHighlight } from "./PersonalityHighlight";
import type { CompatibilityProfile } from "../../lib/matching/compatibility";
import type { PersonalityAssessment } from "../../lib/personality/types";
import {
  DEFAULT_PRIVACY_PREFERENCES,
  applyPrivacyPreferences,
  type ActivityVisibilityLevel,
  type PortfolioPrivacyPreferences,
  type PortfolioVisibilityLevel,
  type TransactionVisibilityLevel,
} from "../../lib/portfolio/privacy";
import type { AllocationBucket, ActivityPeriod, RiskTolerance } from "../../lib/portfolio/types";

import styles from "./OnboardingWizard.module.css";

const STEP_ORDER = ["wallet", "analysis", "personality", "profile", "preferences"] as const;

type StepId = (typeof STEP_ORDER)[number];

interface StepState {
  currentStep: StepId;
  completed: StepId[];
}

type StepAction =
  | { type: "COMPLETE_STEP"; stepId: StepId }
  | { type: "SET_STEP"; stepId: StepId };

const initialStepState: StepState = {
  currentStep: STEP_ORDER[0],
  completed: [],
};

function stepReducer(state: StepState, action: StepAction): StepState {
  switch (action.type) {
    case "COMPLETE_STEP": {
      const completed = state.completed.includes(action.stepId)
        ? state.completed
        : [...state.completed, action.stepId];

      const currentIndex = STEP_ORDER.indexOf(action.stepId);
      const isLastStep = currentIndex === STEP_ORDER.length - 1;
      const nextStep = isLastStep ? action.stepId : STEP_ORDER[currentIndex + 1];

      return {
        currentStep: nextStep,
        completed,
      };
    }

    case "SET_STEP":
      return {
        ...state,
        currentStep: action.stepId,
      };

    default:
      return state;
  }
}

const stepLabels: Record<StepId, string> = {
  wallet: "Wallet verification",
  analysis: "Portfolio privacy",
  personality: "Personality insights",
  profile: "Profile customization",
  preferences: "Matching preferences",
};

const stepDescriptions: Record<StepId, string> = {
  wallet: "Verify your Base identity to start onboarding",
  analysis: "Control how much of your portfolio is visible",
  personality: "Decide which strengths you want to highlight",
  profile: "Tune your public profile and gallery",
  preferences: "Set discovery and compatibility preferences",
};

const ALLOCATION_DESCRIPTIONS: Record<AllocationBucket, string> = {
  dominant: "Dominant allocation",
  significant: "Significant position",
  diversified: "Diversified holding",
  exploratory: "Exploratory stake",
};

const ACTIVITY_LABELS: Record<ActivityPeriod, string> = {
  early_morning: "Early morning (4–8) ",
  morning: "Morning (8–12)",
  afternoon: "Afternoon (12–16)",
  evening: "Evening (16–20)",
  late_night: "Late night (20–24)",
};

type AdvancedPrivacyKey = keyof Pick<
  PortfolioPrivacyPreferences,
  | "maskTokenConviction"
  | "maskTokenChains"
  | "maskDefiStrategies"
  | "maskDefiRisks"
  | "maskNftThemes"
  | "maskActivityRisk"
  | "redactHighlights"
  | "shareTransactions"
>;

const advancedPrivacyOptions: Array<{
  key: AdvancedPrivacyKey;
  label: string;
  description: string;
}> = [
  {
    key: "maskTokenConviction",
    label: "Hide conviction labels",
    description: "Only surface allocation buckets for shared tokens.",
  },
  {
    key: "maskTokenChains",
    label: "Mask chain provenance",
    description: "Keep Base/L2 chain metadata private.",
  },
  {
    key: "maskDefiStrategies",
    label: "Redact strategy notes",
    description: "Show protocols without exposing your playbook.",
  },
  {
    key: "maskDefiRisks",
    label: "Hide risk scores",
    description: "Protect your risk tolerance from public view.",
  },
  {
    key: "maskNftThemes",
    label: "Redact NFT themes",
    description: "Share ownership signals without art themes.",
  },
  {
    key: "maskActivityRisk",
    label: "Mask activity risk",
    description: "Display timezone sync without risk alignment.",
  },
  {
    key: "redactHighlights",
    label: "Redact highlight details",
    description: "Replace milestones with privacy-safe summaries.",
  },
];

const transactionVisibilityOptions: Array<{ value: TransactionVisibilityLevel; label: string }> = [
  { value: "ANONYMIZED", label: "Anonymized buckets" },
  { value: "SUMMARY", label: "Privacy-safe summary" },
  { value: "HIDDEN", label: "Hidden" },
];

const relationshipIntentOptions = [
  {
    id: "long_term_partnership",
    label: "Long-term partnership",
    description: "Looking for a co-founder in life and on-chain adventures.",
  },
  {
    id: "builder_alliance",
    label: "Builder alliance",
    description: "Prioritizing collaborative building and compounding crypto goals.",
  },
  {
    id: "open_to_experiments",
    label: "Open to experiments",
    description: "Open to discovering the right dynamic through shared experiences.",
  },
];

const timezonePreferences = [
  { id: "synchronous", label: "Stay in sync (±2h)" },
  { id: "evening_overlap", label: "Overlap evenings & weekends" },
  { id: "async", label: "Async is fine if vibes align" },
];

const discoveryEventOptions = [
  { id: "governance_calls", label: "Governance calls" },
  { id: "defi_strategy", label: "DeFi strategy sprints" },
  { id: "nft_gallery", label: "NFT gallery tours" },
  { id: "base_meetups", label: "Base IRL meetups" },
  { id: "builder_hackathons", label: "Builder hackathons" },
];

const communicationStyles = [
  { id: "async_memes", label: "Async updates & memes" },
  { id: "voice_notes", label: "Voice notes & market recaps" },
  { id: "video_calls", label: "Weekly video strategy calls" },
];

const discoveryRadiusOptions = [
  { id: "local", label: "Prioritize local connections" },
  { id: "regional", label: "Regional within ±5 hours" },
  { id: "global", label: "Open to global matches" },
];

const interestOptions = [
  { id: "defi", label: "DeFi strategy" },
  { id: "governance", label: "DAO governance" },
  { id: "nft", label: "NFT curation" },
  { id: "base_meetups", label: "Base IRL meetups" },
  { id: "ai_tooling", label: "AI x crypto tooling" },
  { id: "education", label: "Crypto education" },
  { id: "gaming", label: "On-chain gaming" },
];

const galleryOptions = [
  { id: "governance", label: "Governance war room" },
  { id: "irl_base", label: "Base community meetup" },
  { id: "analytics", label: "On-chain analytics desk" },
  { id: "nft_gallery", label: "NFT gallery highlight" },
  { id: "gm_scene", label: "Sunrise gm ritual" },
];

const riskOptions: RiskTolerance[] = [
  "conservative",
  "balanced",
  "adventurous",
  "degenerate",
];

function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item)
    ? items.filter((existing) => existing !== item)
    : [...items, item];
}

export interface OnboardingWizardProps {
  profile: CompatibilityProfile;
  assessment: PersonalityAssessment;
}

export function OnboardingWizard({ profile, assessment }: OnboardingWizardProps) {
  const { status, isLoading } = useAuth();

  const [stepState, dispatch] = React.useReducer(stepReducer, initialStepState);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [privacyPreferences, setPrivacyPreferences] = React.useState<PortfolioPrivacyPreferences>(
    DEFAULT_PRIVACY_PREFERENCES,
  );
  const [allowListInputs, setAllowListInputs] = React.useState({ fids: "", wallets: "" });
  const [selectedStrengths, setSelectedStrengths] = React.useState<string[]>([]);
  const [selectedGrowthAreas, setSelectedGrowthAreas] = React.useState<string[]>([]);
  const [connectionIntent, setConnectionIntent] = React.useState<string>(relationshipIntentOptions[0].id);
  const [profileForm, setProfileForm] = React.useState({
    displayName: profile.user.displayName ?? "",
    basename: profile.user.basename ?? "",
    headline: `${assessment.type} energy seeking aligned co-pilot`,
    bio: profile.user.bio ?? "",
    interests: ["defi", "governance"],
    gallery: ["governance", "irl_base"],
  });
  const [preferencesState, setPreferencesState] = React.useState({
    relationshipIntent: relationshipIntentOptions[0].id,
    riskAlignment: ["balanced", "adventurous"] as RiskTolerance[],
    timezonePreference: timezonePreferences[1].id,
    discoveryEvents: ["governance_calls", "base_meetups"],
    communicationStyle: communicationStyles[0].id,
    discoveryRadius: "global",
  });

  const sanitizedPortfolio = React.useMemo(
    () => applyPrivacyPreferences(profile.portfolio, privacyPreferences),
    [privacyPreferences, profile.portfolio],
  );

  const currentIndex = STEP_ORDER.indexOf(stepState.currentStep);
  const completedCount = stepState.completed.length;
  const progress = Math.round((completedCount / STEP_ORDER.length) * 100);
  const onboardingComplete = completedCount === STEP_ORDER.length;

  React.useEffect(() => {
    setErrorMessage(null);
  }, [stepState.currentStep]);

  const highestCompletedIndex = stepState.completed.reduce((acc, stepId) => {
    const index = STEP_ORDER.indexOf(stepId);
    return index > acc ? index : acc;
  }, -1);

  const maxUnlockedIndex = Math.min(
    Math.max(highestCompletedIndex + 1, currentIndex),
    STEP_ORDER.length - 1,
  );

  const handleVisibilityChange = (
    key: "tokenVisibility" | "defiVisibility" | "nftVisibility",
  ) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as PortfolioVisibilityLevel;
      setPrivacyPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleActivityVisibilityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ActivityVisibilityLevel;
    setPrivacyPreferences((prev) => ({
      ...prev,
      activityVisibility: value,
    }));
  };

  const handleAllowListChange = (
    field: "fids" | "wallets",
    parser: (value: string) => number[] | string[],
  ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setAllowListInputs((prev) => ({
        ...prev,
        [field]: value,
      }));

      setPrivacyPreferences((prev) => ({
        ...prev,
        allowList: {
          ...prev.allowList,
          [field === "fids" ? "fids" : "walletAddresses"]: parser(value),
        },
      }));
    };

  const handleAdvancedPrivacyToggle = (key: AdvancedPrivacyKey) => {
    setPrivacyPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTransactionVisibilityChange = (value: TransactionVisibilityLevel) => {
    setPrivacyPreferences((prev) => ({
      ...prev,
      transactionVisibility: value,
    }));
  };

  const handleTransactionWindowChange = (value: number) => {
    const normalized = Math.min(365, Math.max(1, Math.round(value)));
    setPrivacyPreferences((prev) => ({
      ...prev,
      transactionWindowDays: normalized,
    }));
  };

  const handleInterestToggle = (interestId: string) => {
    setProfileForm((prev) => ({
      ...prev,
      interests: toggleItem(prev.interests, interestId),
    }));
  };

  const handleGalleryToggle = (entryId: string) => {
    setProfileForm((prev) => ({
      ...prev,
      gallery: toggleItem(prev.gallery, entryId),
    }));
  };

  const handleRiskToggle = (risk: RiskTolerance) => {
    setPreferencesState((prev) => ({
      ...prev,
      riskAlignment: toggleItem(prev.riskAlignment, risk),
    }));
  };

  const handleEventToggle = (eventId: string) => {
    setPreferencesState((prev) => ({
      ...prev,
      discoveryEvents: toggleItem(prev.discoveryEvents, eventId),
    }));
  };

  const validateStep = (stepId: StepId): { valid: boolean; message?: string } => {
    switch (stepId) {
      case "wallet":
        if (status !== "authenticated") {
          return { valid: false, message: "Connect and verify your wallet to continue." };
        }
        return { valid: true };

      case "analysis": {
        const shareSomething =
          privacyPreferences.shareTokens ||
          privacyPreferences.shareDefi ||
          privacyPreferences.shareNfts ||
          privacyPreferences.shareActivity ||
          privacyPreferences.shareHighlights ||
          privacyPreferences.shareTransactions;

        if (!shareSomething) {
          return { valid: false, message: "Select at least one portfolio element to share." };
        }

        return { valid: true };
      }

      case "personality": {
        if (selectedStrengths.length < 2) {
          return { valid: false, message: "Pick at least two strengths to highlight." };
        }

        if (selectedGrowthAreas.length < 1) {
          return { valid: false, message: "Choose one growth area you want to work on." };
        }

        return { valid: true };
      }

      case "profile": {
        if (!profileForm.displayName.trim()) {
          return { valid: false, message: "Add the display name you want matches to see." };
        }

        if (profileForm.bio.trim().length < 40) {
          return {
            valid: false,
            message: "Expand your bio to at least 40 characters so matches understand your vibe.",
          };
        }

        if (profileForm.interests.length < 3) {
          return {
            valid: false,
            message: "Select at least three interests to anchor your profile.",
          };
        }

        if (profileForm.gallery.length < 2) {
          return {
            valid: false,
            message: "Choose two or more gallery prompts to showcase your world.",
          };
        }

        return { valid: true };
      }

      case "preferences": {
        if (!preferencesState.relationshipIntent) {
          return { valid: false, message: "Pick your primary relationship intent." };
        }

        if (preferencesState.riskAlignment.length === 0) {
          return { valid: false, message: "Select at least one preferred risk alignment." };
        }

        if (preferencesState.discoveryEvents.length === 0) {
          return { valid: false, message: "Choose at least one discovery experience you enjoy." };
        }

        return { valid: true };
      }

      default:
        return { valid: true };
    }
  };

  const completeCurrentStep = () => {
    const result = validateStep(stepState.currentStep);
    if (!result.valid) {
      setErrorMessage(result.message ?? "Complete the required fields for this step.");
      return;
    }

    setErrorMessage(null);
    dispatch({ type: "COMPLETE_STEP", stepId: stepState.currentStep });
  };

  const stepButtonLabel: Record<StepId, string> = {
    wallet: "Continue to portfolio",
    analysis: "Save privacy & continue",
    personality: "Confirm personality insights",
    profile: "Save profile & continue",
    preferences: onboardingComplete ? "Onboarding complete" : "Save preferences & finish",
  };

  const nextButtonLabel = onboardingComplete
    ? "Onboarding complete"
    : stepButtonLabel[stepState.currentStep];

  const handleNext = () => {
    if (onboardingComplete) {
      return;
    }
    completeCurrentStep();
  };

  const renderStepSummary = () => {
    if (!onboardingComplete) {
      return null;
    }

    const interestLabels = profileForm.interests
      .map((id) => interestOptions.find((option) => option.id === id)?.label)
      .filter(Boolean)
      .join(" • ");

    const galleryLabels = profileForm.gallery
      .map((id) => galleryOptions.find((option) => option.id === id)?.label)
      .filter(Boolean)
      .join(" • ");

    const riskLabels = preferencesState.riskAlignment
      .map((risk) => risk.charAt(0).toUpperCase() + risk.slice(1))
      .join(" • ");

    const eventLabels = preferencesState.discoveryEvents
      .map((id) => discoveryEventOptions.find((option) => option.id === id)?.label)
      .filter(Boolean)
      .join(" • ");

    const communicationLabel =
      communicationStyles.find((style) => style.id === preferencesState.communicationStyle)?.label ??
      "Async updates & memes";

    const intentLabel =
      relationshipIntentOptions.find((option) => option.id === preferencesState.relationshipIntent)?.label ??
      "Long-term partnership";

    return (
      <div className={styles.completionSummary} role="status">
        <strong>All onboarding steps complete!</strong>
        <span>
          Your profile highlights {interestLabels || "curated interests"} with a gallery featuring {galleryLabels ||
            "your best moments"}.
        </span>
        <span>
          You\'re seeking {intentLabel.toLowerCase()} with {riskLabels || "your preferred risk vibes"} risk
          alignment and love connecting through {communicationLabel.toLowerCase()}.
        </span>
        <span>Discovery focus: {eventLabels || "Tailor-made experiences"}.</span>
      </div>
    );
  };

  const shareToggle = (
    label: string,
    checked: boolean,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
    description: string,
  ) => (
    <label className={styles.toggleRow} key={label}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );

  const renderWalletStep = () => {
    const walletReady = status === "authenticated";
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <h3>Connect your Base wallet</h3>
          <p>
            Sign in with Farcaster SIWF to link your Base Account. This verifies your identity so the compatibility
            engine can calibrate matches.
          </p>
        </div>
        <WalletAuthPanel />
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={handleNext}
            disabled={isLoading || !walletReady}
          >
            {walletReady ? nextButtonLabel : "Waiting for wallet verification"}
          </button>
        </div>
      </div>
    );
  };

  const renderAnalysisStep = () => {
    const tokenCount = sanitizedPortfolio.tokens.length;
    const defiCount = sanitizedPortfolio.defiProtocols.length;
    const nftCount = sanitizedPortfolio.nftCollections.length;
    const activityPeriods = sanitizedPortfolio.activity?.activePeriods ?? [];
    const timezone = sanitizedPortfolio.activity?.timezone;
    const transactionSummary = sanitizedPortfolio.transactions;
    const firstTransactionBucket = transactionSummary?.buckets[0];
    const transactionPreview = !privacyPreferences.shareTransactions
      ? "Hidden"
      : transactionSummary && transactionSummary.buckets.length
        ? `${firstTransactionBucket?.inboundCount ?? 0} inbound / ${
            firstTransactionBucket?.outboundCount ?? 0
          } outbound`
        : "No recent activity in window";
    const counterpartyPreview =
      privacyPreferences.shareTransactions && transactionSummary?.notableCounterparties.length
        ? transactionSummary.notableCounterparties[0]
        : null;

    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <h3>Portfolio privacy controls</h3>
          <p>Decide what your matches see – amounts are never stored, only curated highlights and patterns.</p>
        </div>

        <div className={styles.privacyGrid}>
          {shareToggle(
            "Tokens",
            privacyPreferences.shareTokens,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareTokens: event.target.checked,
              })),
            "Share your top allocations without revealing exact balances.",
          )}
          {shareToggle(
            "DeFi protocols",
            privacyPreferences.shareDefi,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareDefi: event.target.checked,
              })),
            "Showcase the strategies and platforms you trust.",
          )}
          {shareToggle(
            "NFT collections",
            privacyPreferences.shareNfts,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareNfts: event.target.checked,
              })),
            "Let others see your art, music, and identity flexes.",
          )}
          {shareToggle(
            "Activity patterns",
            privacyPreferences.shareActivity,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareActivity: event.target.checked,
              })),
            "Reveal timezone overlaps and trading rhythms without exact timestamps.",
          )}
          {shareToggle(
            "Highlights",
            privacyPreferences.shareHighlights,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareHighlights: event.target.checked,
              })),
            "Show curated achievements like hackathons, DAOs, and Base milestones.",
          )}
        </div>

        <div className={styles.advancedPrivacy}>
          <h4>Advanced privacy filters</h4>
          <div className={styles.privacyGrid}>
            {advancedPrivacyOptions.map(({ key, label, description }) =>
              shareToggle(label, Boolean(privacyPreferences[key]), () => handleAdvancedPrivacyToggle(key), description),
            )}
          </div>
        </div>

        <div className={styles.transactionPrivacy}>
          {shareToggle(
            "Share anonymized transaction flow",
            privacyPreferences.shareTransactions,
            (event) =>
              setPrivacyPreferences((prev) => ({
                ...prev,
                shareTransactions: event.target.checked,
              })),
            "Publish bucketed inbound/outbound counts with masked counterparties.",
          )}

          {privacyPreferences.shareTransactions ? (
            <div className={styles.transactionControls}>
              <label>
                <span>Visibility mode</span>
                <select
                  value={privacyPreferences.transactionVisibility}
                  onChange={(event) =>
                    handleTransactionVisibilityChange(event.target.value as TransactionVisibilityLevel)
                  }
                >
                  {transactionVisibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Rolling window (days)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={privacyPreferences.transactionWindowDays}
                  onChange={(event) =>
                    handleTransactionWindowChange(Number.parseInt(event.target.value, 10))
                  }
                />
              </label>
              <p>
                We hash counterparties and bucket flows so your exact transaction history never leaves the vault.
              </p>
            </div>
          ) : (
            <p className={styles.transactionHint}>
              Leave disabled to keep all transaction cadence data completely private.
            </p>
          )}
        </div>

        <div className={styles.fieldGrid}>
          <label className={styles.selectField}>
            <span>Token visibility</span>
            <select
              value={privacyPreferences.tokenVisibility}
              onChange={handleVisibilityChange("tokenVisibility")}
            >
              <option value="SUMMARY">Top 3 allocations</option>
              <option value="DETAILED">Top 10 allocations</option>
              <option value="HIDDEN">Hide tokens</option>
            </select>
          </label>
          <label className={styles.selectField}>
            <span>DeFi visibility</span>
            <select
              value={privacyPreferences.defiVisibility}
              onChange={handleVisibilityChange("defiVisibility")}
            >
              <option value="SUMMARY">Core protocols</option>
              <option value="DETAILED">Extended strategies</option>
              <option value="HIDDEN">Hide protocols</option>
            </select>
          </label>
          <label className={styles.selectField}>
            <span>NFT visibility</span>
            <select
              value={privacyPreferences.nftVisibility}
              onChange={handleVisibilityChange("nftVisibility")}
            >
              <option value="SUMMARY">Signature collections</option>
              <option value="DETAILED">Extended gallery</option>
              <option value="HIDDEN">Hide collections</option>
            </select>
          </label>
          <label className={styles.selectField}>
            <span>Activity visibility</span>
            <select value={privacyPreferences.activityVisibility} onChange={handleActivityVisibilityChange}>
              <option value="PATTERNS">Time windows + risk profile</option>
              <option value="TIMEZONE_ONLY">Timezone only</option>
              <option value="HIDDEN">Hide activity patterns</option>
            </select>
          </label>
        </div>

        <div className={styles.allowListRow}>
          <label>
            <span>Allow-listed Farcaster FIDs (comma separated)</span>
            <input
              type="text"
              value={allowListInputs.fids}
              onChange={handleAllowListChange("fids", (value) =>
                value
                  .split(/[,\s]+/)
                  .map((entry) => Number.parseInt(entry, 10))
                  .filter((entry) => Number.isFinite(entry)),
              )}
              placeholder="e.g. 777777, 12345"
            />
          </label>
          <label>
            <span>Allow-listed wallet addresses</span>
            <input
              type="text"
              value={allowListInputs.wallets}
              onChange={handleAllowListChange("wallets", (value) =>
                value
                  .split(/[,\s]+/)
                  .map((entry) => entry.trim())
                  .filter((entry) => entry.length > 0),
              )}
              placeholder="0xabc…, base:ava.eth"
            />
          </label>
        </div>

        <div className={styles.previewCard}>
          <h4>Privacy preview</h4>
          <p>
            Matches will see {tokenCount} tokens, {defiCount} DeFi protocols, and {nftCount} NFT collections based on
            your selections.
          </p>
          <ul>
            <li>
              <strong>Tokens</strong>
              <span>
                {privacyPreferences.shareTokens && tokenCount > 0
                  ? sanitizedPortfolio.tokens
                      .map((token) => `${token.symbol} • ${ALLOCATION_DESCRIPTIONS[token.allocationBucket]}`)
                      .join(" · ")
                  : "Hidden"}
              </span>
            </li>
            <li>
              <strong>DeFi</strong>
              <span>
                {privacyPreferences.shareDefi && defiCount > 0
                  ? sanitizedPortfolio.defiProtocols
                      .map((protocol) => `${protocol.name} (${protocol.category})`)
                      .join(" · ")
                  : "Hidden"}
              </span>
            </li>
            <li>
              <strong>NFTs</strong>
              <span>
                {privacyPreferences.shareNfts && nftCount > 0
                  ? sanitizedPortfolio.nftCollections
                      .map((collection) => `${collection.name} (${collection.theme})`)
                      .join(" · ")
                  : "Hidden"}
              </span>
            </li>
            <li>
              <strong>Activity</strong>
              <span>
                {privacyPreferences.shareActivity && sanitizedPortfolio.activity
                  ? `${timezone ?? "Timezone hidden"} • ${
                      activityPeriods.length
                        ? activityPeriods.map((period) => ACTIVITY_LABELS[period]).join(" · ")
                        : "No active hours"
                    }`
                  : "Hidden"}
              </span>
            </li>
            <li>
              <strong>Transactions</strong>
              <span>
                {privacyPreferences.shareTransactions
                  ? `${transactionPreview}${counterpartyPreview ? ` • ${counterpartyPreview}` : ""}`
                  : "Hidden"}
              </span>
            </li>
          </ul>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryAction} onClick={handleNext}>
            {nextButtonLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderPersonalityStep = () => {
    const strengthsAvailable = assessment.strengths;
    const growthAvailable = assessment.growthAreas;

    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <h3>Crypto personality calibration</h3>
          <p>
            Highlight the traits you want surfaced in your profile and choose the growth edges you want matches to help
            you level up.
          </p>
        </div>

        <PersonalityHighlight assessment={assessment} variant="compact" />

        <div className={styles.choiceGroup}>
          <h4>Showcase these strengths</h4>
          <p>Select at least two strengths to display in your profile highlights.</p>
          <div className={styles.choiceGrid}>
            {strengthsAvailable.map((strength) => {
              const checked = selectedStrengths.includes(strength);
              return (
                <label
                  key={strength}
                  className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedStrengths((prev) => toggleItem(prev, strength))}
                  />
                  <span>{strength}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.choiceGroup}>
          <h4>Growth edges</h4>
          <p>Pick one area where you want to grow together.</p>
          <div className={styles.choiceGrid}>
            {growthAvailable.map((area) => {
              const checked = selectedGrowthAreas.includes(area);
              return (
                <label key={area} className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedGrowthAreas((prev) => toggleItem(prev, area))}
                  />
                  <span>{area}</span>
                </label>
              );
            })}
          </div>
        </div>

        <fieldset className={styles.intentGroup}>
          <legend>Connection intent</legend>
          <div className={styles.intentGrid}>
            {relationshipIntentOptions.map((option) => (
              <label
                key={option.id}
                className={`${styles.intentOption} ${
                  connectionIntent === option.id ? styles.choiceActive : ""
                }`}
              >
                <input
                  type="radio"
                  name="connection-intent"
                  value={option.id}
                  checked={connectionIntent === option.id}
                  onChange={() => setConnectionIntent(option.id)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryAction} onClick={handleNext}>
            {nextButtonLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderProfileStep = () => {
    const interestLabels = profileForm.interests
      .map((id) => interestOptions.find((option) => option.id === id)?.label)
      .filter(Boolean);

    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <h3>Profile customization</h3>
          <p>Craft how your Base-aligned matches experience your profile.</p>
        </div>

        <div className={styles.fieldGrid}>
          <label>
            <span>Display name</span>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Basename (optional)</span>
            <input
              type="text"
              value={profileForm.basename}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  basename: event.target.value,
                }))
              }
              placeholder="ava.base"
            />
          </label>
        </div>

        <label className={styles.fullWidthField}>
          <span>Headline</span>
          <input
            type="text"
            value={profileForm.headline}
            onChange={(event) =>
              setProfileForm((prev) => ({
                ...prev,
                headline: event.target.value,
              }))
            }
          />
        </label>

        <label className={styles.fullWidthField}>
          <span>Bio</span>
          <textarea
            value={profileForm.bio}
            onChange={(event) =>
              setProfileForm((prev) => ({
                ...prev,
                bio: event.target.value,
              }))
            }
            rows={4}
          />
        </label>

        <div className={styles.choiceGroup}>
          <h4>Interests & highlights</h4>
          <p>Select at least three interests that define your on-chain vibe.</p>
          <div className={styles.choiceGrid}>
            {interestOptions.map((option) => {
              const checked = profileForm.interests.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleInterestToggle(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.choiceGroup}>
          <h4>Gallery prompts</h4>
          <p>Choose the story moments you want to capture in your profile gallery.</p>
          <div className={styles.choiceGrid}>
            {galleryOptions.map((option) => {
              const checked = profileForm.gallery.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleGalleryToggle(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.previewCard}>
          <h4>Profile preview</h4>
          <p>{profileForm.headline}</p>
          <ul>
            <li>
              <strong>Display name</strong>
              <span>
                {profileForm.displayName}
                {profileForm.basename ? ` • ${profileForm.basename}` : ""}
              </span>
            </li>
            <li>
              <strong>Interests</strong>
              <span>{interestLabels.join(" · ")}</span>
            </li>
            <li>
              <strong>Gallery prompts</strong>
              <span>
                {profileForm.gallery
                  .map((id) => galleryOptions.find((entry) => entry.id === id)?.label)
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          </ul>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryAction} onClick={handleNext}>
            {nextButtonLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderPreferencesStep = () => {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <h3>Matching preferences</h3>
          <p>Fine-tune how the compatibility engine prioritizes your future connections.</p>
        </div>

        <fieldset className={styles.intentGroup}>
          <legend>Relationship intent</legend>
          <div className={styles.intentGrid}>
            {relationshipIntentOptions.map((option) => (
              <label
                key={option.id}
                className={`${styles.intentOption} ${
                  preferencesState.relationshipIntent === option.id ? styles.choiceActive : ""
                }`}
              >
                <input
                  type="radio"
                  name="match-intent"
                  value={option.id}
                  checked={preferencesState.relationshipIntent === option.id}
                  onChange={() =>
                    setPreferencesState((prev) => ({
                      ...prev,
                      relationshipIntent: option.id,
                    }))
                  }
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.choiceGroup}>
          <h4>Preferred risk alignment</h4>
          <p>Choose the risk profiles you feel most in sync with.</p>
          <div className={styles.choiceGrid}>
            {riskOptions.map((risk) => {
              const checked = preferencesState.riskAlignment.includes(risk);
              return (
                <label
                  key={risk}
                  className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleRiskToggle(risk)}
                  />
                  <span>{risk.charAt(0).toUpperCase() + risk.slice(1)}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className={styles.fullWidthField}>
          <span>Timezone preference</span>
          <select
            value={preferencesState.timezonePreference}
            onChange={(event) =>
              setPreferencesState((prev) => ({
                ...prev,
                timezonePreference: event.target.value,
              }))
            }
          >
            {timezonePreferences.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.choiceGroup}>
          <h4>Discovery experiences</h4>
          <p>Select the types of experiences you want surfaced in introductions.</p>
          <div className={styles.choiceGrid}>
            {discoveryEventOptions.map((option) => {
              const checked = preferencesState.discoveryEvents.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`${styles.choice} ${checked ? styles.choiceActive : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleEventToggle(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className={styles.fullWidthField}>
          <span>Preferred communication style</span>
          <select
            value={preferencesState.communicationStyle}
            onChange={(event) =>
              setPreferencesState((prev) => ({
                ...prev,
                communicationStyle: event.target.value,
              }))
            }
          >
            {communicationStyles.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fullWidthField}>
          <span>Discovery radius</span>
          <select
            value={preferencesState.discoveryRadius}
            onChange={(event) =>
              setPreferencesState((prev) => ({
                ...prev,
                discoveryRadius: event.target.value,
              }))
            }
          >
            {discoveryRadiusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={handleNext}
            disabled={onboardingComplete}
          >
            {nextButtonLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (stepState.currentStep) {
      case "wallet":
        return renderWalletStep();
      case "analysis":
        return renderAnalysisStep();
      case "personality":
        return renderPersonalityStep();
      case "profile":
        return renderProfileStep();
      case "preferences":
        return renderPreferencesStep();
      default:
        return null;
    }
  };

  return (
    <section className={styles.wizard} aria-label="Onboarding wizard">
      <header className={styles.header}>
        <div>
          <span className={styles.stepBadge}>
            {onboardingComplete ? "Ready to match" : `Step ${currentIndex + 1} of ${STEP_ORDER.length}`}
          </span>
          <h2>Complete your onboarding</h2>
          <p>
            Progressively unlock the compatibility engine by connecting your wallet, calibrating privacy, and defining
            how you want to meet other Base-native romantics.
          </p>
        </div>
        <div className={styles.progressStack}>
          <span>{progress}% complete</span>
          <div className={styles.progressTrack}>
            <span className={styles.progressValue} style={{ width: `${Math.max(progress, 6)}%` }} />
          </div>
        </div>
      </header>

      {renderStepSummary()}

      <div className={styles.body}>
        <ol className={styles.stepList}>
          {STEP_ORDER.map((stepId, index) => {
            const status = stepState.completed.includes(stepId)
              ? "complete"
              : stepState.currentStep === stepId
              ? "active"
              : "upcoming";
            const canNavigate = index <= maxUnlockedIndex;

            return (
              <li key={stepId}>
                <button
                  type="button"
                  className={`${styles.stepButton} ${styles[status]}`}
                  onClick={() => canNavigate && dispatch({ type: "SET_STEP", stepId })}
                  disabled={!canNavigate}
                >
                  <span>
                    <strong>{stepLabels[stepId]}</strong>
                    <small>{stepDescriptions[stepId]}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={styles.stepContent}>
          {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}
          {renderCurrentStep()}
        </div>
      </div>
    </section>
  );
}

