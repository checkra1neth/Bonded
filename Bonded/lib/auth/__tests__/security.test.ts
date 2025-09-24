import { afterEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { getRequestHost } from "../utils";
import { createAuthMessage } from "../messages";

function createRequest(headers: HeadersInit): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

describe("authentication security", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
  });

  it("prefers a sanitized origin host when available", () => {
    const request = createRequest({ origin: "https://bonded.xyz/some/path" });
    expect(getRequestHost(request)).toBe("bonded.xyz");
  });

  it("falls back to the host header when origin parsing fails", () => {
    const request = createRequest({ origin: "not-a-valid-origin", host: "safe.bonded.xyz" });
    expect(getRequestHost(request)).toBe("safe.bonded.xyz");
  });

  it("uses configured defaults when no headers are provided", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_URL = "https://app.bonded.xyz";
    const request = createRequest({});
    expect(getRequestHost(request)).toBe("app.bonded.xyz");
  });

  it("produces a stable auth message without leaking formatting characters", () => {
    const message = createAuthMessage({
      address: "0x5A384227B65FA093DEC03Ec34E111Db80A040615",
      domain: "bonded.xyz",
      nonce: "nonce-123",
    });

    expect(message).toContain("Bonded requests wallet verification on bonded.xyz");
    expect(message).not.toMatch(/\r|\0/);
    expect(message.split("\n").length).toBeGreaterThan(1);
  });
});
