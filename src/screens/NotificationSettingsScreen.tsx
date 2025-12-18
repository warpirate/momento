import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Logo } from '../components/ui/Logo';
import { useTheme } from '../theme/theme';
import { useNotifications } from '../context/NotificationContext';
import { useAlert } from '../context/AlertContext';
import { notificationService } from '../lib/notificationService';
import { haptics } from '../lib/haptics';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();
  const { preferences, updatePreferences } = useNotifications();
  const { showAlert } = useAlert();
  const [showQuietHoursPicker, setShowQuietHoursPicker] = useState(false);

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    haptics.selection();
    
    // If enabling main toggle, request permissions first
    if (key === 'enabled' && value) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        showAlert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive reminders.',
        );
        return;
      }
    }

    await updatePreferences({ [key]: value });
  };

  const handleIntensityChange = async (intensity: 'standard' | 'supportive') => {
    haptics.selection();
    await updatePreferences({ dayPackIntensity: intensity });
  };

  const handleQuietHoursChange = async (quietHoursStart: string, quietHoursEnd: string) => {
    haptics.selection();
    await updatePreferences({ quietHoursStart, quietHoursEnd });
    setShowQuietHoursPicker(false);
  };

  const SettingRow = ({
    icon,
    label,
    description,
    value,
    onToggle,
    disabled = false,
  }: {
    icon: string;
    label: string;
    description: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View
      style={[
        styles.settingRow,
        { borderBottomColor: colors.surfaceHighlight, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Typography variant="body" color={colors.textPrimary}>
          {label}
        </Typography>
        <Typography variant="caption" color={colors.textMuted}>
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.surfaceHighlight, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Logo size="small" />
        <Typography variant="heading">Notifications</Typography>
      </View>

      <ScrollView style={[styles.content, { padding: spacing.m }]}>
        {/* Master Toggle */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceHighlight,
              borderRadius: borderRadius.l,
            },
          ]}
        >
          <SettingRow
            icon="bell"
            label="Enable Notifications"
            description="Receive reminders and updates from Momento"
            value={preferences.enabled}
            onToggle={(v) => handleToggle('enabled', v)}
          />
        </View>

        {/* Day Pack */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceHighlight,
              borderRadius: borderRadius.l,
            },
          ]}
        >
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>
            DAY PACK
          </Typography>

          <SettingRow
            icon="calendar"
            label="Day Pack"
            description="Dynamic prompts through the day (3–5 max)"
            value={preferences.dayPackEnabled}
            onToggle={(v) => handleToggle('dayPackEnabled', v)}
            disabled={!preferences.enabled}
          />
        </View>

        {/* Intensity */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceHighlight,
              borderRadius: borderRadius.l,
            },
          ]}
        >
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>
            INTENSITY
          </Typography>

          <TouchableOpacity
            style={[
              styles.choiceRow,
              { borderBottomColor: colors.surfaceHighlight },
              (!preferences.enabled || !preferences.dayPackEnabled) && styles.disabled,
            ]}
            onPress={() => handleIntensityChange('standard')}
            disabled={!preferences.enabled || !preferences.dayPackEnabled}
          >
            <View style={styles.settingContent}>
              <Typography variant="body" color={colors.textPrimary}>
                Standard
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                Up to 3/day
              </Typography>
            </View>
            {preferences.dayPackIntensity === 'standard' && (
              <Icon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.choiceRow,
              { borderBottomColor: colors.surfaceHighlight },
              (!preferences.enabled || !preferences.dayPackEnabled) && styles.disabled,
            ]}
            onPress={() => handleIntensityChange('supportive')}
            disabled={!preferences.enabled || !preferences.dayPackEnabled}
          >
            <View style={styles.settingContent}>
              <Typography variant="body" color={colors.textPrimary}>
                Supportive
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                Up to 3 + 2/day if inactive
              </Typography>
            </View>
            {preferences.dayPackIntensity === 'supportive' && (
              <Icon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Quiet Hours */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceHighlight,
              borderRadius: borderRadius.l,
            },
          ]}
        >
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>
            QUIET HOURS
          </Typography>

          <TouchableOpacity
            style={[
              styles.choiceRow,
              { borderBottomColor: colors.surfaceHighlight },
              (!preferences.enabled || !preferences.dayPackEnabled) && styles.disabled,
            ]}
            onPress={() => setShowQuietHoursPicker(true)}
            disabled={!preferences.enabled || !preferences.dayPackEnabled}
          >
            <View style={styles.settingContent}>
              <Typography variant="body" color={colors.textPrimary}>
                Quiet hours
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                {preferences.quietHoursStart} – {preferences.quietHoursEnd}
              </Typography>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Icon name="info" size={16} color={colors.textMuted} />
          <Typography variant="caption" color={colors.textMuted} style={styles.infoText}>
            Notifications are designed to be helpful, not intrusive. We'll respect your preferences
            and never spam you.
          </Typography>
        </View>
      </ScrollView>

      {/* Quiet Hours Picker (simple presets for now) */}
      {showQuietHoursPicker && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowQuietHoursPicker(false)}
            activeOpacity={1}
          />
          <View
            style={[
              styles.timePickerModal,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceHighlight,
                borderRadius: borderRadius.l,
              },
            ]}
          >
            <Typography variant="subheading" color={colors.textPrimary} style={styles.modalTitle}>
              Select Quiet Hours
            </Typography>
            {[
              { label: '10 PM – 8 AM', start: '22:00', end: '08:00' },
              { label: '11 PM – 8 AM', start: '23:00', end: '08:00' },
              { label: '9 PM – 7 AM', start: '21:00', end: '07:00' },
              { label: 'Off (no quiet hours)', start: '00:00', end: '00:00' },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.timeOption,
                  { borderBottomColor: colors.surfaceHighlight },
                  preferences.quietHoursStart === option.start && preferences.quietHoursEnd === option.end && {
                    backgroundColor: `${colors.primary}15`,
                  },
                ]}
                onPress={() => handleQuietHoursChange(option.start, option.end)}
              >
                <Typography
                  variant="body"
                  color={
                    preferences.quietHoursStart === option.start && preferences.quietHoursEnd === option.end
                      ? colors.primary
                      : colors.textPrimary
                  }
                >
                  {option.label}
                </Typography>
                {preferences.quietHoursStart === option.start && preferences.quietHoursEnd === option.end && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, { borderTopColor: colors.surfaceHighlight }]}
              onPress={() => setShowQuietHoursPicker(false)}
            >
              <Typography variant="body" color={colors.textMuted}>
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 68,
    borderBottomWidth: 1,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    marginBottom: 32,
    gap: 8,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timePickerModal: {
    width: '85%',
    maxWidth: 340,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalTitle: {
    padding: 16,
    textAlign: 'center',
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
