import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
};

export function Card({ children, style, variant = 'default', padding = 'medium' }: CardProps) {
  const { colors, borderRadius, spacing, isDark } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return spacing.s;
      case 'large': return spacing.l;
      default: return spacing.m;
    }
  };

  const getBackgroundColor = () => {
    return colors.surface;
  };

  const getBorder = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: colors.surfaceHighlight,
      };
    }
    return {};
  };

  const getShadow = () => {
    if (variant === 'elevated' && !isDark) {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      };
    }
    return {};
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: borderRadius.l,
          padding: getPadding(),
          ...getBorder(),
          ...getShadow(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});