import React from "react";
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { CompatibilityProfile } from "../../../lib/matching/compatibility";
import { ProfileManagementPanel } from "../ProfileManagementPanel";

const sampleProfile: CompatibilityProfile = {
  user: {
    id: "sample-user",
    displayName: "Nova Strategist",
    personality: "DeFi Degen",
    basename: "nova.base",
    headline: "Coordinating Base-native growth loops",
    avatarColor: "linear-gradient(135deg, #ff8a8a, #ffd76f)",
    location: "Lisbon • WET",
    achievements: ["Base OG", "Protocol Architect"],
    bio: "Designing on-chain coordination systems that actually ship.",
    verifications: [
      {
        id: "wallet",
        label: "Wallet ownership",
        status: "verified",
        detail: "Signed from primary vault",
        lastChecked: new Date("2024-09-18T10:00:00Z").getTime(),
      },
      {
        id: "basename",
        label: "Basename linked",
        status: "verified",
        detail: "Reverse record configured",
        lastChecked: new Date("2024-09-17T08:00:00Z").getTime(),
      },
      {
        id: "proof_of_humanity",
        label: "Humanity proof",
        status: "unverified",
        detail: "Optional boost",
      },
    ],
  },
  portfolio: {
    tokens: [
      { symbol: "ETH", allocation: 0.42, conviction: "high" },
      { symbol: "DEGEN", allocation: 0.21, conviction: "medium" },
      { symbol: "AERO", allocation: 0.12 },
    ],
    defiProtocols: [
      { name: "Aerodrome", category: "dex", risk: "adventurous" },
      { name: "Aave", category: "lending", risk: "balanced" },
    ],
    nftCollections: [
      { name: "BasePaint", theme: "art" },
    ],
    activity: {
      timezoneOffset: 0,
      activeHours: [9, 10, 22],
      tradingFrequency: "daily",
      riskTolerance: "adventurous",
    },
    highlights: ["DAO governance lead", "Runs weekly Base sync"],
  },
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  cleanup();
  vi.useRealTimers();
});

describe("ProfileManagementPanel", () => {
  it("updates the profile preview when core fields change", () => {
    render(<ProfileManagementPanel profile={sampleProfile} />);

    const nameInput = screen.getByLabelText(/Display name/i);
    fireEvent.change(nameInput, { target: { value: "Orbit Weaver" } });

    expect(screen.getByTestId("profile-preview-name")).toHaveTextContent("Orbit Weaver");
  });

  it("hides token intel when sharing is disabled", () => {
    render(<ProfileManagementPanel profile={sampleProfile} />);

    const [toggle] = screen.getAllByLabelText(/Share token allocations/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/Token visibility disabled/i)).toBeInTheDocument();
  });

  it("reflects verification changes in the preview", () => {
    render(<ProfileManagementPanel profile={sampleProfile} />);

    const basenameSelect = screen.getByLabelText(/Basename linked/i);
    fireEvent.change(basenameSelect, { target: { value: "pending" } });

    expect(screen.getByTestId("verification-basename")).toHaveTextContent(/Pending/i);
  });

  it("adds new achievements to the preview badges", () => {
    render(<ProfileManagementPanel profile={sampleProfile} />);

    const input = screen.getByPlaceholderText(/Add a highlight/i);
    fireEvent.change(input, { target: { value: "Base Mentor" } });
    fireEvent.click(screen.getByRole("button", { name: /Add highlight/i }));

    expect(screen.getByTestId("profile-preview-achievements")).toHaveTextContent("Base Mentor");
  });
});
