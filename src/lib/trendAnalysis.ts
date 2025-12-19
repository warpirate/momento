import Entry from '../db/model/Entry';

export type TrendAlertType = 'mood_decline' | 'positive_streak' | 'absence' | 'pattern';
export type TrendAlertSeverity = 'info' | 'warning' | 'celebration';

export interface TrendAlert {
  type: TrendAlertType;
  title: string;
  message: string;
  severity: TrendAlertSeverity;
  icon: string;
}

export interface EntrySignal {
  id: string;
  entryId: string;
  mood?: string;
  sentimentScore?: number;
  activities?: string[];
  people?: string[];
}

const NEGATIVE_MOODS = ['sad', 'anxious', 'stressed', 'angry', 'frustrated', 'depressed', 'worried', 'exhausted'];
const POSITIVE_MOODS = ['happy', 'joyful', 'content', 'excited', 'grateful', 'peaceful', 'calm', 'energized'];

/**
 * Analyze recent entries and signals to detect patterns and generate alerts
 */
export function analyzeTrends(
  entries: Entry[],
  signals: EntrySignal[]
): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  
  if (entries.length === 0) return alerts;
  
  // Filter out entries with invalid dates and sort by date (newest first)
  const validEntries = entries.filter(entry => {
    const date = entry.createdAt;
    if (!date || isNaN(date.getTime())) return false;
    if (date.getTime() === 0) return false; // Epoch 0 (Jan 1, 1970)
    if (date.getFullYear() < 2000) return false; // Unreasonably old dates
    return true;
  });
  const sortedEntries = validEntries.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  // Create a map of entry ID to signal
  const signalMap = new Map<string, EntrySignal>();
  signals.forEach(s => signalMap.set(s.entryId, s));
  
  // Check for absence (haven't journaled in X days)
  const lastEntryDate = sortedEntries[0]?.createdAt;
  if (lastEntryDate) {
    // Validate date before calculating
    if (lastEntryDate && !isNaN(lastEntryDate.getTime()) && lastEntryDate.getTime() !== 0) {
      const daysSinceLastEntry = Math.floor(
        (Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Sanity check: if daysSinceLastEntry is unreasonably large, skip
      if (daysSinceLastEntry >= 0 && daysSinceLastEntry < 36500) {
        if (daysSinceLastEntry >= 3 && daysSinceLastEntry < 7) {
          alerts.push({
            type: 'absence',
            title: 'Missing you',
            message: `It's been ${daysSinceLastEntry} days since your last entry. How are you feeling?`,
            severity: 'info',
            icon: 'clock',
          });
        } else if (daysSinceLastEntry >= 7) {
          alerts.push({
            type: 'absence',
            title: 'Time to reconnect',
            message: `It's been over a week. Taking a moment to reflect can help.`,
            severity: 'warning',
            icon: 'alert-circle',
          });
        }
      }
    }
  }
  
  // Check for mood patterns in recent entries (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEntries = sortedEntries.filter(e => e.createdAt >= oneWeekAgo);
  
  if (recentEntries.length >= 3) {
    const recentSignals = recentEntries
      .map(e => signalMap.get(e.id))
      .filter((s): s is EntrySignal => s !== undefined);
    
    // Check for consecutive negative moods
    const recentMoods = recentSignals
      .map(s => s.mood?.toLowerCase())
      .filter((m): m is string => m !== undefined);
    
    const consecutiveNegative = recentMoods
      .slice(0, 5)
      .filter(m => NEGATIVE_MOODS.includes(m));
    
    if (consecutiveNegative.length >= 3) {
      alerts.push({
        type: 'mood_decline',
        title: 'Checking in',
        message: `Your recent entries suggest you've been going through a tough time. Remember: acknowledging feelings is the first step.`,
        severity: 'warning',
        icon: 'heart',
      });
    }
    
    // Check for positive streak
    const consecutivePositive = recentMoods
      .slice(0, 5)
      .filter(m => POSITIVE_MOODS.includes(m));
    
    if (consecutivePositive.length >= 3) {
      alerts.push({
        type: 'positive_streak',
        title: 'You\'re on a roll!',
        message: `Your recent entries show positive momentum. Keep doing what you're doing!`,
        severity: 'celebration',
        icon: 'sun',
      });
    }
    
    // Check for sentiment trend
    const recentSentiments = recentSignals
      .map(s => s.sentimentScore)
      .filter((s): s is number => s !== undefined);
    
    if (recentSentiments.length >= 3) {
      const avgSentiment = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;
      
      if (avgSentiment < -0.3) {
        // Only add if we haven't already added a mood decline alert
        if (!alerts.some(a => a.type === 'mood_decline')) {
          alerts.push({
            type: 'mood_decline',
            title: 'Noticing a pattern',
            message: `Your recent entries have a lower sentiment than usual. Would you like to explore what's going on?`,
            severity: 'info',
            icon: 'trending-down',
          });
        }
      }
    }
    
    // Check for common activities in positive/negative entries
    const activitiesWithMood = recentSignals
      .filter(s => s.activities && s.activities.length > 0 && s.mood)
      .map(s => ({
        activities: s.activities!,
        isPositive: POSITIVE_MOODS.includes(s.mood!.toLowerCase()),
      }));
    
    if (activitiesWithMood.length >= 3) {
      const positiveActivities = new Map<string, number>();
      
      activitiesWithMood
        .filter(a => a.isPositive)
        .forEach(a => {
          a.activities.forEach(act => {
            positiveActivities.set(act, (positiveActivities.get(act) || 0) + 1);
          });
        });
      
      // Find activities that appear in multiple positive entries
      const frequentPositive = Array.from(positiveActivities.entries())
        .filter(([_, count]) => count >= 2)
        .map(([activity]) => activity);
      
      if (frequentPositive.length > 0 && !alerts.some(a => a.type === 'pattern')) {
        alerts.push({
          type: 'pattern',
          title: 'Pattern discovered',
          message: `You tend to feel better when: ${frequentPositive.slice(0, 2).join(', ')}`,
          severity: 'info',
          icon: 'zap',
        });
      }
    }
  }
  
  // Return only the most relevant alerts (max 2)
  return alerts.slice(0, 2);
}

/**
 * Get a weekly summary of entries
 */
export function getWeeklySummary(entries: Entry[], signals: EntrySignal[]): {
  entryCount: number;
  avgSentiment: number | null;
  topMoods: string[];
  topActivities: string[];
} {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = entries.filter(e => e.createdAt >= oneWeekAgo);
  
  const signalMap = new Map<string, EntrySignal>();
  signals.forEach(s => signalMap.set(s.entryId, s));
  
  const weekSignals = weekEntries
    .map(e => signalMap.get(e.id))
    .filter((s): s is EntrySignal => s !== undefined);
  
  // Calculate average sentiment
  const sentiments = weekSignals
    .map(s => s.sentimentScore)
    .filter((s): s is number => s !== undefined);
  
  const avgSentiment = sentiments.length > 0
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
    : null;
  
  // Get top moods
  const moodCounts = new Map<string, number>();
  weekSignals.forEach(s => {
    if (s.mood) {
      moodCounts.set(s.mood, (moodCounts.get(s.mood) || 0) + 1);
    }
  });
  const topMoods = Array.from(moodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood);
  
  // Get top activities
  const activityCounts = new Map<string, number>();
  weekSignals.forEach(s => {
    s.activities?.forEach(act => {
      activityCounts.set(act, (activityCounts.get(act) || 0) + 1);
    });
  });
  const topActivities = Array.from(activityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([activity]) => activity);
  
  return {
    entryCount: weekEntries.length,
    avgSentiment,
    topMoods,
    topActivities,
  };
}
