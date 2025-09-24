import type { NextRequest } from "next/server";
import { resolveAppUrl } from "../config/env";
import { logger } from "../observability/logger";

export function getRequestHost(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      return url.host;
    } catch (error) {
      logger.warn("Invalid origin header", { origin, error });
    }
  }

  const host = request.headers.get("host");
  if (host) {
    return host;
  }

  const url = new URL(resolveAppUrl());
  return url.host;
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
