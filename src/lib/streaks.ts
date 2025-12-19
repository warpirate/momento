import { differenceInCalendarDays } from 'date-fns';

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Filter out invalid dates
  const validDates = dates.filter(date => {
    if (!date || isNaN(date.getTime())) return false;
    if (date.getTime() === 0) return false; // Epoch 0 (Jan 1, 1970)
    if (date.getFullYear() < 2000) return false; // Unreasonably old dates
    return true;
  });

  if (validDates.length === 0) return 0;

  // Sort dates descending
  const sortedDates = [...validDates].sort((a, b) => b.getTime() - a.getTime());
  
  const today = new Date();
  const latestDate = sortedDates[0];
  
  // Check if the streak is active (latest entry is today or yesterday)
  const diffFromToday = differenceInCalendarDays(today, latestDate);
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = sortedDates[i];
    const next = sortedDates[i + 1];
    
    const diff = differenceInCalendarDays(current, next);
    
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
    // If diff is 0 (same day), continue without incrementing or breaking
  }

  return streak;
}

export function isStreakAtRisk(dates: Date[]): boolean {
  if (dates.length === 0) return false;
  
  // Filter out invalid dates
  const validDates = dates.filter(date => {
    if (!date || isNaN(date.getTime())) return false;
    if (date.getTime() === 0) return false; // Epoch 0 (Jan 1, 1970)
    if (date.getFullYear() < 2000) return false; // Unreasonably old dates
    return true;
  });

  if (validDates.length === 0) return false;
  
  // Sort dates descending
  const sortedDates = [...validDates].sort((a, b) => b.getTime() - a.getTime());
  const latestDate = sortedDates[0];
  const today = new Date();
  
  // Check if the latest entry was yesterday (diff = 1)
  // If diff is 0, they already journaled today, so not at risk.
  // If diff > 1, streak is already broken (0), so technically not "at risk" of breaking a generic active streak, but we handle 0 separately.
  const diffFromToday = differenceInCalendarDays(today, latestDate);
  
  return diffFromToday === 1;
}