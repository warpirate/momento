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

const TIME_OPTIONS = [
  { label: 'Morning (8:00 AM)', value: '08:00' },
  { label: 'Afternoon (2:00 PM)', value: '14:00' },
  { label: 'Evening (6:00 PM)', value: '18:00' },
  { label: 'Night (9:00 PM)', value: '21:00' },
  { label: 'Late Night (10:00 PM)', value: '22:00' },
];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();
  const { preferences, updatePreferences } = useNotifications();
  const { showAlert } = useAlert();
  const [showTimePicker, setShowTimePicker] = useState(false);

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

    // Schedule/cancel daily reminder based on toggle
    if (key === 'enabled' || key === 'dailyReminder') {
      if (value && preferences.enabled) {
        await notificationService.scheduleDailyReminder(preferences.reminderTime);
      }
    }
  };

  const handleTimeChange = async (time: string) => {
    haptics.selection();
    await updatePreferences({ reminderTime: time });
    setShowTimePicker(false);
    
    if (preferences.enabled && preferences.dailyReminder) {
      await notificationService.scheduleDailyReminder(time);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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

        {/* Reminder Settings */}
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
            DAILY REMINDER
          </Typography>

          <SettingRow
            icon="clock"
            label="Daily Reminder"
            description="Get a gentle nudge to journal every day"
            value={preferences.dailyReminder}
            onToggle={(v) => handleToggle('dailyReminder', v)}
            disabled={!preferences.enabled}
          />

          <TouchableOpacity
            style={[
              styles.timeSelector,
              { borderBottomColor: colors.surfaceHighlight },
              (!preferences.enabled || !preferences.dailyReminder) && styles.disabled,
            ]}
            onPress={() => setShowTimePicker(true)}
            disabled={!preferences.enabled || !preferences.dailyReminder}
          >
            <View style={styles.settingContent}>
              <Typography variant="body" color={colors.textPrimary}>
                Reminder Time
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>
                When should we remind you?
              </Typography>
            </View>
            <View style={styles.timeValue}>
              <Typography variant="body" color={colors.primary}>
                {formatTime(preferences.reminderTime)}
              </Typography>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Alert Types */}
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
            NOTIFICATION TYPES
          </Typography>

          <SettingRow
            icon="zap"
            label="Streak Alerts"
            description="Know when your streak is at risk or hits a milestone"
            value={preferences.streakAlerts}
            onToggle={(v) => handleToggle('streakAlerts', v)}
            disabled={!preferences.enabled}
          />


          <SettingRow
            icon="award"
            label="Achievements"
            description="Celebrate when you unlock new badges"
            value={preferences.achievementAlerts}
            onToggle={(v) => handleToggle('achievementAlerts', v)}
            disabled={!preferences.enabled}
          />

          <SettingRow
            icon="bar-chart-2"
            label="Weekly Summary"
            description="Receive a weekly reflection of your journaling"
            value={preferences.weeklySummary}
            onToggle={(v) => handleToggle('weeklySummary', v)}
            disabled={!preferences.enabled}
          />
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

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowTimePicker(false)}
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
              Select Reminder Time
            </Typography>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOption,
                  { borderBottomColor: colors.surfaceHighlight },
                  preferences.reminderTime === option.value && {
                    backgroundColor: `${colors.primary}15`,
                  },
                ]}
                onPress={() => handleTimeChange(option.value)}
              >
                <Typography
                  variant="body"
                  color={
                    preferences.reminderTime === option.value
                      ? colors.primary
                      : colors.textPrimary
                  }
                >
                  {option.label}
                </Typography>
                {preferences.reminderTime === option.value && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, { borderTopColor: colors.surfaceHighlight }]}
              onPress={() => setShowTimePicker(false)}
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
