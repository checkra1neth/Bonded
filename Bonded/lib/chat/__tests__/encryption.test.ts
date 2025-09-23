import { beforeEach, describe, expect, it } from "vitest";

import { encryptChatMessage, decryptChatMessage, maskPreview, scrubMessageForTransmission } from "../encryption";
import { toDeliveredMessage } from "../autoresponder";
import type { ChatParticipant } from "../types";
import { resetKeyVaultForTesting } from "../../security/keyVault";

describe("chat message encryption", () => {
  const participant: ChatParticipant = {
    userId: "user-1",
    displayName: "Nova",
  };

  beforeEach(() => {
    resetKeyVaultForTesting();
  });

  it("encrypts, decrypts, and preserves previews", async () => {
    const plaintext = "gm base frens — ready for the challenge tonight?";
    const conversationId = "conversation-encrypted";

    const { payload, preview } = await encryptChatMessage(conversationId, plaintext, {
      associatedData: { senderId: participant.userId },
    });

    expect(preview).toBe(maskPreview(plaintext));
    expect(payload.ciphertext).not.toBe(plaintext);

    const decrypted = await decryptChatMessage(payload, conversationId, {
      associatedData: { senderId: participant.userId },
    });
    expect(decrypted).toBe(plaintext);

    const message = toDeliveredMessage(conversationId, participant, plaintext, Date.now(), {
      kind: "text",
      encryption: payload,
      preview,
    });

    const asSender = scrubMessageForTransmission(message, { includePlaintext: true });
    expect(asSender.body).toBe(plaintext);

    const asPeer = scrubMessageForTransmission(message, { includePlaintext: false });
    expect(asPeer.body).toBe(preview);
    expect(asPeer.encryption).toEqual(payload);
  });
});
