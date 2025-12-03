import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { Typography } from './Typography';
import { ThemeMode } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

interface ThemeToggleProps {
  value: ThemeMode;
  onValueChange: (value: ThemeMode) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function ThemeToggle({ value, onValueChange }: ThemeToggleProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const sliderAnimation = useRef(new Animated.Value(0)).current;
  
  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'smartphone' },
  ];

  const containerWidth = screenWidth - 64; // Account for padding
  const optionWidth = containerWidth / options.length;
  
  // Animate slider position when value changes
  useEffect(() => {
    const index = options.findIndex(option => option.value === value);
    const targetPosition = index * optionWidth;
    
    Animated.spring(sliderAnimation, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 300,
      friction: 8,
    }).start();
  }, [value, options, optionWidth, sliderAnimation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
      {/* Animated slider background */}
      <Animated.View
        style={[
          styles.slider,
          {
            backgroundColor: colors.primary,
            width: optionWidth - 8,
            transform: [{ translateX: sliderAnimation }],
            borderRadius: borderRadius.m,
          }
        ]}
      />
      
      {/* Theme options */}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = option.value === value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, { width: optionWidth }]}
              onPress={() => onValueChange(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Icon
                  name={option.icon}
                  size={18}
                  color={isSelected ? '#FFFFFF' : colors.textMuted}
                  style={styles.icon}
                />
                <Typography
                  variant="caption"
                  style={[
                    styles.label,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '600' as const : '400' as const
                    }
                  ]}
                >
                  {option.label}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    top: 8,
    bottom: 8,
  },
  optionsContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    zIndex: 1,
  },
  option: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});