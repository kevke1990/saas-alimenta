import dns from "node:dns/promises";
import net from "node:net";

const blockedAddresses = new net.BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockedAddresses.addSubnet(network, prefix, "ipv4");

for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64],
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7],
  ["fe80::", 10], ["ff00::", 8],
] as const) blockedAddresses.addSubnet(network, prefix, "ipv6");

function mappedIpv4(ip: string) {
  if (!net.isIPv6(ip)) return null;
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)?.[1];
  if (dotted && net.isIPv4(dotted)) return dotted;

  const [left = "", right = ""] = ip.toLowerCase().split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const parts = ip.includes("::")
    ? [...leftParts, ...Array(8 - leftParts.length - rightParts.length).fill("0"), ...rightParts]
    : leftParts;
  if (parts.length !== 8 || parts.slice(0, 5).some((part) => Number.parseInt(part || "0", 16) !== 0) || Number.parseInt(parts[5] || "0", 16) !== 0xffff) return null;
  const high = Number.parseInt(parts[6] || "0", 16);
  const low = Number.parseInt(parts[7] || "0", 16);
  return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
}

export function isPrivateIp(ip: string) {
  const mapped = mappedIpv4(ip);
  if (mapped) return blockedAddresses.check(mapped, "ipv4");
  if (net.isIPv4(ip)) return blockedAddresses.check(ip, "ipv4");
  if (net.isIPv6(ip)) return blockedAddresses.check(ip, "ipv6");
  return true;
}

export async function assertSafeWebhookUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Invalid webhook URL"); }
  if (url.protocol !== "https:") throw new Error("Webhook URL must use HTTPS");
  if (url.username || url.password) throw new Error("Webhook URL must not contain credentials");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || net.isIP(host) && isPrivateIp(host)) {
    throw new Error("Webhook URL resolves to a private or local address");
  }
  const addresses = net.isIP(host)
    ? [{ address: host, family: net.isIP(host) }]
    : await dns.lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Webhook URL resolves to a private or local address");
  }
  const selected = addresses[0];
  return { url, hostname: host, address: selected.address, family: selected.family as 4 | 6 };
}
