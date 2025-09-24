import { beforeEach, describe, expect, it } from "vitest";

import { encryptChatMessage, decryptChatMessage } from "../encryption";
import { resetKeyVaultForTesting } from "../../security/keyVault";

const CONVERSATION_ID = "conversation-security";

beforeEach(() => {
  resetKeyVaultForTesting();
});

describe("chat encryption security", () => {
  it("rejects tampered ciphertext payloads", async () => {
    const { payload } = await encryptChatMessage(CONVERSATION_ID, "Confidential alpha drop", {
      associatedData: { senderId: "user-1" },
    });

    const tampered = { ...payload, ciphertext: payload.ciphertext.slice(0, -2) + "AA" };

    await expect(
      decryptChatMessage(tampered, CONVERSATION_ID, {
        associatedData: { senderId: "user-1" },
      }),
    ).rejects.toThrow();
  });

  it("fails when associated data does not match", async () => {
    const { payload } = await encryptChatMessage(CONVERSATION_ID, "Key rotation next week", {
      associatedData: { senderId: "user-1", conversationId: CONVERSATION_ID },
    });

    await expect(
      decryptChatMessage(payload, CONVERSATION_ID, {
        associatedData: { senderId: "user-2", conversationId: CONVERSATION_ID },
      }),
    ).rejects.toThrow();
  });
});
