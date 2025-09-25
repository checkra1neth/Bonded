import { getAddress, isAddress, verifyMessage } from "viem";
import type { Hex } from "viem";
import { InvalidAddressError, SignatureVerificationError } from "./errors";

export type SignatureVerificationInput = {
  address: string;
  message: string;
  signature: string;
};

export async function verifyWalletSignature({ address, message, signature }: SignatureVerificationInput) {
  if (!isAddress(address)) {
    throw new InvalidAddressError();
  }

  const checksumAddress = getAddress(address);

  try {
    const verified = await verifyMessage({
      address: checksumAddress,
      message,
      signature: signature as Hex,
    });

    if (!verified) {
      throw new SignatureVerificationError();
    }
  } catch (error) {
    if (error instanceof InvalidAddressError || error instanceof SignatureVerificationError) {
      throw error;
    }

    throw new SignatureVerificationError(
      error instanceof Error ? error.message : "Unknown signature verification failure",
    );
  }
}
