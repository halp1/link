export function formatExpiry(expiresAt: number | null): string {
  if (expiresAt === null) return "never";
  const diff = expiresAt - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export function truncateUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export function expiryFromHours(hours: number | null): number | null {
  if (hours === null || hours <= 0) return null;
  return Math.floor(Date.now() / 1000) + hours * 3600;
}
