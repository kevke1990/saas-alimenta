import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a,b,c] = ip.split(".").map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
  }
  return true;
}

export async function assertSafeWebhookUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Invalid webhook URL"); }
  if (url.protocol !== "https:") throw new Error("Webhook URL must use HTTPS");
  if (url.username || url.password) throw new Error("Webhook URL must not contain credentials");
  const host = url.hostname.toLowerCase().replace(/^[|]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || net.isIP(host) && isPrivateIp(host)) {
    throw new Error("Webhook URL resolves to a private or local address");
  }
  const addresses = await dns.lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Webhook URL resolves to a private or local address");
  }
  return url;
}
