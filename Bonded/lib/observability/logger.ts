"use server";

import { isProductionEnv, getServerEnv } from "../config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
};

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_REMOTE_ENDPOINT = "https://in.logtail.com";

function getRemoteEndpoint() {
  const env = getServerEnv();
  return env.MONITORING_LOGTAIL_ENDPOINT?.trim() || DEFAULT_REMOTE_ENDPOINT;
}

function getRemoteToken() {
  const env = getServerEnv();
  return env.MONITORING_LOGTAIL_SOURCE_TOKEN?.trim();
}

function shouldSendRemote() {
  return Boolean(getRemoteToken() && typeof fetch === "function");
}

class Logger {
  constructor(private readonly minimumLevel: LogLevel) {}

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.writeToConsole(payload);

    if (shouldSendRemote()) {
      void this.writeToRemote(payload);
    }
  }

  private shouldLog(level: LogLevel) {
    return levelWeights[level] >= levelWeights[this.minimumLevel];
  }

  private writeToConsole(payload: LogPayload) {
    const entry = {
      level: payload.level,
      message: payload.message,
      timestamp: payload.timestamp,
      ...payload.context,
    };

    switch (payload.level) {
      case "error":
        console.error(entry);
        break;
      case "warn":
        console.warn(entry);
        break;
      case "info":
        console.info(entry);
        break;
      default:
        console.debug(entry);
    }
  }

  private async writeToRemote(payload: LogPayload) {
    try {
      await fetch(getRemoteEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getRemoteToken()}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("Failed to forward log payload", error);
      }
    }
  }
}

function resolveMinimumLevel(): LogLevel {
  const env = getServerEnv();

  if (env.NODE_ENV === "test") {
    return "error";
  }

  if (isProductionEnv()) {
    return "info";
  }

  return "debug";
}

export const logger = new Logger(resolveMinimumLevel());
