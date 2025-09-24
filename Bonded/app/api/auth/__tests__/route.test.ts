import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const verifyJwtMock = vi.fn();

class MockInvalidTokenError extends Error {}

vi.mock("@farcaster/quick-auth", () => ({
  Errors: { InvalidTokenError: MockInvalidTokenError },
  createClient: () => ({ verifyJwt: verifyJwtMock }),
}));

describe("farcaster auth route", () => {
  beforeEach(() => {
    verifyJwtMock.mockReset();
  });

  it("returns 401 when no authorization header is provided", async () => {
    const { GET } = await import("../route");
    const request = { headers: new Headers() } as unknown as NextRequest;

    const response = await GET(request);
    const payload = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(payload.message).toMatch(/missing token/i);
    expect(verifyJwtMock).not.toHaveBeenCalled();
  });

  it("verifies the token and returns the user fid", async () => {
    const { GET } = await import("../route");
    verifyJwtMock.mockResolvedValue({ sub: "987654321" });

    const request = {
      headers: new Headers({ Authorization: "Bearer test", host: "bonded.xyz" }),
    } as unknown as NextRequest;

    const response = await GET(request);
    const payload = (await response.json()) as { userFid: string };

    expect(response.status).toBe(200);
    expect(payload.userFid).toBe("987654321");
    expect(verifyJwtMock).toHaveBeenCalledWith({ token: "test", domain: "bonded.xyz" });
  });

  it("maps invalid token errors to 401 responses", async () => {
    const { GET } = await import("../route");
    const { Errors } = await import("@farcaster/quick-auth");
    verifyJwtMock.mockRejectedValue(new Errors.InvalidTokenError("bad"));

    const request = {
      headers: new Headers({ Authorization: "Bearer nope" }),
    } as unknown as NextRequest;

    const response = await GET(request);
    const payload = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(payload.message).toMatch(/invalid token/i);
  });
});
