export type RateLimitPolicy = {
  limit: number;
  windowSeconds: number;
  retryAfterSeconds: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

export function normalizeRateLimitPolicy(input: Partial<RateLimitPolicy> = {}): RateLimitPolicy {
  const limit = Number.isFinite(input.limit) ? Math.floor(input.limit as number) : 60;
  const windowSeconds = Number.isFinite(input.windowSeconds)
    ? Math.floor(input.windowSeconds as number)
    : 60;

  return {
    limit: Math.min(10_000, Math.max(1, limit)),
    windowSeconds: Math.min(86_400, Math.max(1, windowSeconds)),
    retryAfterSeconds: Math.min(86_400, Math.max(1, Math.floor(input.retryAfterSeconds ?? windowSeconds))),
  };
}

export function decideRateLimit(used: number, policyInput?: Partial<RateLimitPolicy>): RateLimitDecision {
  const policy = normalizeRateLimitPolicy(policyInput);
  const normalizedUsed = Number.isFinite(used) ? Math.max(0, Math.floor(used)) : 0;
  const remaining = Math.max(0, policy.limit - normalizedUsed);

  if (normalizedUsed >= policy.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: policy.retryAfterSeconds };
  }

  return { allowed: true, remaining };
}

export function rateLimitHeaders(decision: RateLimitDecision, policyInput?: Partial<RateLimitPolicy>) {
  const policy = normalizeRateLimitPolicy(policyInput);
  const headers = new Headers({
    "x-ratelimit-limit": String(policy.limit),
    "x-ratelimit-remaining": String(decision.remaining),
    "x-ratelimit-reset-after": String(policy.windowSeconds),
  });

  if (!decision.allowed) headers.set("retry-after", String(decision.retryAfterSeconds ?? policy.retryAfterSeconds));
  return headers;
}
