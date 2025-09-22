import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import { clearNonceCookie, clearSessionCookie, setSessionCookie } from "@/lib/auth/cookies";
import { NONCE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { SignatureVerificationError, MissingNonceError, InvalidAddressError } from "@/lib/auth/errors";
import { verifyWalletSignature } from "@/lib/auth/signature";
import { verifyFarcasterToken } from "@/lib/auth/siwf";
import { createSessionToken, createSessionUser, verifySessionToken } from "@/lib/auth/session";
import { resolveWalletIdentity } from "@/lib/auth/wallet";
import { getRequestHost, formatError } from "@/lib/auth/utils";
import { createAuthMessage } from "@/lib/auth/messages";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const claims = await verifySessionToken(sessionToken);
    const user = createSessionUser(claims);

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: formatError(error) }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      signature?: string;
      siwfToken?: string;
    };

    if (!body.address || !isAddress(body.address)) {
      throw new InvalidAddressError();
    }

    if (!body.signature) {
      throw new SignatureVerificationError("Signature is required to create a session");
    }

    const nonce = request.cookies.get(NONCE_COOKIE_NAME)?.value;

    if (!nonce) {
      throw new MissingNonceError();
    }

    const checksum = getAddress(body.address);
    const domain = getRequestHost(request);
    const message = createAuthMessage({ address: checksum, domain, nonce });

    await verifyWalletSignature({
      address: checksum,
      message,
      signature: body.signature,
    });

    const { fid, source } = await verifyFarcasterToken(body.siwfToken, domain);
    const identity = await resolveWalletIdentity(checksum);

    const sessionToken = await createSessionToken({
      sub: checksum,
      fid,
      ensName: identity.ensName,
      basename: identity.basename,
      fallbackName: identity.fallbackName,
      primaryName: identity.primaryName,
      primarySource: identity.primarySource,
      isSmartContract: identity.isSmartContract,
      siwfSource: source,
    });

    const response = NextResponse.json({ user: createSessionUser(await verifySessionToken(sessionToken)) });

    setSessionCookie(response, sessionToken);
    clearNonceCookie(response);

    return response;
  } catch (error) {
    const status =
      error instanceof MissingNonceError || error instanceof InvalidAddressError
        ? 400
        : error instanceof SignatureVerificationError
        ? 401
        : error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;

    return NextResponse.json({ error: formatError(error) }, { status });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
