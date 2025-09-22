import { Errors, createClient } from "@farcaster/quick-auth";
import { DEFAULT_DEV_FID, DEV_TOKEN_PREFIX } from "./constants";
import { MissingFarcasterTokenError } from "./errors";

const quickAuthClient = createClient();

export type SiwfVerificationResult = {
  fid: number;
  source: "siwf" | "developer" | "development";
};

export async function verifyFarcasterToken(token: string | undefined, domain: string): Promise<SiwfVerificationResult> {
  if (token && !token.startsWith(DEV_TOKEN_PREFIX)) {
    try {
      const payload = await quickAuthClient.verifyJwt({ token, domain });
      return { fid: payload.sub, source: "siwf" };
    } catch (error) {
      if (error instanceof Errors.InvalidTokenError) {
        throw new MissingFarcasterTokenError("Provided Sign-In-With-Farcaster token is invalid");
      }

      throw new MissingFarcasterTokenError(
        error instanceof Error ? error.message : "Failed to verify Sign-In-With-Farcaster token",
      );
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new MissingFarcasterTokenError();
  }

  const fallbackValue = token?.slice(DEV_TOKEN_PREFIX.length);
  const devFid = fallbackValue ?? process.env.AUTH_DEV_FID ?? DEFAULT_DEV_FID.toString();
  const parsedFid = Number.parseInt(devFid, 10);

  if (!Number.isFinite(parsedFid)) {
    throw new MissingFarcasterTokenError("Developer token must encode a numeric Farcaster ID");
  }

  return {
    fid: parsedFid,
    source: token ? "developer" : "development",
  };
}
