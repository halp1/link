const PRIVATE_PREFIXES = [
  "10.",
  "127.",
  "169.254.",
  "192.168.",
  "::1",
  "fc",
  "fd",
  "fe80"
];

function isPrivateIp(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value.startsWith("::ffff:")) return isPrivateIp(value.slice(7));
  if (PRIVATE_PREFIXES.some((prefix) => value.startsWith(prefix))) return true;
  const firstOctet = Number(value.split(".")[0]);
  return firstOctet === 172 && Number(value.split(".")[1]) >= 16 && Number(value.split(".")[1]) <= 31;
}

function firstPublicIp(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const ip = part.trim();
    if (ip && !isPrivateIp(ip)) return ip;
  }
  return null;
}

/**
 * Cloudflare Tunnel + Coolify put the socket at an internal hop (e.g. 10.0.1.6).
 * Prefer CF / proxy headers, then fall back to the TCP peer.
 */
export function getClientIp(request: Request, fallback: () => string): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const trueClient = request.headers.get("true-client-ip")?.trim();
  if (trueClient) return trueClient;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && !isPrivateIp(realIp)) return realIp;

  const forwarded = firstPublicIp(request.headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  return fallback();
}
