import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

import { verifyWalletSignature } from "../signature";
import { createAuthMessage } from "../messages";

const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);

describe("verifyWalletSignature", () => {
  it("verifies a signed message", async () => {
    const message = createAuthMessage({
      address: account.address,
      domain: "test.bonded",
      nonce: "nonce123",
    });

    const signature = await account.signMessage({ message });

    await expect(
      verifyWalletSignature({
        address: account.address,
        message,
        signature,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws for invalid signature", async () => {
    await expect(
      verifyWalletSignature({
        address: account.address,
        message: "hello",
        signature: "0xdeadbeef",
      }),
    ).rejects.toThrowError();
  });
});
