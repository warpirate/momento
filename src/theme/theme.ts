import { useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  error: string;
  warning: string;
};

export const darkColors: ThemeColors = {
  background: '#0F172A', // Slate 900
  surface: '#1E293B', // Slate 800
  surfaceHighlight: '#334155', // Slate 700
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#CBD5E1', // Slate 300
  textMuted: '#94A3B8', // Slate 400
  primary: '#8B5CF6', // Violet 500
  primaryLight: '#A78BFA', // Violet 400
  secondary: '#10B981', // Emerald 500
  error: '#EF4444', // Red 500
  warning: '#F59E0B', // Amber 500
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF', // White
  surfaceHighlight: '#E2E8F0', // Slate 200
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  textMuted: '#94A3B8', // Slate 400
  primary: '#7C3AED', // Violet 600
  primaryLight: '#DDD6FE', // Violet 200
  secondary: '#059669', // Emerald 600
  error: '#DC2626', // Red 600
  warning: '#D97706', // Amber 600
};

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    isDark,
    spacing: {
      xs: 4,
      s: 8,
      m: 16,
      l: 24,
      xl: 32,
    },
    borderRadius: {
      s: 8,
      m: 12,
      l: 20,
      xl: 32,
    },
    typography: {
      heading: {
        fontSize: 24,
        fontWeight: '700' as const,
      },
      subheading: {
        fontSize: 18,
        fontWeight: '600' as const,
      },
      body: {
        fontSize: 16,
        lineHeight: 24,
      },
      caption: {
        fontSize: 13,
        color: colors.textMuted,
      },
    },
  };
};