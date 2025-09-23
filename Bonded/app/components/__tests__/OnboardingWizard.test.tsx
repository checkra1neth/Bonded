import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { OnboardingWizard } from "../OnboardingWizard";
import type { PortfolioSnapshot } from "../../../lib/portfolio/types";
import type { CompatibilityProfile } from "../../../lib/matching/compatibility";
import { assessPersonality } from "../../../lib/personality/assessment";

const useAuthMock = vi.fn();

vi.mock("../../providers/AuthProvider", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xabc", isConnected: true }),
  useDisconnect: () => ({ disconnectAsync: vi.fn() }),
  useSignMessage: () => ({ signMessageAsync: vi.fn() }),
}));

vi.mock("@coinbase/onchainkit/wallet", () => ({
  Wallet: () => React.createElement("div", { "data-testid": "wallet-component" }),
}));

const samplePortfolio: PortfolioSnapshot = {
  tokens: [
    { symbol: "ETH", allocation: 0.32, conviction: "high" },
    { symbol: "DEGEN", allocation: 0.2, conviction: "medium" },
    { symbol: "AERO", allocation: 0.16 },
    { symbol: "USDC", allocation: 0.1 },
    { symbol: "CBETH", allocation: 0.08 },
  ],
  defiProtocols: [
    { name: "Aave", category: "lending", risk: "balanced" },
    { name: "Aerodrome", category: "dex", risk: "adventurous" },
    { name: "EigenLayer", category: "staking", risk: "balanced" },
  ],
  nftCollections: [
    { name: "BasePaint", theme: "art", vibe: "cypherpunk" },
    { name: "Parallel", theme: "gaming", vibe: "luxury" },
  ],
  activity: {
    timezoneOffset: -5,
    activeHours: [8, 9, 10, 19, 20, 21],
    tradingFrequency: "daily",
    riskTolerance: "adventurous",
  },
  highlights: ["Runs DAO treasury strategy", "On-chain since 2018"],
};

const sampleAssessment = assessPersonality(samplePortfolio);

const sampleProfile: CompatibilityProfile = {
  user: {
    id: "seeker",
    displayName: "Ava Protocol",
    personality: sampleAssessment.type,
    basename: "ava.base",
    avatarColor: "linear-gradient(135deg, #5f5bff 0%, #00d1ff 100%)",
    location: "New York",
    bio: "Bridging TradFi intuition with DeFi execution.",
  },
  portfolio: samplePortfolio,
};

describe("OnboardingWizard", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: {
        address: "0x123",
        fid: 777777,
        primaryName: "Ava Protocol",
        primarySource: "wallet",
      },
      error: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
    });
  });

  test("walks through the full onboarding flow", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard profile={sampleProfile} assessment={sampleAssessment} />);

    // Step 1 – wallet verification
    const walletButton = await screen.findByRole("button", { name: /continue to portfolio/i });
    await user.click(walletButton);

    // Step 2 – privacy controls
    const privacyButton = await screen.findByRole("button", { name: /save privacy & continue/i });
    await user.click(privacyButton);

    // Step 3 – personality insights
    const strengthChoices = sampleAssessment.strengths.slice(0, 2);
    for (const label of strengthChoices) {
      await user.click(screen.getByLabelText(label));
    }

    const growthLabel = sampleAssessment.growthAreas[0];
    await user.click(screen.getByLabelText(growthLabel));

    const personalityButton = screen.getByRole("button", { name: /confirm personality insights/i });
    await user.click(personalityButton);

    // Step 4 – profile customization
    const displayNameInput = screen.getByLabelText(/display name/i);
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "Ava Protocol");

    const bioInput = screen.getByLabelText(/bio/i);
    await user.clear(bioInput);
    await user.type(
      bioInput,
      "Bridging TradFi intuition with DeFi execution across Base ecosystems and DAO treasuries.",
    );

    // select an additional interest beyond the defaults
    await user.click(screen.getByLabelText(/NFT curation/i));

    const profileButton = screen.getByRole("button", { name: /save profile & continue/i });
    await user.click(profileButton);

    // Step 5 – matching preferences
    const intentOption = screen.getByLabelText(/Builder alliance/i);
    await user.click(intentOption);

    const communicationSelect = screen.getByLabelText(/preferred communication style/i);
    await user.selectOptions(communicationSelect, "voice_notes");

    const finishButton = screen.getByRole("button", { name: /save preferences & finish/i });
    await user.click(finishButton);

    expect(await screen.findByText(/all onboarding steps complete/i)).toBeInTheDocument();
    expect(screen.getByText(/100% complete/i)).toBeInTheDocument();

    const summary = screen.getByRole("status");
    expect(within(summary).getByText(/builder alliance/i)).toBeInTheDocument();
  });
});

