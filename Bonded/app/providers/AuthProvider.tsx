"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

import type { SessionUser } from "@/lib/auth/session";
import { formatAddress } from "@/lib/auth/wallet";

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

async function requestChallenge(address: string) {
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
}

async function createSession(address: string, signature: string, siwfToken: string | undefined) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address, signature, siwfToken }),
  });

  const payload = (await response.json().catch(() => ({}))) as { user?: SessionUser; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to create authenticated session");
  }

  if (!payload.user) {
    throw new Error("Authentication response missing session user");
  }

  return payload.user;
}

async function fetchSession() {
  const response = await fetch("/api/auth/session");
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => ({}))) as { user?: SessionUser };
  return payload.user ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "initializing" ? current : "initializing"));
    try {
      const sessionUser = await fetchSession();
      if (sessionUser) {
        setUser(sessionUser);
        setStatus("authenticated");
        setError(null);
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error("Connect your wallet before authenticating");
    }

    setStatus("authenticating");
    setError(null);

    try {
      const challenge = await requestChallenge(address);
      const signature = await signMessageAsync({ message: challenge.message });
      const siwfToken = await requestSiwfToken();
      const sessionUser = await createSession(address, signature, siwfToken);
      setUser(sessionUser);
      setStatus("authenticated");
    } catch (signInError) {
      setStatus("error");
      setError(signInError instanceof Error ? signInError.message : String(signInError));
      throw signInError;
    }
  }, [address, isConnected, signMessageAsync]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    } finally {
      if (isConnected) {
        await disconnectAsync().catch(() => undefined);
      }
    }
  }, [disconnectAsync, isConnected]);

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
