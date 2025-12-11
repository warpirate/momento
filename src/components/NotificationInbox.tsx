import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { useNotifications } from '../context/NotificationContext';
import { AppNotification, NotificationType } from '../lib/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationInboxProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: AppNotification) => void;
}

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'daily_reminder':
      return 'edit-3';
    case 'streak_at_risk':
      return 'alert-triangle';
    case 'streak_milestone':
      return 'award';
    case 'weekly_summary':
      return 'bar-chart-2';
    case 'insight':
      return 'eye';
    case 'achievement':
      return 'star';
    default:
      return 'bell';
  }
};

const getNotificationColor = (type: NotificationType, colors: any): string => {
  switch (type) {
    case 'streak_at_risk':
      return colors.warning;
    case 'streak_milestone':
    case 'achievement':
      return colors.secondary;
    case 'insight':
    case 'weekly_summary':
      return colors.primary;
    default:
      return colors.textMuted;
  }
};

function NotificationItem({ 
  notification, 
  onPress,
  colors,
}: { 
  notification: AppNotification; 
  onPress: () => void;
  colors: any;
}) {
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type, colors);
  const timeAgo = formatDistanceToNow(notification.createdAt, { addSuffix: true });

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.read ? 'transparent' : `${colors.primary}10`,
          borderBottomColor: colors.surfaceHighlight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.contentContainer}>
        <Typography 
          variant="body" 
          style={[styles.title, !notification.read && styles.unreadTitle]}
          color={colors.textPrimary}
          numberOfLines={1}
        >
          {notification.title}
        </Typography>
        <Typography 
          variant="caption" 
          color={colors.textSecondary}
          numberOfLines={2}
        >
          {notification.message}
        </Typography>
        <Typography variant="caption" color={colors.textMuted} style={styles.time}>
          {timeAgo}
        </Typography>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export function NotificationInbox({ visible, onClose, onNotificationPress }: NotificationInboxProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={48} color={colors.textMuted} />
      <Typography variant="body" color={colors.textMuted} style={styles.emptyText}>
        No notifications yet
      </Typography>
      <Typography variant="caption" color={colors.textMuted} style={styles.emptySubtext}>
        You'll see reminders, streak updates, and insights here
      </Typography>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={[
            styles.modalContent,
            { 
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceHighlight }]}>
            <View style={styles.headerLeft}>
              <Typography variant="heading" color={colors.textPrimary}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Typography variant="caption" color="#FFFFFF" style={styles.countText}>
                    {unreadCount}
                  </Typography>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <>
                  <TouchableOpacity 
                    onPress={markAllAsRead}
                    style={styles.headerButton}
                  >
                    <Icon name="check-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={clearAll}
                    style={styles.headerButton}
                  >
                    <Icon name="trash-2" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification List */}
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={() => handleNotificationPress(item)}
                colors={colors}
              />
            )}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: SCREEN_HEIGHT * 0.75,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  time: {
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
  },
});
