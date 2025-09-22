"use client";

import { useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";

import { useAuth } from "@/app/providers/AuthProvider";
import styles from "./WalletAuthPanel.module.css";

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletAuthPanel() {
  const { status, user, isLoading, error, signIn, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const [actionError, setActionError] = useState<string | null>(null);

  const identityLabel = useMemo(() => {
    if (user) {
      return user.primaryName;
    }

    if (address) {
      return shorten(address);
    }

    return "Wallet not connected";
  }, [address, user]);

  const primaryButtonLabel = useMemo(() => {
    if (status === "authenticated") {
      return "Sign out";
    }

    if (isLoading) {
      return "Verifying";
    }

    return "Verify wallet";
  }, [isLoading, status]);

  const helperText = useMemo(() => {
    if (!isConnected) {
      return "Connect your Base wallet to continue";
    }

    if (status === "authenticated") {
      return `Session active • FID ${user?.fid ?? "—"}`;
    }

    return "Sign a message to unlock compatibility";
  }, [isConnected, status, user?.fid]);

  const handlePrimaryAction = async () => {
    setActionError(null);

    try {
      if (status === "authenticated") {
        await signOut();
      } else {
        await signIn();
      }
    } catch (actionException) {
      setActionError(actionException instanceof Error ? actionException.message : String(actionException));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.actions}>
        <Wallet />
        <div className={styles.buttonRow}>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={styles.primaryButton}
            disabled={isLoading || (!isConnected && status !== "authenticated")}
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>

      <div className={styles.identity}>{identityLabel}</div>
      <div className={styles.status}>{helperText}</div>

      {(error || actionError) && <div className={styles.error}>{error ?? actionError}</div>}
      <div className={styles.helper}>Farcaster SIWF + Base Account</div>
    </div>
  );
}
