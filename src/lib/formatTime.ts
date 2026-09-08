/**
 * Utility functions for 12-Hour Time Format conversions and display formatting.
 * Keeps internal 24-hour calculations intact while delivering human-friendly UI labels (e.g. '9:00 AM', '1:20 PM').
 */

/**
 * Converts a 24-hour time string ("09:00", "13:20", "16:00") into 12-hour format ("9:00 AM", "1:20 PM", "4:00 PM").
 */
export function formatTo12Hour(time24: string): string {
  if (!time24 || typeof time24 !== 'string') return '';
  const trimmed = time24.trim();

  // If already contains AM/PM, return as is
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return trimmed;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Formats a time range string ("13:20 – 15:00" or ("13:20", "15:00")) into 12-hour format ("1:20 PM – 3:00 PM").
 */
export function formatRangeTo12Hour(startOrRange: string, end?: string): string {
  if (!startOrRange) return '';

  if (end) {
    const formattedStart = formatTo12Hour(startOrRange);
    const formattedEnd = formatTo12Hour(end);
    return `${formattedStart} – ${formattedEnd}`;
  }

  // Split by en-dash, em-dash, or hyphen
  const parts = startOrRange.split(/\s*[\u2013\u2014-]\s*/);
  if (parts.length === 2) {
    const formattedStart = formatTo12Hour(parts[0]);
    const formattedEnd = formatTo12Hour(parts[1]);
    return `${formattedStart} – ${formattedEnd}`;
  }

  return formatTo12Hour(startOrRange);
}
