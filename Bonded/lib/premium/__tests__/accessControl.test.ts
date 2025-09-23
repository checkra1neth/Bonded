import { describe, expect, it, vi } from "vitest";

import { evaluateDecision, initializeUsage, recordDecision } from "../accessControl";
import { resolvePlan } from "../plans";

const FREE_PLAN = resolvePlan("free");
const PREMIUM_PLAN = resolvePlan("premium_founder");

describe("premium access control", () => {
  it("enforces like limits for free plan", () => {
    vi.setSystemTime(new Date("2024-10-01T12:00:00Z"));
    let usage = initializeUsage(Date.now());
    for (let index = 0; index < (FREE_PLAN.maxDailyLikes ?? 0); index += 1) {
      const evaluation = evaluateDecision(FREE_PLAN, {
        decision: "like",
        usage,
        timestamp: Date.now(),
      });
      expect(evaluation.canSend).toBe(true);
      usage = recordDecision(FREE_PLAN, usage, "like", Date.now());
    }

    const finalEvaluation = evaluateDecision(FREE_PLAN, {
      decision: "like",
      usage,
      timestamp: Date.now(),
    });

    expect(finalEvaluation.canSend).toBe(false);
    expect(finalEvaluation.remainingLikes).toBe(0);
    expect(finalEvaluation.reason).toMatch(/Daily like limit/);
  });

  it("allows unlimited likes for premium plan", () => {
    const usage = initializeUsage(Date.now());
    const evaluation = evaluateDecision(PREMIUM_PLAN, {
      decision: "super",
      usage,
      timestamp: Date.now(),
    });

    expect(evaluation.canSend).toBe(true);
    expect(evaluation.remainingLikes).toBeNull();
    expect(evaluation.remainingSuperLikes).toBeNull();
  });

  it("resets usage window on new day", () => {
    const firstDay = new Date("2024-10-01T12:00:00Z").getTime();
    let usage = initializeUsage(firstDay);
    usage = recordDecision(FREE_PLAN, usage, "like", firstDay);
    expect(usage.likes).toBe(1);

    const secondDay = new Date("2024-10-02T01:00:00Z").getTime();
    const evaluation = evaluateDecision(FREE_PLAN, {
      decision: "like",
      usage,
      timestamp: secondDay,
    });

    expect(evaluation.canSend).toBe(true);
    const updated = recordDecision(FREE_PLAN, usage, "like", secondDay);
    expect(updated.likes).toBe(1);
    expect(updated.windowStart).toBeLessThan(secondDay + 1);
  });
});
