import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeContext } from '../../theme/ThemeContext';

interface ThemeTransitionWrapperProps {
  children: React.ReactNode;
}

export function ThemeTransitionWrapper({ children }: ThemeTransitionWrapperProps) {
  const { colors } = useThemeContext();
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create a subtle fade effect when theme changes
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [colors.background, fadeAnimation]);

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: colors.background,
          opacity: fadeAnimation,
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});