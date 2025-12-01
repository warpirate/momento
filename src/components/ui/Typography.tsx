import React from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { useTheme } from '../../theme/theme';

type TypographyProps = {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Typography({
  children,
  variant = 'body',
  color,
  align = 'left',
  style,
  numberOfLines,
}: TypographyProps) {
  const { colors, typography } = useTheme();

  const getStyle = () => {
    switch (variant) {
      case 'heading':
        return { ...typography.heading, color: colors.textPrimary };
      case 'subheading':
        return { ...typography.subheading, color: colors.textPrimary };
      case 'body':
        return { ...typography.body, color: colors.textSecondary };
      case 'caption':
        return { ...typography.caption, color: colors.textMuted };
      case 'label':
        return { fontSize: 14, fontWeight: '600' as const, color: colors.textPrimary };
      default:
        return { ...typography.body, color: colors.textSecondary };
    }
  };

  return (
    <Text
      style={[
        getStyle(),
        color ? { color } : {},
        { textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}