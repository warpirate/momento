import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  notificationService, 
  AppNotification, 
  NotificationPreferences, 
  NotificationType 
} from '../lib/notificationService';
import { 
  shouldSendNotification, 
  markNotificationSent,
  checkStreakAtRiskIfNeeded,
  checkWeeklySummaryIfNeeded
} from '../lib/notificationLifecycle';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  loading: boolean;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  
  // Create notifications
  createNotification: (
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    sendPush?: boolean
  ) => Promise<void>;
  
  // Show toast notification
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  hideToast: () => void;
  toast: ToastState | null;
}

interface ToastState {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  visible: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    dayPackEnabled: true,
    dayPackIntensity: 'supportive',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize notification service
  useEffect(() => {
    const init = async () => {
      try {
        await notificationService.initialize();
        await loadData();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Refresh on app foreground and check periodic notifications
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        await loadData();
        
        // Check for streak at risk and weekly summary
        try {
          const allNotifications = await notificationService.getNotifications();
          // Get entries from database (we'll need to pass this in or fetch it)
          // For now, we'll just refresh notifications
        } catch (error) {
          console.error('Error checking periodic notifications:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const loadData = async () => {
    try {
      const [notifs, prefs, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getPreferences(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setPreferences(prefs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  };

  const refreshNotifications = useCallback(async () => {
    await loadData();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(async () => {
    await notificationService.clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    await notificationService.savePreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const createNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    sendPush: boolean = false
  ) => {
    if (!preferences.enabled) return;

    // Save in-app notification
    const notification = await notificationService.saveNotification({
      type,
      title,
      message,
      data,
    });

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Send push notification if requested
    if (sendPush) {
      notificationService.sendLocalNotification(type, title, message, data);
    }
  }, [preferences]);

  const showToast = useCallback((
    title: string, 
    message: string, 
    type: 'success' | 'info' | 'warning' = 'info'
  ) => {
    // Clear existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ title, message, type, visible: true });

    // Auto-hide after 4 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        preferences,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        updatePreferences,
        createNotification,
        showToast,
        hideToast,
        toast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
