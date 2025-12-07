import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { Typography } from './Typography';
import Icon from 'react-native-vector-icons/Feather';

interface UpdateModalProps {
  visible: boolean;
  title: string;
  message: string;
  progress: number;
  isDownloading: boolean;
  onCancel?: () => void;
  onInstall?: () => void;
  showInstallButton?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  title,
  message,
  progress,
  isDownloading,
  onCancel,
  onInstall,
  showInstallButton = false,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Spinning and pulsing animation for download icon
  useEffect(() => {
    if (isDownloading) {
      // Continuous spin animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Pulsing scale animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      pulseAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
        spinAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }
  }, [isDownloading, spinAnim, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (!isDownloading && onCancel) onCancel();
      }}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.l,
              padding: spacing.l,
              borderColor: colors.surfaceHighlight,
              borderWidth: 1,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="download-cloud" size={24} color={colors.primary} />
            </View>
            <Typography variant="subheading" style={styles.title}>
              {title}
            </Typography>
          </View>

          {/* Message */}
          <Typography
            variant="body"
            color={colors.textSecondary}
            style={styles.message}
          >
            {message}
          </Typography>

          {/* Downloading Animation Section */}
          {isDownloading && (
            <View style={styles.downloadingSection}>
              {/* Animated Download Icon */}
              <Animated.View
                style={[
                  styles.downloadIconContainer,
                  {
                    backgroundColor: colors.primary + '15',
                    transform: [{ scale: pulseAnim }, { rotate: spin }],
                  },
                ]}
              >
                <View style={[styles.downloadIconInner, { backgroundColor: colors.primary + '25' }]}>
                  <Icon name="download" size={32} color={colors.primary} />
                </View>
              </Animated.View>

              {/* Status Text */}
              <Typography variant="body" color={colors.textPrimary} style={styles.downloadingText}>
                Downloading Update...
              </Typography>

              {/* Progress Info */}
              <View style={styles.progressInfo}>
                <Typography variant="caption" color={colors.textMuted}>
                  {progress}% complete
                </Typography>
              </View>
              
              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: colors.surfaceHighlight }]}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: colors.primary,
                      width: progressWidth,
                    },
                  ]}
                />
              </View>

              {/* Animated wave dots */}
              <View style={styles.dotsContainer}>
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveDot,
                      {
                        backgroundColor: colors.primary,
                        transform: [{
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.15],
                            outputRange: [0.6 + index * 0.2, 1],
                          }),
                        }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Install Section */}
          {showInstallButton && !isDownloading && (
            <View style={styles.installSection}>
              <View style={[styles.successIcon, { backgroundColor: '#10b98120' }]}>
                <Icon name="check" size={24} color="#10b981" />
              </View>
              <Typography variant="body" color={colors.textSecondary} style={styles.successText}>
                Update downloaded successfully! Ready to install.
              </Typography>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!isDownloading && !showInstallButton && onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: colors.surfaceHighlight,
                    borderWidth: 1,
                  },
                ]}
              >
                <Typography variant="label" color={colors.textSecondary}>
                  Cancel
                </Typography>
              </TouchableOpacity>
            )}

            {showInstallButton && onInstall && (
              <TouchableOpacity
                onPress={onInstall}
                style={[
                  styles.button,
                  styles.installButton,
                  { backgroundColor: '#10b981' },
                ]}
              >
                <Typography variant="label" color="#FFFFFF" style={{ fontWeight: '600' }}>
                  Install Update
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  downloadingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  downloadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadingText: {
    fontWeight: '600',
    marginBottom: 8,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  waveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  installSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  installButton: {
    // Will be overridden by inline style
  },
});
