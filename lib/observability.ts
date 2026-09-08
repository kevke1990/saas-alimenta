type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    service: "alimenta-pro",
    level,
    event,
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logInfo(event: string, fields?: LogFields) {
  write("info", event, fields);
}

export function logWarn(event: string, fields?: LogFields) {
  write("warn", event, fields);
}

export function logError(event: string, fields?: LogFields) {
  write("error", event, fields);
}

export function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Onbekende fout";
}
