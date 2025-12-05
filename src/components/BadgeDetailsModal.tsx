import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { Card } from './ui/Card';
import Icon from 'react-native-vector-icons/Feather';
import { Badge, getBadgesByCategory, getNextBadge } from '../lib/gamification';

interface BadgeDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  badge: Badge | null;
  stats: {
    totalEntries: number;
    currentStreak: number;
    totalWords: number;
  };
}

const { width } = Dimensions.get('window');

export const BadgeDetailsModal = ({
  visible,
  onClose,
  badge,
  stats,
}: BadgeDetailsModalProps) => {
  const { colors, spacing, borderRadius } = useTheme();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate progress bar after modal opens
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Width cannot use native driver
      }).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, progressAnim]);

  if (!badge) return null;

  const categoryBadges = getBadgesByCategory(badge.category);
  const nextBadge = getNextBadge(badge);
  
  // Calculate progress
  let currentVal = 0;
  if (badge.category === 'streak') currentVal = stats.currentStreak;
  else if (badge.category === 'entries') currentVal = stats.totalEntries;
  else if (badge.category === 'words') currentVal = stats.totalWords;

  const targetVal = nextBadge ? nextBadge.threshold : badge.threshold;
  const prevThreshold = badge.threshold;
  
  // If we have a next badge, we want to show progress towards it.
  // If we are at max level, we show 100%.
  
  let progressPercent = 0;
  if (!nextBadge) {
    progressPercent = 100;
  } else {
    // Simple 0 to Target progress
    progressPercent = Math.min(100, Math.max(0, (currentVal / targetVal) * 100));
  }
  
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${progressPercent}%`],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <Animated.View style={[styles.backdropFill, { opacity: opacityAnim, backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Card style={[styles.card, { backgroundColor: colors.surface }]} padding="large">
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon name={badge.icon} size={48} color={colors.primary} />
              </View>
              <Typography variant="heading" style={styles.title}>{badge.name}</Typography>
              <Typography variant="body" color={colors.textMuted} align="center">
                {badge.description}
              </Typography>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Typography variant="caption" color={colors.textMuted}>
                  {nextBadge ? 'Progress to Next Level' : 'Mastery Progress'}
                </Typography>
                <Typography variant="caption" color={colors.primary}>
                  {currentVal} / {targetVal}
                </Typography>
              </View>
              
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHighlight }]}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: progressWidth,
                    }
                  ]}
                />
              </View>
              
              {nextBadge ? (
                <View style={styles.nextBadgeContainer}>
                  <Typography variant="caption" style={styles.nextBadgeText} color={colors.textMuted}>
                    Next: <Typography variant="caption" style={{fontWeight: '700'}} color={colors.textPrimary}>{nextBadge.name}</Typography>
                  </Typography>
                  <Typography variant="caption" color={colors.textMuted}>
                    {Math.max(0, targetVal - currentVal)} more needed
                  </Typography>
                </View>
              ) : (
                <Typography variant="caption" style={styles.nextBadgeText} color={colors.primary}>
                  Max Level Reached!
                </Typography>
              )}
            </View>

            <View style={styles.variantsSection}>
              <Typography variant="label" style={styles.variantsTitle}>BADGE LEVELS</Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantsList}>
                {categoryBadges.map((b) => {
                  const isUnlocked = currentVal >= b.threshold;
                  const isCurrent = b.id === badge.id;
                  
                  return (
                    <View key={b.id} style={[styles.variantItem, { opacity: isUnlocked ? 1 : 0.4 }]}>
                      <View style={[
                        styles.variantIcon, 
                        { 
                          backgroundColor: isUnlocked ? colors.primary + '20' : colors.surfaceHighlight,
                          borderColor: isCurrent ? colors.primary : 'transparent',
                          borderWidth: isCurrent ? 2 : 0,
                        }
                      ]}>
                        <Icon name={b.icon} size={20} color={isUnlocked ? colors.primary : colors.textMuted} />
                      </View>
                      <Typography variant="caption" style={styles.variantText}>{b.threshold}</Typography>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextBadgeContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  nextBadgeText: {
    textAlign: 'center',
  },
  variantsSection: {
    width: '100%',
  },
  variantsTitle: {
    marginBottom: 12,
    letterSpacing: 1,
    opacity: 0.6,
  },
  variantsList: {
    gap: 12,
    paddingBottom: 8,
  },
  variantItem: {
    alignItems: 'center',
    gap: 4,
  },
  variantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantText: {
    fontSize: 12,
    fontWeight: '600',
  },
});