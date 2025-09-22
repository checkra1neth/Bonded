import { getAddress } from "viem";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveWalletIdentity } from "../wallet";

beforeAll(() => {
  process.env.AUTH_DISABLE_NETWORK = "true";
});

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("resolveWalletIdentity", () => {
  it("returns fallback identity when network lookups are disabled", async () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    const identity = await resolveWalletIdentity(address);
    expect(identity.address).toBe(getAddress(address));
    expect(identity.primaryName.endsWith(".base")).toBe(true);
    expect(identity.primarySource).toBe("fallback");
  });
});
