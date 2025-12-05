import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography } from './ui/Typography';
import { useTheme } from '../theme/theme';
import { AnimatedFire } from './AnimatedFire';

interface StreakStatusProps {
  streak: number;
  isAtRisk: boolean;
  onPress: () => void;
}

export const StreakStatus: React.FC<StreakStatusProps> = ({ streak, isAtRisk, onPress }) => {
  const { colors } = useTheme();
  const [prevStreak, setPrevStreak] = useState(streak);
  const [showPlusOne, setShowPlusOne] = useState(false);
  
  // Animations
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const plusOneAnim = useRef(new Animated.Value(0)).current;
  const plusOneOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak > prevStreak) {
      // Trigger +1 animation
      setShowPlusOne(true);
      plusOneAnim.setValue(0);
      plusOneOpacity.setValue(1);
      
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.5,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(plusOneAnim, {
            toValue: -30,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(plusOneOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => {
        setShowPlusOne(false);
      });
    }
    setPrevStreak(streak);
  }, [streak]);

  useEffect(() => {
    if (isAtRisk) {
      // Sophisticated flicker/pulse animation for expiring streak
      // Not just a simple blink, but a "dying light" effect
      const flicker = Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 0.3,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.5,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.8,
          duration: 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.2,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 1000, // Stay bright for a second
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(flicker).start();
    } else {
      flickerAnim.setValue(1);
    }
  }, [isAtRisk]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.container}>
        {showPlusOne && (
          <Animated.View
            style={[
              styles.plusOneContainer,
              {
                opacity: plusOneOpacity,
                transform: [{ translateY: plusOneAnim }],
              },
            ]}
          >
            <Typography variant="label" style={{ color: colors.secondary, fontWeight: 'bold' }}>
              +1
            </Typography>
          </Animated.View>
        )}
        
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: isAtRisk ? colors.error + '15' : colors.secondary + '20',
              borderColor: isAtRisk ? colors.error : colors.secondary,
              opacity: isAtRisk ? flickerAnim : 1,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={{ marginRight: 4 }}>
            <AnimatedFire size={16} intensity={isAtRisk ? 'low' : 'medium'} />
          </View>
          <Typography
            variant="label"
            color={isAtRisk ? colors.error : colors.secondary}
            style={{ fontWeight: 'bold' }}
          >
            {streak}
          </Typography>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusOneContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
});