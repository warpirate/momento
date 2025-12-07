import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/theme';
import { haptics } from '../../lib/haptics';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  /** Optional haptics behavior. If omitted, a medium tap is used. Set to 'none' to disable. */
  haptic?: 'none' | 'light' | 'medium' | 'heavy' | 'selection';
};

export function Button({
  title,
  onPress,

  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  haptic,
}: ButtonProps) {
  const { colors, borderRadius, spacing } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceHighlight;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF'; // Always white on solid buttons
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return disabled ? colors.surfaceHighlight : colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.s, paddingHorizontal: spacing.m };
      case 'large':
        return { paddingVertical: spacing.m + 4, paddingHorizontal: spacing.xl };
      default:
        return { paddingVertical: spacing.m, paddingHorizontal: spacing.l };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Default haptic for buttons unless explicitly disabled
    if (haptic !== 'none') {
      switch (haptic) {
        case 'light':
          haptics.light();
          break;
        case 'heavy':
          haptics.heavy();
          break;
        case 'selection':
          haptics.selection();
          break;
        case 'medium':
        default:
          haptics.medium();
          break;
      }
    }

    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: borderRadius.m,
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                marginLeft: icon ? spacing.s : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});