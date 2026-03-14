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
