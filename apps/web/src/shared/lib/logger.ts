import "server-only";

/**
 * Lightweight structured logger for server-side code.
 *
 * Outputs JSON lines in production for log aggregators (CloudWatch, Datadog, etc.)
 * and human-readable formatted output in development.
 *
 * Usage:
 *   const log = createLogger("profile-resolve");
 *   log.info("visitor resolved", { visitorId, isNew: true });
 *   log.warn("geo lookup failed", { requestId, reason: "timeout" });
 *   log.error("visitor service error", { status: 502, message: "..." });
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  level: LogLevel;
  message: string;
  scope: string;
  timestamp: string;
  [key: string]: unknown;
}

function write(entry: LogEntry): void {
  const { level, ...rest } = entry;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // JSON lines for log aggregators
    const output = JSON.stringify(rest);
    switch (level) {
      case "error":
      case "fatal":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  } else {
    // Human-readable in dev
    const prefix = `[${entry.scope}]`;
    const data = Object.fromEntries(
      Object.entries(rest).filter(([k]) => !["scope", "message", "timestamp"].includes(k))
    );
    const suffix = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : "";
    switch (level) {
      case "error":
      case "fatal":
        console.error(`${prefix} ${entry.message}${suffix}`);
        break;
      case "warn":
        console.warn(`${prefix} ${entry.message}${suffix}`);
        break;
      default:
        console.log(`${prefix} ${entry.message}${suffix}`);
    }
  }
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  fatal(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
}

export function createLogger(scope: string): Logger {
  function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    write({
      level,
      scope,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  return {
    debug: (message, data) => log("debug", message, data),
    error: (message, data) => log("error", message, data),
    fatal: (message, data) => log("fatal", message, data),
    info: (message, data) => log("info", message, data),
    warn: (message, data) => log("warn", message, data),
  };
}
