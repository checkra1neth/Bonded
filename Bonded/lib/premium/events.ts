import type { ChallengeEvent } from "../gamification/types";
import { hasFeature } from "./plans";
import type { PremiumPlan } from "./types";

export interface EventPartition {
  accessible: ChallengeEvent[];
  locked: ChallengeEvent[];
}

export function partitionEventsForPlan(events: ChallengeEvent[], plan: PremiumPlan): EventPartition {
  if (hasFeature(plan, "exclusive_events")) {
    return { accessible: events, locked: [] };
  }

  const accessible: ChallengeEvent[] = [];
  const locked: ChallengeEvent[] = [];

  events.forEach((event) => {
    if (event.access === "premium") {
      locked.push(event);
    } else {
      accessible.push(event);
    }
  });

  return { accessible, locked };
}
