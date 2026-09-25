export function requireSameOrigin(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    throw new Error("CROSS_ORIGIN_REQUEST");
  }

  const origin = req.headers.get("origin");
  if (!origin) return;

  const configuredUrl = process.env.APP_URL?.trim();
  if (!configuredUrl) return;

  let expected: string;
  let requestOrigin: string;
  try {
    expected = new URL(configuredUrl).origin;
    requestOrigin = new URL(req.url).origin;
  } catch {
    throw new Error("APP_URL_INVALID");
  }

  // APP_URL can intentionally point at a loopback/reverse-proxy address while
  // the browser reaches the same application through another valid host.
  // Still require the browser Origin to match either the configured origin or
  // the origin of the actual HTTP request; arbitrary cross-origin writes remain blocked.
  const actual = new URL(origin).origin;
  if (actual !== expected && actual !== requestOrigin) {
    throw new Error("CROSS_ORIGIN_REQUEST");
  }
}