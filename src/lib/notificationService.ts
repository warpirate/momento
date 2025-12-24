import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification channel IDs
export const CHANNEL_IDS = {
  REMINDERS: 'momento-reminders',
  STREAKS: 'momento-streaks',
  ACHIEVEMENTS: 'momento-achievements',
};

// Notification types
export type NotificationType = 
  | 'daily_reminder'
  | 'streak_at_risk'
  | 'streak_milestone'
  | 'weekly_summary'
  | 'achievement';

// Notification data structure
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

// User notification preferences
export interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:mm format
  streakAlerts: boolean;
  achievementAlerts: boolean;
  weeklySummary: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyReminder: true,
  reminderTime: '21:00',
  streakAlerts: true,
  achievementAlerts: true,
  weeklySummary: true,
};

const PREFERENCES_KEY = 'momento:notification_preferences';
const NOTIFICATIONS_KEY = 'momento:notifications';

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Create notification channels for Android
    this.createChannels();

    // Configure push notifications
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push notification token:', token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);
        
        // Required for iOS
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      onAction: (notification) => {
        console.log('Notification action:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Push notification registration error:', err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.initialized = true;
  }

  private createChannels() {
    if (Platform.OS !== 'android') return;

    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.REMINDERS,
        channelName: 'Daily Reminders',
        channelDescription: 'Gentle reminders to journal',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Reminders channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.STREAKS,
        channelName: 'Streak Alerts',
        channelDescription: 'Notifications about your journaling streak',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Streaks channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: CHANNEL_IDS.ACHIEVEMENTS,
        channelName: 'Achievements',
        channelDescription: 'Badge unlocks and milestones',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Achievements channel created: ${created}`)
    );
  }

  // Schedule daily reminder
  async scheduleDailyReminder(time: string) {
    const prefs = await this.getPreferences();
    if (!prefs.enabled || !prefs.dailyReminder) return;

    // Cancel existing daily reminder
    // New API uses singular method name; keep id string stable for lookup
    PushNotification.cancelLocalNotification('daily_reminder');

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const messages = [
      'Ready for today\'s reflection?',
      'Take a moment to capture your thoughts.',
      'Your journal is waiting for you.',
      'How was your day? Let\'s write about it.',
      'A few minutes of reflection can make a difference.',
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    PushNotification.localNotificationSchedule({
      id: 'daily_reminder',
      channelId: CHANNEL_IDS.REMINDERS,
      title: 'Time to Journal',
      message: randomMessage,
      date: scheduledTime,
      repeatType: 'day',
      allowWhileIdle: true,
      importance: 'high',
      priority: 'high',
      userInfo: { type: 'daily_reminder' },
    });
  }

  // Send immediate local notification
  sendLocalNotification(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    let channelId = CHANNEL_IDS.REMINDERS;
    
    if (type.includes('streak')) {
      channelId = CHANNEL_IDS.STREAKS;
    } else if (type === 'weekly_summary') {
      channelId = CHANNEL_IDS.REMINDERS;
    } else if (type === 'achievement') {
      channelId = CHANNEL_IDS.ACHIEVEMENTS;
    }

    PushNotification.localNotification({
      channelId,
      title,
      message,
      userInfo: { type, ...data },
      importance: 'high',
      priority: 'high',
    });
  }

  // Cancel all scheduled notifications
  cancelAllScheduled() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Preferences management
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  async savePreferences(prefs: NotificationPreferences) {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      
      // Reschedule daily reminder if time changed
      if (prefs.enabled && prefs.dailyReminder) {
        await this.scheduleDailyReminder(prefs.reminderTime);
      } else {
        PushNotification.cancelLocalNotification('daily_reminder');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  // In-app notifications storage
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        return notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    return [];
  }

  async saveNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    try {
      const notifications = await this.getNotifications();
      const newNotification: AppNotification = {
        ...notification,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
      };
      
      // Keep only last 50 notifications
      const updated = [newNotification, ...notifications].slice(0, 50);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      
      return newNotification;
    } catch (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async clearNotifications() {
    try {
      await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  // Request permissions (iOS)
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
      return (result.alert || result.badge || result.sound) ?? false;
    }
    return true;
  }
}

export const notificationService = new NotificationService();
