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
  try {
    expected = new URL(configuredUrl).origin;
  } catch {
    throw new Error("APP_URL_INVALID");
  }

  if (new URL(origin).origin !== expected) {
    throw new Error("CROSS_ORIGIN_REQUEST");
  }
}
