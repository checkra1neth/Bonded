import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import * as cookies from "@/lib/auth/cookies";
import * as nonce from "@/lib/auth/nonce";
import * as utils from "@/lib/auth/utils";

import { POST } from "../challenge/route";

const setNonceCookieSpy = vi.spyOn(cookies, "setNonceCookie");
const createNonceSpy = vi.spyOn(nonce, "createNonce");
const getRequestHostSpy = vi.spyOn(utils, "getRequestHost");

describe("auth challenge route", () => {
  beforeEach(() => {
    setNonceCookieSpy.mockClear();
    createNonceSpy.mockReturnValue("nonce-test-value");
    getRequestHostSpy.mockImplementation(() => "bonded.xyz");
  });

  it("issues a nonce and challenge message for a valid wallet", async () => {
    const request = {
      json: async () => ({ address: "0x5A384227B65FA093DEC03Ec34E111Db80A040615" }),
      headers: new Headers({ host: "bonded.xyz" }),
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as { nonce: string; message: string };

    expect(response.status).toBe(200);
    expect(payload.nonce).toBe("nonce-test-value");
    expect(payload.message).toContain("bonded.xyz");
    expect(payload.message).toContain("0x5A384227B65FA093DEC03Ec34E111Db80A040615");

    expect(setNonceCookieSpy).toHaveBeenCalledTimes(1);
    const [cookieResponse, cookieNonce] = setNonceCookieSpy.mock.calls[0]!;
    expect(cookieNonce).toBe("nonce-test-value");
    expect(cookieResponse).toBe(response);
  });

  it("rejects malformed wallet addresses", async () => {
    const request = {
      json: async () => ({ address: "not-a-wallet" }),
      headers: new Headers(),
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/invalid wallet address/i);
    expect(setNonceCookieSpy).not.toHaveBeenCalled();
  });
});
