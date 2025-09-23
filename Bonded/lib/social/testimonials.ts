import type { SuccessStory } from "./types";

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: "ava-nova",
    headline: "Match made in Base",
    summary: "Ava Protocol and Nova Yield synced on DeFi missions and turned coordination into connection.",
    quote:
      "We met inside a Base weekly challenge and ended up architecting a treasury strategy together before our first date.",
    pair: {
      seeker: "Ava Protocol",
      partner: "Nova Yield",
    },
    metrics: [
      { label: "Shared governance proposals", value: "4" },
      { label: "Co-hosted events", value: "3" },
      { label: "Days to first IRL meetup", value: "6" },
    ],
  },
  {
    id: "atlas-serena",
    headline: "From swipes to studio drops",
    summary: "Atlas Nodes and Serena L2 bonded over NFT culture and launched a community art residency.",
    quote:
      "Their icebreaker about BasePaint turned into a weekly gallery walk and eventually a joint residency for emerging artists.",
    pair: {
      seeker: "Atlas Nodes",
      partner: "Serena L2",
    },
    metrics: [
      { label: "NFT showcases hosted", value: "5" },
      { label: "Shared POAP mints", value: "320" },
      { label: "Community members onboarded", value: "180" },
    ],
  },
];

export function getSuccessStories(): SuccessStory[] {
  return SUCCESS_STORIES;
}
