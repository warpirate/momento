import { Platform, Vibration } from 'react-native';

/**
 * Haptic feedback utility using React Native's Vibration API
 * Provides tactile feedback for key user actions
 */

type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';

const VIBRATION_PATTERNS: Record<HapticType, number | number[]> = {
  success: 50,
  warning: [0, 50, 50, 50],
  error: [0, 100, 50, 100],
  light: 10,
  medium: 30,
  heavy: 50,
  selection: 10,
};

export function triggerHaptic(type: HapticType = 'light'): void {
  if (Platform.OS === 'web') return;
  
  const pattern = VIBRATION_PATTERNS[type];
  
  if (Array.isArray(pattern)) {
    Vibration.vibrate(pattern);
  } else {
    Vibration.vibrate(pattern);
  }
}

// Convenience functions
export const haptics = {
  /** Light tap - for selections, toggles */
  light: () => triggerHaptic('light'),
  
  /** Medium tap - for button presses */
  medium: () => triggerHaptic('medium'),
  
  /** Heavy tap - for important actions */
  heavy: () => triggerHaptic('heavy'),
  
  /** Success - entry saved, sync complete */
  success: () => triggerHaptic('success'),
  
  /** Warning - delete confirmation, unsaved changes */
  warning: () => triggerHaptic('warning'),
  
  /** Error - validation failed, action blocked */
  error: () => triggerHaptic('error'),
  
  /** Selection - tab change, item select */
  selection: () => triggerHaptic('selection'),
};

export default haptics;
