import Entry from '../db/model/Entry';
import EntrySignalModel from '../db/model/EntrySignal';
import { calculateStreak } from './streaks';
import { getUnlockedBadges } from './gamification';

export interface NotificationTriggerResult {
  shouldNotify: boolean;
  type?: 'streak_milestone' | 'streak_at_risk' | 'achievement' | 'insight' | 'weekly_summary';
  title?: string;
  message?: string;
  data?: Record<string, any>;
}

// Check if user should get a streak notification
export function checkStreakNotifications(
  entries: Entry[],
  previousStreak: number
): NotificationTriggerResult[] {
  const results: NotificationTriggerResult[] = [];
  const dates = entries.map(e => e.createdAt);
  const currentStreak = calculateStreak(dates);

  // Streak milestones to celebrate
  const milestones = [3, 7, 14, 21, 30, 60, 90, 100];

  // Check if we hit a new milestone
  for (const milestone of milestones) {
    if (currentStreak >= milestone && previousStreak < milestone) {
      results.push({
        shouldNotify: true,
        type: 'streak_milestone',
        title: `${milestone}-Day Streak! 🔥`,
        message: `Amazing! You've journaled for ${milestone} days in a row. Keep the momentum going!`,
        data: { streak: currentStreak, milestone },
      });
      break;
    }
  }

  return results;
}

// Check if user's streak is at risk
export function checkStreakAtRisk(entries: Entry[]): NotificationTriggerResult | null {
  if (entries.length === 0) return null;

  const dates = entries.map(e => e.createdAt);
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const latestDate = sortedDates[0];
  const today = new Date();

  const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    const currentStreak = calculateStreak(dates);
    if (currentStreak >= 3) {
      return {
        shouldNotify: true,
        type: 'streak_at_risk',
        title: 'Your Streak Needs You!',
        message: `You're on a ${currentStreak}-day streak. Don't break it now—journal today!`,
        data: { streak: currentStreak },
      };
    }
  }

  return null;
}

// Check for achievement/badge unlocks
export function checkAchievementNotifications(
  totalEntries: number,
  currentStreak: number,
  totalWords: number,
  previousTotalEntries: number,
  previousStreak: number,
  previousTotalWords: number
): NotificationTriggerResult[] {
  const results: NotificationTriggerResult[] = [];

  const currentStats = { totalEntries, currentStreak, totalWords };
  const previousStats = { 
    totalEntries: previousTotalEntries, 
    currentStreak: previousStreak, 
    totalWords: previousTotalWords 
  };

  const currentBadges = getUnlockedBadges(currentStats);
  const previousBadges = getUnlockedBadges(previousStats);

  const newBadges = currentBadges.filter(
    badge => !previousBadges.some(prev => prev.id === badge.id)
  );

  for (const badge of newBadges) {
    results.push({
      shouldNotify: true,
      type: 'achievement',
      title: `Badge Unlocked: ${badge.name}!`,
      message: badge.description,
      data: { badgeId: badge.id, badgeName: badge.name },
    });
  }

  return results;
}

// Calculate total words from entries
export function getTotalWords(entries: Entry[]): number {
  return entries.reduce((total, entry) => {
    const words = entry.content.trim().split(/\s+/).filter(w => w.length > 0);
    return total + words.length;
  }, 0);
}

// Check for pattern insights
export function checkInsightNotifications(
  entries: Entry[],
  signals: EntrySignalModel[]
): NotificationTriggerResult[] {
  const results: NotificationTriggerResult[] = [];

  if (entries.length < 7) return results;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentEntries = entries.filter(e => e.createdAt >= sevenDaysAgo);
  if (recentEntries.length < 5) return results;

  const recentSignals = signals.filter(s => s.createdAt >= sevenDaysAgo);

  // Check for mood patterns
  const moods = recentSignals
    .map(s => s.mood)
    .filter(m => m && m.length > 0);

  if (moods.length >= 5) {
    const moodCounts: Record<string, number> = {};
    moods.forEach(mood => {
      if (mood) {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
    });

    const dominantMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (dominantMood && dominantMood[1] >= 4) {
      const [mood, count] = dominantMood;
      
      if (mood.toLowerCase().includes('stress') || mood.toLowerCase().includes('anxious')) {
        results.push({
          shouldNotify: true,
          type: 'insight',
          title: 'Pattern Noticed',
          message: `You've mentioned feeling ${mood} often this week. Consider a moment for self-care.`,
          data: { pattern: 'mood', mood, count },
        });
      } else if (mood.toLowerCase().includes('happy') || mood.toLowerCase().includes('grateful')) {
        results.push({
          shouldNotify: true,
          type: 'insight',
          title: 'Positive Pattern! ✨',
          message: `You've been feeling ${mood} a lot lately. That's wonderful to see!`,
          data: { pattern: 'mood', mood, count },
        });
      }
    }
  }

  // Check for frequent activities
  const allActivities: string[] = [];
  recentSignals.forEach(s => {
    if (s.activities && Array.isArray(s.activities)) {
      allActivities.push(...s.activities);
    }
  });

  if (allActivities.length >= 5) {
    const activityCounts: Record<string, number> = {};
    allActivities.forEach(activity => {
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    const topActivity = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (topActivity && topActivity[1] >= 4) {
      const [activity, count] = topActivity;
      results.push({
        shouldNotify: true,
        type: 'insight',
        title: 'Reflection Insight',
        message: `You've written about "${activity}" ${count} times this week. Want to explore that further?`,
        data: { pattern: 'activity', activity, count },
      });
    }
  }

  return results;
}

// Check if it's time for weekly summary
export function shouldSendWeeklySummary(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  return dayOfWeek === 0 && hour >= 18 && hour < 21;
}

// Generate weekly summary notification
export function generateWeeklySummary(
  entries: Entry[],
  currentStreak: number
): NotificationTriggerResult | null {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weekEntries = entries.filter(e => e.createdAt >= sevenDaysAgo);
  
  if (weekEntries.length === 0) return null;

  const totalWords = getTotalWords(weekEntries);

  return {
    shouldNotify: true,
    type: 'weekly_summary',
    title: 'Your Week in Review',
    message: `This week: ${weekEntries.length} entries, ${totalWords} words written. Current streak: ${currentStreak} days.`,
    data: { 
      entriesCount: weekEntries.length, 
      totalWords, 
      streak: currentStreak 
    },
  };
}
