import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/theme';
import { Typography } from './Typography';

export type WhatsNewModalContent = {
  version: string;
  title: string;
  description?: string;
  changes?: string[];
};

type Props = {
  visible: boolean;
  content: WhatsNewModalContent;
  onClose: () => void;
};

export function WhatsNewModal({ visible, content, onClose }: Props) {
  const { colors, spacing, borderRadius } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      scaleAnim.setValue(0.98);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 10, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const changes = useMemo(() => {
    const list = Array.isArray(content.changes) ? content.changes : [];
    return list.slice(0, 6);
  }, [content.changes]);

  const description = useMemo(() => {
    const raw = String(content.description ?? '').trim();
    if (!raw) return '';

    const hasConflictMarkers = /(^|\n)\s*#\s*conflicts\b/i.test(raw) || /(^|\n)\s*#\s*\t?package\.json\b/i.test(raw);
    if (hasConflictMarkers) return '';

    // Avoid rendering long, bullet-heavy commit bodies in the description block.
    const bulletCount = raw.split(/\r?\n/).filter((line) => /^\s*[-*]\s+/.test(line)).length;
    if (bulletCount >= 2) return '';

    return raw;
  }, [content.description]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceHighlight,
              borderRadius: borderRadius.xl,
              padding: spacing.l,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
              <Icon name="star" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.m }}>
              <Typography variant="subheading" style={{ marginBottom: 2 }}>
                What’s new
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                Version {content.version}
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]}>
              <Icon name="x" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ marginTop: spacing.m }}
            contentContainerStyle={{ paddingBottom: spacing.m }}
            showsVerticalScrollIndicator={false}
          >
            <Typography variant="body" style={{ fontWeight: '700', marginBottom: 6 }} numberOfLines={3}>
              {content.title}
            </Typography>

            {!!description && (
              <Typography
                variant="caption"
                color={colors.textSecondary}
                style={{ lineHeight: 18 }}
                numberOfLines={6}
              >
                {description}
              </Typography>
            )}

            {changes.length > 0 && (
              <View style={{ marginTop: spacing.l }}>
                {changes.map((change, index) => (
                  <View key={`${index}-${change}`} style={styles.changeRow}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Typography
                      variant="body"
                      color={colors.textSecondary}
                      style={{ flex: 1, lineHeight: 22 }}
                    >
                      {change}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.m,
                marginTop: spacing.l,
              },
            ]}
          >
            <Typography variant="label" color="#FFFFFF" style={{ fontWeight: '700' }}>
              Continue
            </Typography>
          </TouchableOpacity>

          <Typography
            variant="caption"
            color={colors.textMuted}
            style={{ marginTop: spacing.m, textAlign: 'center' }}
          >
            {Platform.OS === 'ios' ? 'Tip: You can view updates after each install.' : 'Tip: Updates show once per version.'}
          </Typography>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    alignSelf: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
