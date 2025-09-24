import { describe, expect, it, vi } from "vitest";

import { withRetry } from "../retry";

describe("withRetry", () => {
  it("resolves immediately when the operation succeeds", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(withRetry(operation)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries when the operation fails", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockResolvedValueOnce("second");

    const promise = withRetry(operation, {
      retries: 2,
      minTimeout: 50,
      maxTimeout: 50,
      jitter: false,
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("second");

    expect(operation).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("throws when retries are exhausted", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("always"));

    await expect(
      withRetry(operation, {
        retries: 1,
        minTimeout: 0,
        maxTimeout: 0,
        jitter: false,
      }),
    ).rejects.toThrow("always");

    expect(operation).toHaveBeenCalledTimes(2);
  });
});
