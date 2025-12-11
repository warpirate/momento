import AsyncStorage from '@react-native-async-storage/async-storage';
import Entry from '../db/model/Entry';
import EntrySignalModel from '../db/model/EntrySignal';
import { notificationService } from './notificationService';
import { 
  checkStreakAtRisk, 
  shouldSendWeeklySummary, 
  generateWeeklySummary 
} from './notificationTriggers';

const LAST_NOTIFIED_KEY = 'momento:last_notified';
const LAST_STREAK_CHECK_KEY = 'momento:last_streak_check';

interface LastNotified {
  [type: string]: number; // timestamp
}

// Prevent duplicate notifications by checking last sent time
export async function shouldSendNotification(
  type: string,
  cooldownMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(LAST_NOTIFIED_KEY);
    const lastNotified: LastNotified = stored ? JSON.parse(stored) : {};
    
    const lastSent = lastNotified[type];
    if (!lastSent) return true;
    
    const now = Date.now();
    return (now - lastSent) > cooldownMs;
  } catch (error) {
    console.error('Error checking notification cooldown:', error);
    return true; // Allow on error
  }
}

// Mark notification type as sent
export async function markNotificationSent(type: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LAST_NOTIFIED_KEY);
    const lastNotified: LastNotified = stored ? JSON.parse(stored) : {};
    
    lastNotified[type] = Date.now();
    await AsyncStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(lastNotified));
  } catch (error) {
    console.error('Error marking notification as sent:', error);
  }
}

// Check streak at risk when app comes to foreground
export async function checkStreakAtRiskIfNeeded(
  entries: Entry[],
  createNotification: (type: string, title: string, message: string, data?: any, sendPush?: boolean) => Promise<void>
): Promise<void> {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_STREAK_CHECK_KEY);
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;
    
    // Only check if we haven't checked in the last hour
    if (now - lastCheckTime < ONE_HOUR) return;
    
    const streakRisk = checkStreakAtRisk(entries);
    if (streakRisk && streakRisk.shouldNotify) {
      const shouldSend = await shouldSendNotification('streak_at_risk', 12 * 60 * 60 * 1000); // 12 hour cooldown
      
      if (shouldSend && streakRisk.type && streakRisk.title && streakRisk.message) {
        await createNotification(
          streakRisk.type,
          streakRisk.title,
          streakRisk.message,
          streakRisk.data,
          true // Send push for streak at risk
        );
        await markNotificationSent('streak_at_risk');
      }
    }
    
    await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, now.toString());
  } catch (error) {
    console.error('Error checking streak at risk:', error);
  }
}

// Check for weekly summary
export async function checkWeeklySummaryIfNeeded(
  entries: Entry[],
  currentStreak: number,
  createNotification: (type: string, title: string, message: string, data?: any, sendPush?: boolean) => Promise<void>
): Promise<void> {
  if (!shouldSendWeeklySummary()) return;
  
  const shouldSend = await shouldSendNotification('weekly_summary', 7 * 24 * 60 * 60 * 1000); // 7 day cooldown
  
  if (!shouldSend) return;
  
  const summary = generateWeeklySummary(entries, currentStreak);
  if (summary && summary.shouldNotify && summary.type && summary.title && summary.message) {
    await createNotification(
      summary.type,
      summary.title,
      summary.message,
      summary.data,
      false // No push for weekly summary
    );
    await markNotificationSent('weekly_summary');
  }
}

// Clear all notification cooldowns (useful for testing)
export async function clearNotificationCooldowns(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_NOTIFIED_KEY);
    await AsyncStorage.removeItem(LAST_STREAK_CHECK_KEY);
  } catch (error) {
    console.error('Error clearing notification cooldowns:', error);
  }
}
