import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { useNotifications } from '../context/NotificationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOAST_ICONS = {
  success: 'check-circle',
  info: 'info',
  warning: 'alert-triangle',
};

const TOAST_COLORS = {
  success: '#22C55E',
  info: '#7C3AED',
  warning: '#FBBF24',
};

export function NotificationToast() {
  const { colors, borderRadius } = useTheme();
  const { toast, hideToast } = useNotifications();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast?.visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast?.visible]);

  if (!toast) return null;

  const iconName = TOAST_ICONS[toast.type];
  const accentColor = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={toast.visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceHighlight,
            borderRadius: borderRadius.l,
            borderLeftColor: accentColor,
          },
        ]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
          <Icon name={iconName} size={20} color={accentColor} />
        </View>
        <View style={styles.content}>
          <Typography variant="body" style={styles.title} color={colors.textPrimary} numberOfLines={1}>
            {toast.title}
          </Typography>
          <Typography variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {toast.message}
          </Typography>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Icon name="x" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
