export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  jitter?: boolean;
  retryable?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  signal?: AbortSignal | null;
}

const DEFAULT_RETRIES = 2;
const DEFAULT_MIN_TIMEOUT = 300;
const DEFAULT_MAX_TIMEOUT = 2_000;
const DEFAULT_FACTOR = 2;

function createAbortError(): Error {
  const error = new Error("The retry operation was aborted");
  error.name = "AbortError";
  return error;
}

async function wait(delay: number, signal?: AbortSignal | null): Promise<void> {
  if (delay <= 0) {
    if (signal?.aborted) {
      throw createAbortError();
    }
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, delay);

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener("abort", onAbort);
    }
  });
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    minTimeout = DEFAULT_MIN_TIMEOUT,
    maxTimeout = DEFAULT_MAX_TIMEOUT,
    factor = DEFAULT_FACTOR,
    jitter = true,
    retryable,
    onRetry,
    signal,
  } = options;

  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    try {
      return await operation(attempt);
    } catch (error) {
      const shouldRetry =
        attempt < retries && (retryable ? retryable(error, attempt) : true);

      if (!shouldRetry) {
        throw error;
      }

      const exponential = minTimeout * Math.pow(factor, attempt);
      const boundedDelay = Math.min(maxTimeout, Math.max(minTimeout, exponential));
      const delay = jitter
        ? Math.round(boundedDelay * (0.5 + Math.random() * 0.5))
        : boundedDelay;

      onRetry?.(error, attempt + 1, delay);

      await wait(delay, signal);
      attempt += 1;
    }
  }
}
