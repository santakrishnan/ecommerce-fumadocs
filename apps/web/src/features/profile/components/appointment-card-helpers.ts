/**
 * Formats an ISO datetime as a human-readable scheduled date.
 * Shows "Tomorrow, ..." prefix when the date is tomorrow relative to now.
 */
export function formatScheduledDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const dateStr = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    .toLowerCase();

  return isTomorrow ? `Tomorrow, ${dateStr} at ${timeStr}` : `${dateStr} at ${timeStr}`;
}

/**
 * Formats an ISO datetime as a relative expiry countdown.
 * Returns "Expires in Xd, Xh" or "Expired" if past.
 */
export function formatExpiresIn(iso: string): string {
  const now = new Date();
  const expiry = new Date(iso);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `Expires in ${days}d, ${hours}h`;
  }
  return `Expires in ${hours}h`;
}
