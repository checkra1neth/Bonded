import { beforeEach, describe, expect, it } from "vitest";

import { createSessionToken, createSessionUser, verifySessionToken } from "../session";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret";
});

describe("session tokens", () => {
  it("creates and verifies a session token", async () => {
    const token = await createSessionToken({
      sub: "0x1234567890abcdef1234567890abcdef12345678",
      fid: 42,
      ensName: "vitalik.eth",
      basename: "astro-builder.base",
      fallbackName: "lunar-builder-alpha.base",
      primaryName: "vitalik.eth",
      primarySource: "ens",
      isSmartContract: false,
      siwfSource: "developer",
    });

    const claims = await verifySessionToken(token);
    expect(claims.sub).toBe("0x1234567890abcdef1234567890abcdef12345678");
    expect(claims.fid).toBe(42);
    expect(claims.primarySource).toBe("ens");

    const user = createSessionUser(claims);
    expect(user.primaryName).toBe("vitalik.eth");
    expect(user.ensName).toBe("vitalik.eth");
  });
});
