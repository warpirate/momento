/**
 * Utility functions for date validation and manipulation
 */

/**
 * Check if a date is valid (not null, not invalid, and not epoch 0)
 */
export function isValidDate(date: Date | null | undefined): boolean {
  if (!date) return false;
  if (isNaN(date.getTime())) return false;
  // Check if date is not epoch 0 (January 1, 1970)
  if (date.getTime() === 0) return false;
  // Check if date is not before a reasonable minimum (e.g., year 2000)
  // This catches dates that are clearly wrong
  if (date.getFullYear() < 2000) return false;
  return true;
}

/**
 * Get a safe date that filters out invalid dates
 */
export function getSafeDate(date: Date | null | undefined): Date | null {
  if (isValidDate(date)) {
    return date!;
  }
  return null;
}

/**
 * Calculate days between two dates, with validation
 */
export function daysBetween(date1: Date, date2: Date): number | null {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return null;
  }
  const diff = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

