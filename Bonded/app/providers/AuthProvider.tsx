"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

import type { SessionUser } from "@/lib/auth/session";
import { formatAddress } from "@/lib/auth/wallet";
import { withRetry, type RetryOptions } from "@/lib/errors/retry";

import { useErrorHandling } from "../hooks/useErrorHandling";

const DEV_TOKEN_PREFIX = "dev-";

export type AuthStatus = "initializing" | "unauthenticated" | "authenticating" | "authenticated" | "error";

export type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function requestSiwfToken(): Promise<string | undefined> {
  try {
    if (await sdk.isInMiniApp()) {
      const { token } = await sdk.quickAuth.getToken();
      return token;
    }
  } catch (error) {
    console.warn("Unable to obtain Quick Auth token", error);
  }

  if (process.env.NODE_ENV !== "production") {
    const fallbackFid = process.env.NEXT_PUBLIC_AUTH_DEV_FID ?? "777777";
    return `${DEV_TOKEN_PREFIX}${fallbackFid}`;
  }

  return undefined;
}

async function requestChallenge(address: string, retryOptions?: RetryOptions) {
  return withRetry(
    async () => {
      const response = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to request wallet challenge");
      }

      return (await response.json()) as { nonce: string; message: string };
    },
    retryOptions,
  );
}

async function createSession(
  address: string,
  signature: string,
  siwfToken: string | undefined,
  retryOptions?: RetryOptions,
) {
  return withRetry(
    async () => {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, signature, siwfToken }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        user?: SessionUser;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create authenticated session");
      }

      if (!payload.user) {
        throw new Error("Authentication response missing session user");
      }

      return payload.user;
    },
    retryOptions,
  );
}

async function fetchSession(retryOptions?: RetryOptions) {
  return withRetry(
    async () => {
      const response = await fetch("/api/auth/session");

      if (!response.ok) {
        if (response.status >= 500) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Session refresh failed");
        }

        return null;
      }

      const payload = (await response.json().catch(() => ({}))) as { user?: SessionUser };
      return payload.user ?? null;
    },
    retryOptions,
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { captureError } = useErrorHandling();

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "initializing" ? current : "initializing"));
    try {
      const sessionUser = await fetchSession({
        retries: 1,
        minTimeout: 400,
        maxTimeout: 1_200,
      });
      if (sessionUser) {
        setUser(sessionUser);
        setStatus("authenticated");
        setError(null);
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : String(refreshError);
      setError(message);
      setStatus("error");
      captureError(refreshError, {
        message: "Failed to refresh session",
        severity: "warning",
        context: { scope: "auth.refresh", address },
      });
    }
  }, [address, captureError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address) {
      const missingWalletError = new Error("Connect your wallet before authenticating");
      captureError(missingWalletError, {
        message: missingWalletError.message,
        severity: "warning",
        context: { scope: "auth.signIn" },
        userFacing: {
          title: "Connect wallet to continue",
          description: "Link your Base account so we can verify ownership before proceeding.",
          actionLabel: "Got it",
          autoDismissMs: 5000,
        },
      });
      throw missingWalletError;
    }

    setStatus("authenticating");
    setError(null);

    try {
      const challenge = await requestChallenge(address, {
        retries: 2,
        minTimeout: 400,
        maxTimeout: 1_600,
        onRetry: (retryError, attempt) => {
          captureError(retryError, {
            message: "Retrying wallet challenge",
            severity: "warning",
            context: { scope: "auth.challenge", attempt: attempt + 1, address },
          });
        },
      });
      const signature = await withRetry(
        () => signMessageAsync({ message: challenge.message }),
        {
          retries: 1,
          minTimeout: 400,
          maxTimeout: 1_200,
          onRetry: (retryError, attempt) => {
            captureError(retryError, {
              message: "Retrying wallet signature",
              severity: "warning",
              context: { scope: "auth.signMessage", attempt: attempt + 1 },
            });
          },
        },
      );
      const siwfToken = await requestSiwfToken();
      const sessionUser = await createSession(address, signature, siwfToken, {
        retries: 2,
        minTimeout: 400,
        maxTimeout: 1_600,
        onRetry: (retryError, attempt) => {
          captureError(retryError, {
            message: "Retrying session creation",
            severity: "warning",
            context: { scope: "auth.session", attempt: attempt + 1, address },
          });
        },
      });
      setUser(sessionUser);
      setStatus("authenticated");
    } catch (signInError) {
      setStatus("error");
      const message = signInError instanceof Error ? signInError.message : String(signInError);
      setError(message);
      captureError(signInError, {
        message: "Authentication failed",
        severity: "error",
        context: { scope: "auth.signIn", address },
        userFacing: {
          title: "Unable to authenticate",
          description: message,
          actionLabel: "Try again",
          onAction: async () => {
            setStatus("unauthenticated");
            setError(null);
          },
        },
      });
      throw signInError;
    }
  }, [address, captureError, isConnected, signMessageAsync]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    } catch (signOutError) {
      captureError(signOutError, {
        message: "Failed to terminate session",
        severity: "warning",
        context: { scope: "auth.signOut", address },
      });
    } finally {
      if (isConnected) {
        await disconnectAsync().catch(() => undefined);
      }
    }
  }, [address, captureError, disconnectAsync, isConnected]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      error,
      isLoading: status === "initializing" || status === "authenticating",
      signIn,
      signOut,
      refresh,
    };
  }, [error, refresh, signIn, signOut, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function useAuthIdentity() {
  const { user } = useAuth();
  const { address } = useAccount();

  if (!user) {
    return {
      address: address ?? null,
      displayName: address ? formatAddress(address) : null,
      source: "wallet" as const,
    };
  }

  return {
    address: user.address,
    displayName: user.primaryName,
    source: user.primarySource,
  };
}
