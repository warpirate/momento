import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/theme';

interface AnimatedFireProps {
  size?: number;
  intensity?: 'low' | 'medium' | 'high';
}

export const AnimatedFire: React.FC<AnimatedFireProps> = ({
  size = 48,
  intensity = 'medium'
}) => {
  const { colors } = useTheme();
  
  // Animation values for different layers of the fire
  const coreScale = useRef(new Animated.Value(1)).current;
  const coreOpacity = useRef(new Animated.Value(1)).current;
  const coreTranslateY = useRef(new Animated.Value(0)).current;
  
  const midScale = useRef(new Animated.Value(1)).current;
  const midOpacity = useRef(new Animated.Value(0.8)).current;
  const midTranslateY = useRef(new Animated.Value(0)).current;
  
  const outerScale = useRef(new Animated.Value(1)).current;
  const outerOpacity = useRef(new Animated.Value(0.6)).current;
  const outerTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Define animation configurations based on intensity
    const getDuration = () => {
      switch (intensity) {
        case 'high': return 500;
        case 'low': return 1200;
        default: return 800;
      }
    };

    const duration = getDuration();

    // Helper to create a random flicker effect
    const createFlicker = (
      scaleAnim: Animated.Value,
      opacityAnim: Animated.Value,
      translateAnim: Animated.Value,
      baseScale: number,
      scaleVar: number,
      delay: number = 0
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: baseScale + scaleVar,
              duration: duration * (0.8 + Math.random() * 0.4),
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.7 + Math.random() * 0.3,
              duration: duration * (0.8 + Math.random() * 0.4),
              useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
              toValue: -2 + Math.random() * 4,
              duration: duration * (0.8 + Math.random() * 0.4),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: baseScale - scaleVar * 0.5,
              duration: duration * (0.8 + Math.random() * 0.4),
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.9,
              duration: duration * (0.8 + Math.random() * 0.4),
              useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
              toValue: 0,
              duration: duration * (0.8 + Math.random() * 0.4),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const coreAnim = createFlicker(coreScale, coreOpacity, coreTranslateY, 1, 0.1, 0);
    const midAnim = createFlicker(midScale, midOpacity, midTranslateY, 1, 0.15, duration * 0.3);
    const outerAnim = createFlicker(outerScale, outerOpacity, outerTranslateY, 1, 0.2, duration * 0.6);

    Animated.parallel([coreAnim, midAnim, outerAnim]).start();

    return () => {
      coreScale.stopAnimation();
      midScale.stopAnimation();
      outerScale.stopAnimation();
    };
  }, [intensity]);

  // Determine colors based on intensity
  const getFireColors = () => {
    switch (intensity) {
      case 'high':
        return {
          core: '#FFF7ED', // Very hot (white/yellow)
          mid: '#FDBA74',  // Orange
          outer: '#EF4444', // Red
        };
      case 'low':
        return {
          core: '#FEF3C7',
          mid: '#FCD34D',
          outer: '#F59E0B',
        };
      default: // medium
        return {
          core: '#FFEDD5',
          mid: '#FB923C',
          outer: '#EA580C',
        };
    }
  };

  const fireColors = getFireColors();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Glow/Flame */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { scale: outerScale },
              { translateY: outerTranslateY }
            ],
            opacity: outerOpacity,
          },
        ]}
      >
        <MaterialCommunityIcon
          name="fire"
          size={size}
          color={fireColors.outer}
        />
      </Animated.View>

      {/* Mid Flame */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { scale: midScale },
              { translateY: midTranslateY }
            ],
            opacity: midOpacity,
          },
        ]}
      >
        <MaterialCommunityIcon
          name="fire"
          size={size * 0.8}
          color={fireColors.mid}
        />
      </Animated.View>

      {/* Core Flame */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { scale: coreScale },
              { translateY: coreTranslateY }
            ],
            opacity: coreOpacity,
          },
        ]}
      >
        <MaterialCommunityIcon
          name="fire"
          size={size * 0.5}
          color={fireColors.core}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});