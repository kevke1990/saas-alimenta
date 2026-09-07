import { performance } from "node:perf_hooks";

type Metric = { name: string; durationMs: number; ok: boolean; at: string };

const buffer: Metric[] = [];
const MAX_BUFFER = 500;

export function recordMetric(name: string, durationMs: number, ok = true) {
  buffer.push({ name, durationMs: Math.round(durationMs * 100) / 100, ok, at: new Date().toISOString() });
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
}

export async function measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    const result = await fn();
    recordMetric(name, performance.now() - started, true);
    return result;
  } catch (error) {
    recordMetric(name, performance.now() - started, false);
    throw error;
  }
}

export function getMetrics() {
  const snapshot = [...buffer];
  const durations = snapshot.map((m) => m.durationMs).sort((a, b) => a - b);
  const percentile = (p: number) => durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] : 0;
  return {
    samples: snapshot.length,
    errors: snapshot.filter((m) => !m.ok).length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    latest: snapshot.slice(-50),
  };
}
