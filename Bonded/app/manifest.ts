import type { MetadataRoute } from "next";

import { minikitConfig } from "@/minikit.config";

export default function manifest(): MetadataRoute.Manifest {
  const name = minikitConfig.frame.name ?? "Bonded";

  return {
    name,
    short_name: "Bonded",
    description: minikitConfig.frame.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#5f5bff",
    orientation: "portrait",
    categories: ["dating", "social", "lifestyle"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/splash.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Match queue",
        url: "/#matches",
        description: "Jump directly to your current match queue.",
      },
      {
        name: "Chat",
        url: "/#chat",
        description: "Resume conversations instantly.",
      },
    ],
  };
}
