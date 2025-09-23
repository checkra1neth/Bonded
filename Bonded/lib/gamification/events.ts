import {
  type ChallengeDefinition,
  type ChallengeEvent,
  type ChallengeParticipantState,
  type EventAgendaItem,
  type EventConnectionSuggestion,
  type EventFormat,
} from "./types";

const HOURS_IN_DAY = 24;

const addHours = (date: Date, hours: number) => {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + hours);
  return next;
};

const eventId = (challenge: ChallengeDefinition, slug: string) => `${challenge.slug}-${slug}`;

const defaultAgenda = (focus: string, host: string): EventAgendaItem[] => [
  {
    title: "Kickoff sync",
    startOffsetMinutes: 0,
    durationMinutes: 20,
    facilitator: host,
    outcome: "Align goals and success metrics",
  },
  {
    title: `${focus} deep dive`,
    startOffsetMinutes: 20,
    durationMinutes: 30,
    facilitator: "Community researcher",
    outcome: "Surface actionable insights",
  },
  {
    title: "Connection rounds",
    startOffsetMinutes: 50,
    durationMinutes: 25,
    facilitator: "Match lead",
    outcome: "Pair attendees for follow-on missions",
  },
];

const determineFormat = (focusAreas: string[]): EventFormat =>
  focusAreas.includes("culture") ? "hybrid" : "virtual";

export function createWeeklyEventSchedule(
  challenge: ChallengeDefinition,
  participants: ChallengeParticipantState[],
): ChallengeEvent[] {
  const events: ChallengeEvent[] = [];
  const baseStart = addHours(challenge.startsAt, HOURS_IN_DAY + 3);
  const host = participants[0]?.displayName ?? "Base Community";

  events.push({
    id: eventId(challenge, "defi-huddle"),
    title: `DeFi Study Group • ${challenge.featuredProtocols[0] ?? "Aerodrome"} loops`,
    description: "Workshop advanced liquidity loops with Base-native strategists.",
    type: "defi_study_group",
    format: "virtual",
    focusAreas: [challenge.focusAreas[0] ?? "DeFi"],
    startTime: baseStart,
    endTime: addHours(baseStart, 1.5),
    host,
    location: "Base Hub (virtual)",
    capacity: 40,
    vibe: "Collaborative alpha sharing",
    resources: [
      "Shared Notion playbook",
      "Farcaster channel for async follow ups",
      `${challenge.featuredProtocols[0] ?? "Aerodrome"}/strategy-kit`,
    ],
    agenda: defaultAgenda(challenge.focusAreas[0] ?? "DeFi", host),
    recommendedRoles: ["strategist", "researcher"],
    access: "standard",
  });

  const artWalkStart = addHours(challenge.startsAt, HOURS_IN_DAY * 2 + 5);
  events.push({
    id: eventId(challenge, "culture-walk"),
    title: "NFT Gallery Walk • Base culture circuit",
    description: "Tour a curated set of Base NFT drops and record live reactions.",
    type: "nft_gallery_walk",
    format: determineFormat(["culture", ...challenge.focusAreas]),
    focusAreas: ["culture", challenge.focusAreas[1] ?? "Community"],
    startTime: artWalkStart,
    endTime: addHours(artWalkStart, 2),
    host: "Culture curator node",
    location: "Onchain Base Gallery",
    capacity: 60,
    vibe: "High energy discovery",
    resources: ["POAP mint link", "Artist roster", "Gallery playlist"],
    agenda: defaultAgenda("culture", "Culture curator node"),
    recommendedRoles: ["curator", "community"],
    access: "premium",
    premiumPerks: [
      "Backstage meet & greet with featured artists",
      "Token-gated mint allowlist airdrop",
      "Premium lounge voice room with curator Q&A",
    ],
  });

  const retroStart = addHours(challenge.endsAt, -6);
  events.push({
    id: eventId(challenge, "retro"),
    title: "Challenge Retro • Signal and coordination review",
    description: "Close the loop on weekly missions, celebrate wins, and plan next sprint hand-offs.",
    type: "retroactive_review",
    format: "virtual",
    focusAreas: challenge.focusAreas,
    startTime: retroStart,
    endTime: addHours(retroStart, 1.25),
    host: "Challenge operations",
    location: "Base HQ voice",
    capacity: 50,
    vibe: "Reflective + actionable",
    resources: ["Retro board", "Metrics dashboard", "Badge nomination form"],
    agenda: [
      {
        title: "Highlight reel",
        startOffsetMinutes: 0,
        durationMinutes: 20,
        facilitator: "Operations lead",
        outcome: "Celebrate high-signal contributions",
      },
      {
        title: "Systems review",
        startOffsetMinutes: 20,
        durationMinutes: 25,
        facilitator: "Strategy desk",
        outcome: "Surface improvements for next sprint",
      },
      {
        title: "Connection matchmaking",
        startOffsetMinutes: 45,
        durationMinutes: 25,
        facilitator: "Community host",
        outcome: "Pair attendees for next challenge missions",
      },
    ],
    recommendedRoles: ["strategist", "host", "researcher"],
    access: "standard",
  });

  return events;
}

const overlappingFocus = (event: ChallengeEvent, participant: ChallengeParticipantState): boolean =>
  event.focusAreas.some((focus) => participant.focusAreas.includes(focus));

const synergyScore = (event: ChallengeEvent, participant: ChallengeParticipantState): number => {
  const overlap = event.focusAreas.filter((focus) => participant.focusAreas.includes(focus)).length;
  const streakWeight = Math.min(participant.streak, 4);
  return overlap * 30 + streakWeight * 10 + Math.min(participant.xp / 10, 40);
};

export function planEventConnections(
  event: ChallengeEvent,
  participants: ChallengeParticipantState[],
): EventConnectionSuggestion[] {
  const eligible = participants.filter((participant) => overlappingFocus(event, participant));
  if (eligible.length < 2) {
    return [];
  }

  const sorted = [...eligible].sort(
    (a, b) => synergyScore(event, b) - synergyScore(event, a),
  );

  const suggestions: EventConnectionSuggestion[] = [];
  for (let index = 0; index < sorted.length - 1; index += 2) {
    const first = sorted[index];
    const second = sorted[index + 1];
    if (!second) {
      break;
    }

    const sharedFocus = event.focusAreas.filter((focus) =>
      first.focusAreas.includes(focus) && second.focusAreas.includes(focus),
    );

    suggestions.push({
      eventId: event.id,
      participants: [
        { userId: first.userId, displayName: first.displayName, focusAreas: first.focusAreas },
        { userId: second.userId, displayName: second.displayName, focusAreas: second.focusAreas },
      ],
      synergyScore: Math.round((synergyScore(event, first) + synergyScore(event, second)) / 2),
      reason: `Shared focus on ${sharedFocus.join(" & ") || event.focusAreas[0]} with complementary strengths`,
      highlight: `${first.displayName} brings ${first.strengths[0] ?? "ops"}, ${second.displayName} adds ${second.strengths[0] ?? "research"}`,
    });
  }

  return suggestions;
}
