import { beforeEach, describe, expect, it } from "vitest";

import {
  analyzeMessageContent,
  analyzeProfileContent,
  assessFraudRisk,
  blockUser,
  detectSuspiciousActivity,
  fileUserReport,
  isUserBlocked,
  listBlockedUsers,
  listReports,
  resetModerationStateForTesting,
  unblockUser,
  updateReportStatus,
} from "../moderation";

const baseTimestamp = Date.now();

describe("safety and moderation utilities", () => {
  beforeEach(() => {
    resetModerationStateForTesting();
  });

  it("tracks user report lifecycle with severity scoring", () => {
    const report = fileUserReport({
      reporterId: "user-1",
      subjectId: "user-2",
      category: "fraud",
      description: "User requested my seed phrase and promised guaranteed returns.",
      evidence: ["screenshot.png", "tx-log"],
      occurrences: 2,
      severityHint: "high",
    });

    expect(report.id).toMatch(/[0-9a-f-]{8,}/i);
    expect(report.severity).toBe("high");
    expect(report.weight).toBeGreaterThan(60);
    expect(report.status).toBe("open");
    expect(report.evidence).toHaveLength(2);

    const updated = updateReportStatus(report.id, "investigating", {
      note: "Escalated for manual review",
      moderatorId: "moderator-1",
    });

    expect(updated.status).toBe("investigating");
    expect(updated.updates).toHaveLength(1);
    expect(updated.updates[0]?.note).toContain("Escalated");

    const reportsForSubject = listReports({ subjectId: "user-2" });
    expect(reportsForSubject).toHaveLength(1);
    expect(reportsForSubject[0]?.severity).toBe("high");
  });

  it("detects suspicious messaging behaviour with actionable recommendations", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      body:
        index % 2 === 0
          ? "Claim this airdrop now https://t.me/suspicious"
          : "Send me your seed phrase for double returns",
      createdAt: baseTimestamp + index * 2000,
      senderId: "user-3",
      kind: "text" as const,
    }));

    const assessment = detectSuspiciousActivity({
      conversationId: "conversation-1",
      actorId: "user-3",
      messages,
      accountAgeHours: 2,
      reportsAgainstUser: 3,
      failedVerifications: 2,
      unusualGiftAttempts: 1,
      blockedByOthers: 2,
    });

    expect(assessment.severity).toBe("high");
    expect(assessment.score).toBeGreaterThanOrEqual(70);
    expect(assessment.signals.some((signal) => signal.type === "phishing_link")).toBe(true);
    expect(assessment.recommendedActions).toContain("suspend_messaging");
  });

  it("assesses fraud risk using payment safety signals", () => {
    const fraud = assessFraudRisk({
      walletAgeDays: 3,
      chargebackRate: 0.55,
      disputedGiftCount: 2,
      kycVerified: false,
      velocityLastHour: 5,
      highValueGiftUsd: 900,
      failedPinAttempts: 4,
    });

    expect(fraud.level).toBe("high");
    expect(fraud.score).toBeGreaterThan(70);
    expect(fraud.triggers).toContain("Wallet age 3 days");
    expect(fraud.recommendedActions).toContain("pause_gifts");
  });

  it("flags risky content across chat messages and profiles", () => {
    const messageCheck = analyzeMessageContent(
      "SEND ME YOUR SEED PHRASE at https://scam.example so I can double your profit",
    );

    expect(messageCheck.severity).toBe("high");
    expect(messageCheck.blockRecommended).toBe(true);
    expect(messageCheck.flags.some((flag) => flag.type === "scam")).toBe(true);
    expect(messageCheck.flags.some((flag) => flag.type === "phishing_link")).toBe(true);

    const profileCheck = analyzeProfileContent({
      headline: "Guaranteed returns expert",
      bio: "Contact me on telegram for private deals",
      externalLinks: ["https://t.me/suspicious"],
    });

    expect(profileCheck.severity).toBe("high");
    expect(profileCheck.blockRecommended).toBe(true);
    expect(profileCheck.flags.length).toBeGreaterThanOrEqual(2);
  });

  it("manages user blocking with bidirectional safety checks", () => {
    const record = blockUser("user-10", "user-11", { reason: "harassment" });
    expect(record.active).toBe(true);

    expect(isUserBlocked("user-10", "user-11")).toBe(true);
    expect(isUserBlocked("user-11", "user-10")).toBe(true);

    const blocked = listBlockedUsers("user-10");
    expect(blocked).toHaveLength(1);
    expect(blocked[0]?.blockedId).toBe("user-11");

    const duplicate = blockUser("user-10", "user-11", { note: "Still concerning" });
    expect(duplicate.id).toBe(record.id);
    expect(duplicate.note).toBe("Still concerning");

    expect(unblockUser("user-10", "user-11")).toBe(true);
    expect(isUserBlocked("user-10", "user-11")).toBe(false);
  });
});
