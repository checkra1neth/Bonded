"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

import { AuthProvider } from "./providers/AuthProvider";
import { ErrorHandlingProvider } from "./providers/ErrorHandlingProvider";
import { MobileExperienceProvider } from "./providers/MobileExperienceProvider";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorHandlingProvider>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
          },
          wallet: {
            display: "modal",
            preference: "all",
          },
        }}
        miniKit={{
          enabled: true,
          autoConnect: true,
          notificationProxyUrl: undefined,
        }}
      >
        <MobileExperienceProvider>
          <AuthProvider>{children}</AuthProvider>
        </MobileExperienceProvider>
      </OnchainKitProvider>
    </ErrorHandlingProvider>
  );
}
