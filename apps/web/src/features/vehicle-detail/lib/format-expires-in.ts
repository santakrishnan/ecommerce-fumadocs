/**
 * Format an ISO expiry timestamp into a human-readable "Expires in Xd, Yh" string.
 *
 * Returns "Offer expired" if the date is in the past or invalid.
 */
export function formatExpiresIn(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) {
    return "Offer expired";
  }
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `Expires in ${days}d, ${hours}h`;
}
