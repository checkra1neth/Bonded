import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import { setNonceCookie } from "@/lib/auth/cookies";
import { createNonce } from "@/lib/auth/nonce";
import { createAuthMessage } from "@/lib/auth/messages";
import { getRequestHost } from "@/lib/auth/utils";
import { InvalidAddressError } from "@/lib/auth/errors";
import { formatError } from "@/lib/auth/utils";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string };
    const address = body.address;

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

    return response;
  } catch (error) {
    const status = error instanceof InvalidAddressError ? error.statusCode : 500;
    return NextResponse.json(
      { error: formatError(error) },
      { status },
    );
  }
}
