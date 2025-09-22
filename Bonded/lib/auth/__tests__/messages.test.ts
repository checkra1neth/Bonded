import { describe, expect, it } from "vitest";

import { createAuthMessage } from "../messages";

describe("createAuthMessage", () => {
  it("embeds the address, domain, and nonce", () => {
    const message = createAuthMessage({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      domain: "bonded.local",
      nonce: "abc123",
    });

    expect(message).toContain("0x1234567890abcdef1234567890abcdef12345678");
    expect(message).toContain("bonded.local");
    expect(message).toContain("abc123");
  });
});
