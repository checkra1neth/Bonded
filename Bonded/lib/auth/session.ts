import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import {
  DEFAULT_DEV_FID,
  DEV_TOKEN_PREFIX,
  SESSION_COOKIE_MAX_AGE,
  SESSION_TOKEN_VERSION,
} from "./constants";
import { SessionVerificationError } from "./errors";

export type SessionTokenPayload = {
  sub: string;
  fid: number;
  ensName?: string | null;
  basename?: string | null;
  fallbackName: string;
  primaryName: string;
  primarySource: "ens" | "basename" | "fallback";
  isSmartContract: boolean;
  siwfSource: "siwf" | "developer" | "development";
};

export type SessionTokenClaims = SessionTokenPayload & {
  version: string;
  iat: number;
  exp: number;
};

export type SessionUser = {
  address: string;
  fid: number;
  ensName: string | null;
  basename: string | null;
  fallbackName: string;
  primaryName: string;
  primarySource: SessionTokenPayload["primarySource"];
  isSmartContract: boolean;
  siwfSource: SessionTokenPayload["siwfSource"];
  issuedAt: number;
  expiresAt: number;
};

let cachedSecret: Uint8Array | null = null;
let cachedSecretSource: string | null = null;

function getSecretKey() {
  const configuredSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new SessionVerificationError("AUTH_SECRET must be configured in production environments");
    }

    return encodeSecret("bonded-development-secret");
  }

  if (!cachedSecret || cachedSecretSource !== configuredSecret) {
    cachedSecret = encodeSecret(configuredSecret);
    cachedSecretSource = configuredSecret;
  }

  return cachedSecret;
}

function encodeSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionTokenPayload) {
  const secretKey = getSecretKey();
  const signPayload: JWTPayload & SessionTokenPayload & { version: string } = {
    ...payload,
    version: SESSION_TOKEN_VERSION,
  };

  return new SignJWT(signPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_COOKIE_MAX_AGE}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionTokenClaims> {
  const secretKey = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.version !== SESSION_TOKEN_VERSION) {
      throw new SessionVerificationError("Session version mismatch");
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new SessionVerificationError("Session token is missing subject address");
    }

    const fid = Number(payload.fid ?? DEFAULT_DEV_FID);

    if (!Number.isFinite(fid)) {
      throw new SessionVerificationError("Session token contains invalid fid");
    }

    return {
      ...(payload as SessionTokenPayload),
      sub: payload.sub,
      fid,
      version: payload.version as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    if (error instanceof SessionVerificationError) {
      throw error;
    }

    throw new SessionVerificationError(
      error instanceof Error ? error.message : "Failed to verify session token",
    );
  }
}

export function createSessionUser(claims: SessionTokenClaims): SessionUser {
  return {
    address: claims.sub,
    fid: claims.fid,
    ensName: claims.ensName ?? null,
    basename: claims.basename ?? null,
    fallbackName: claims.fallbackName,
    primaryName: claims.primaryName,
    primarySource: claims.primarySource,
    isSmartContract: claims.isSmartContract,
    siwfSource: claims.siwfSource,
    issuedAt: claims.iat,
    expiresAt: claims.exp,
  };
}

export function isDevelopmentToken(token: string | undefined) {
  return token ? token.startsWith(DEV_TOKEN_PREFIX) : true;
}
