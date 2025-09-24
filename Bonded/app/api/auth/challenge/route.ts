import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import { setNonceCookie } from "../../../lib/auth/cookies";
import { createNonce } from "../../../lib/auth/nonce";
import { createAuthMessage } from "../../../lib/auth/messages";
import { getRequestHost, formatError } from "../../../lib/auth/utils";
import { InvalidAddressError } from "../../../lib/auth/errors";
import { logger } from "../../../lib/observability/logger";
import { telemetry } from "../../../lib/observability/telemetry";

export async function POST(request: NextRequest) {
  let parsedBody: { address?: string } | undefined;
  try {
    parsedBody = (await request.json()) as { address?: string };
    const address = parsedBody.address;

    if (!address || !isAddress(address)) {
      throw new InvalidAddressError();
    }

    const checksum = getAddress(address);
    const nonce = createNonce();
    const domain = getRequestHost(request);
    const message = createAuthMessage({ address: checksum, domain, nonce });

    const response = NextResponse.json({
      nonce,
      message,
    });

    setNonceCookie(response, nonce);

    logger.info("Issued authentication challenge", {
      address: checksum,
      domain,
    });
    telemetry.trackEvent({
      name: "auth.challengeIssued",
      properties: { domain },
    });

    return response;
  } catch (error) {
    const status = error instanceof InvalidAddressError ? error.statusCode : 500;
    if (status === 400) {
      logger.warn("Invalid address provided for challenge", {
        address: parsedBody?.address,
      });
    } else {
      logger.error("Failed to issue authentication challenge", { error });
      telemetry.trackError({
        name: "auth.challengeFailed",
        message: formatError(error),
        severity: "error",
        context: { path: request.nextUrl.pathname },
      });
    }
    return NextResponse.json(
      { error: formatError(error) },
      { status },
    );
  }
}
