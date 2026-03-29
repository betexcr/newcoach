/**
 * Format a Date as YYYY-MM-DD using local timezone (not UTC).
 * Supabase date columns store simple date strings without timezone,
 * so we must use local dates to avoid off-by-one errors near midnight.
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Safely format a date string from the database for display.
 * Returns a fallback ("—") for null, undefined, or unparseable values
 * instead of showing "Invalid Date".
 */
export function safeDateString(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = "—"
): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Like safeDateString but includes time components via toLocaleString.
 */
export function safeDateTimeString(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = "—"
): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleString(undefined, options);
}
