import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Typography } from './ui/Typography';
import { useTheme } from '../theme/theme';
import { getNextWeeklyBadge } from '../lib/gamification';
import { AnimatedFire } from './AnimatedFire';

interface StreakProgressModalProps {
  visible: boolean;
  onClose: () => void;
  currentStreak: number;
}

export const StreakProgressModal: React.FC<StreakProgressModalProps> = ({
  visible,
  onClose,
  currentStreak,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const getFireIntensity = (streak: number) => {
    if (streak >= 30) return 'high';
    if (streak >= 7) return 'medium';
    return 'low';
  };

  const currentWeekBadge = getNextWeeklyBadge(currentStreak);
  const daysInCurrentWeek = currentStreak % 7;
  const badgeTargetMatch = currentWeekBadge.description.match(/(\d+)/);
  const badgeTargetDays = badgeTargetMatch ? parseInt(badgeTargetMatch[1], 10) : 7;
  const badgeProgressDays = Math.min(currentStreak, badgeTargetDays);
  
  // If daysInCurrentWeek is 0, it means we just completed a 7-day cycle (e.g., day 7, 14, 21)
  // In this case, we want to show the completed state (7/7) instead of 0/7
  const isCycleComplete = daysInCurrentWeek === 0 && currentStreak > 0;
  const progress = isCycleComplete ? 7 : daysInCurrentWeek;
  
  // If cycle is complete, we show the badge we just earned.
  // If not, we show the badge we are working towards.
  // The getNextWeeklyBadge function returns the badge for the *current* week index.
  // If streak is 7, index is 1 (Week 2). But we want to show we just finished Week 1.
  // So if cycle is complete, we might want to look at the *previous* badge?
  // Actually, let's stick to the "working towards" logic but show 7/7 filled if we just hit the milestone.
  
  // Wait, if I have 7 days, getNextWeeklyBadge returns "Two Weeks" (target 14).
  // But I want to see that I completed "Week Warrior" (target 7).
  // Let's adjust the logic slightly for display.
  
  const targetBadge = currentWeekBadge;
  
  const renderDayCircle = (dayIndex: number) => {
    const isCompleted = dayIndex <= progress;
    const isToday = !isCycleComplete && dayIndex === progress + 1;
    
    return (
      <View key={dayIndex} style={styles.dayContainer}>
        <View
          style={[
            styles.dayCircle,
            {
              backgroundColor: isCompleted ? colors.secondary : colors.surfaceHighlight,
              borderColor: isCompleted ? colors.secondary : colors.surfaceHighlight,
            },
            isToday && {
              borderColor: colors.primary,
              borderWidth: 2,
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={`Day ${dayIndex}${isCompleted ? ' completed' : isToday ? ' today' : ''}`}
        >
          {isCompleted ? (
            <Icon name="check" size={16} color="#FFF" />
          ) : (
            <Typography
              variant="label"
              style={{ color: isToday ? colors.primary : colors.textMuted, fontWeight: 'bold' }}
            >
              {dayIndex}
            </Typography>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.centering} onPress={(event) => event.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.xl,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={[styles.headerIcon, { backgroundColor: colors.primary + '14' }]}>
                  <Icon name="trending-up" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="subheading">Streak</Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    Keep showing up.
                  </Typography>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]}
                accessibilityRole="button"
                accessibilityLabel="Close streak dialog"
              >
                <Icon name="x" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.streakHero}>
                <View style={[styles.heroRing, { backgroundColor: colors.primary + '10' }]}>
                  <AnimatedFire size={72} intensity={getFireIntensity(currentStreak)} />
                </View>

                <View style={styles.streakCountContainer}>
                  <Typography
                    variant="heading"
                    style={{ fontSize: 52, lineHeight: 56, color: colors.textPrimary, letterSpacing: -1 }}
                  >
                    {currentStreak}
                  </Typography>
                  <Typography variant="subheading" color={colors.textSecondary}>
                    day streak
                  </Typography>
                </View>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceHighlight }]} />

              <View
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.l,
                    borderColor: colors.surfaceHighlight,
                  },
                ]}
              >
                <View style={styles.badgeHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Icon name={targetBadge.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.m }}>
                    <Typography variant="subheading" style={{ marginBottom: 2 }}>
                      {targetBadge.name}
                    </Typography>
                    <Typography variant="caption" color={colors.textSecondary}>
                      {targetBadge.description}
                    </Typography>
                  </View>
                  <View style={[styles.progressPill, { backgroundColor: colors.primary + '12' }]}>
                    <Typography variant="label" color={colors.primary} style={{ fontWeight: 'bold' }}>
                      {badgeProgressDays}/{badgeTargetDays}
                    </Typography>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.surfaceHighlight }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(badgeProgressDays / badgeTargetDays) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Typography variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.s }}>
                  This week: {progress}/7
                </Typography>

                <View style={styles.daysRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map(renderDayCircle)}
                </View>

                <Typography variant="caption" color={colors.textMuted} style={{ marginTop: spacing.s }}>
                  {isCycleComplete
                    ? 'Milestone reached. Keep going for the next badge.'
                    : `Complete ${7 - progress} more day${7 - progress === 1 ? '' : 's'} this week.`}
                </Typography>
              </View>

              <View style={styles.footer}>
                <Typography
                  variant="body"
                  style={{ textAlign: 'center', fontStyle: 'italic' }}
                  color={colors.textMuted}
                >
                  "Consistency is the key to mastery."
                </Typography>
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  centering: {
    width: '100%',
    alignSelf: 'center',
  },
  modalContent: {
    paddingTop: 16,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    maxHeight: '85%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  streakHero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  heroRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakCountContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  badgeCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPill: {
    minWidth: 56,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    width: 34,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
});