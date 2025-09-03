// Formats a rough relative time like "3 days ago" or "2 months ago"
export function timeAgo(input) {
  if (!input) return "";
  let date = null;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'number') {
    // If it's likely epoch seconds, convert to ms
    const ms = Math.abs(input) < 1e12 ? input * 1000 : input;
    date = new Date(ms);
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    // Numeric string? parse as number (seconds or ms)
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
      date = new Date(ms);
    } else {
      date = new Date(trimmed);
    }
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const now = Date.now();
  const diffMs = now - date.getTime(); // positive => past, negative => future

  // Handle near-future or just-now cases to avoid "0 seconds ago"
  if (diffMs < 0) {
    const aheadSec = Math.floor((-diffMs) / 1000);
    if (aheadSec <= 10) return "just now";
    const aheadMin = Math.floor(aheadSec / 60);
    const aheadHr = Math.floor(aheadMin / 60);
    const aheadDay = Math.floor(aheadHr / 24);
    const aheadMon = Math.floor(aheadDay / 30);
    const aheadYr = Math.floor(aheadDay / 365);
    if (aheadYr > 0) return `in ${aheadYr} year${aheadYr === 1 ? '' : 's'}`;
    if (aheadMon > 0) return `in ${aheadMon} month${aheadMon === 1 ? '' : 's'}`;
    if (aheadDay > 0) return `in ${aheadDay} day${aheadDay === 1 ? '' : 's'}`;
    if (aheadHr > 0) return `in ${aheadHr} hour${aheadHr === 1 ? '' : 's'}`;
    if (aheadMin > 0) return `in ${aheadMin} minute${aheadMin === 1 ? '' : 's'}`;
    return `in ${aheadSec} second${aheadSec === 1 ? '' : 's'}`;
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds <= 5) return "just now";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years === 1 ? '' : 's'} ago`;
  if (months > 0) return `${months} month${months === 1 ? '' : 's'} ago`;
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
}

export default timeAgo;
