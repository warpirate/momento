import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBellProps {
  onPress: () => void;
}

export function NotificationBell({ onPress }: NotificationBellProps) {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceHighlight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="bell" size={18} color={colors.textPrimary} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Typography 
            variant="caption" 
            style={styles.badgeText}
            color="#FFFFFF"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
