import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../theme/theme';
import { Typography } from './Typography';
import Icon from 'react-native-vector-icons/Feather';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
  onDismiss?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
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
          <Typography variant="subheading" style={{ marginBottom: spacing.s, textAlign: 'center' }}>
            {title}
          </Typography>
          <Typography
            variant="body"
            color={colors.textSecondary}
            style={{ marginBottom: spacing.l, textAlign: 'center' }}
          >
            {message}
          </Typography>

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isLast = index === buttons.length - 1;
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    if (onDismiss) onDismiss();
                  }}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isDestructive
                        ? colors.error + '20' // 20% opacity
                        : isCancel
                        ? 'transparent'
                        : colors.primary,
                      marginRight: isLast ? 0 : spacing.s,
                      borderColor: isCancel ? colors.surfaceHighlight : 'transparent',
                      borderWidth: isCancel ? 1 : 0,
                    },
                  ]}
                >
                  <Typography
                    variant="label"
                    color={
                      isDestructive
                        ? colors.error
                        : isCancel
                        ? colors.textSecondary
                        : '#FFFFFF'
                    }
                    style={{ fontWeight: '600' }}
                  >
                    {btn.text}
                  </Typography>
                </TouchableOpacity>
              );
            })}
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
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});