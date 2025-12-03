import { useThemeContext } from './ThemeContext';

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
  // A softer, more “night journal” palette: deep navy background,
  // slightly warmer surfaces, calm accent colors.
  background: '#050816', // very deep blue / near-black
  surface: '#0B1020', // elevated cards / bottom sheets
  surfaceHighlight: '#181B2A', // outlines, dividers, subtle chips
  textPrimary: '#F9FAFB', // almost white
  textSecondary: '#D1D5DB', // soft grey
  textMuted: '#6B7280', // muted labels / helper text
  primary: '#7C3AED', // rich violet accent
  primaryLight: '#A855F7', // lighter violet for hovers / badges
  secondary: '#22C55E', // gentle green for positive signals
  error: '#F97373', // softer red
  warning: '#FBBF24', // warm amber
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
  const { colors, isDark, themeMode, setThemeMode, isLoading } = useThemeContext();

  return {
    colors,
    isDark,
    themeMode,
    setThemeMode,
    isLoading,
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