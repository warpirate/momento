import { differenceInCalendarDays } from 'date-fns';

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Sort dates descending
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  
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