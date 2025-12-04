import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Share, Linking } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useTheme } from '../theme/theme';
import { database } from '../db';
import Entry from '../db/model/Entry';
import Icon from 'react-native-vector-icons/Feather';
import { useAlert } from '../context/AlertContext';
import { useSyncContext } from '../lib/SyncContext';

const APP_VERSION = '0.0.2';
const GITHUB_REPO = 'warpirate/momento';

const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

export default function SettingsScreen() {
  console.log('Render SettingsScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius, themeMode, setThemeMode } = useTheme();
  const { showAlert } = useAlert();
  const { sync, isSyncing, lastSyncAt } = useSyncContext();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showAlert('Error signing out', error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const entries = await database.get<Entry>('entries').query().fetch();
      const data = entries.map(entry => ({
        id: entry.id,
        content: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        moodRating: entry.moodRating,
        sleepRating: entry.sleepRating,
        energyRating: entry.energyRating,
        images: entry.images,
        voiceNote: entry.voiceNote,
      }));

      const json = JSON.stringify(data, null, 2);
      
      await Share.share({
        message: json,
        title: 'Momento Journal Export',
      });
    } catch (error) {
      showAlert('Export failed', (error as Error).message);
    }
  };

  const checkForUpdates = async () => {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) {
        throw new Error('Failed to fetch release info');
      }
      const data = await response.json();
      const latestVersion = data.tag_name.replace(/^v/, '');
      
      if (compareVersions(latestVersion, APP_VERSION) > 0) {
        showAlert(
          'Update Available',
          `A new version (${latestVersion}) is available.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Download', onPress: () => Linking.openURL(data.html_url) }
          ]
        );
      } else {
        showAlert('Up to date', 'You are using the latest version of Momento.');
      }
    } catch (error) {
      showAlert('Error', 'Failed to check for updates.');
    }
  };

  const SettingItem = ({
    label,
    onPress,
    destructive = false,
    value
  }: {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    value?: string;
  }) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.surfaceHighlight }]}
      onPress={onPress}
    >
      <View>
        <Typography
          style={styles.itemLabel}
          color={destructive ? colors.error : colors.textPrimary}
        >
          {label}
        </Typography>
        {value && (
          <Typography variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
            {value}
          </Typography>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Logo size="small" />
        <Typography variant="heading">Settings</Typography>
      </View>

      <ScrollView style={[styles.content, { padding: spacing.m }]}>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>ACCOUNT</Typography>
          <SettingItem label="Profile" onPress={() => navigation.navigate('Profile')} />
          <SettingItem label="Notifications" onPress={() => showAlert('Coming soon', 'This feature is under development.')} />
          <SettingItem label="Privacy" onPress={() => showAlert('Coming soon', 'This feature is under development.')} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>DATA</Typography>
          <SettingItem label="Export Data" onPress={handleExportData} />
          <SettingItem
            label={isSyncing ? "Syncing..." : "Sync Now"}
            onPress={sync}
            value={lastSyncAt ? `Last synced: ${lastSyncAt.toLocaleString()}` : 'Never synced'}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>APP</Typography>
          <View style={styles.themeSection}>
            <Typography variant="body" color={colors.textPrimary} style={styles.themeLabel}>
              Theme
            </Typography>
            <Typography variant="caption" color={colors.textMuted} style={styles.themeDescription}>
              Choose your preferred theme appearance
            </Typography>
            <View style={styles.themeToggleContainer}>
              <ThemeToggle value={themeMode} onValueChange={setThemeMode} />
            </View>
          </View>
          <SettingItem
            label="About Momento"
            onPress={() => showAlert(
              'Momento',
              `Version ${APP_VERSION}`,
              [
                { text: 'OK' },
                { text: 'Check for Updates', onPress: checkForUpdates }
              ]
            )}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <SettingItem label="Sign Out" onPress={handleSignOut} destructive />
        </View>
      </ScrollView>
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
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  themeSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
  themeToggleContainer: {
    alignSelf: 'stretch',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemLabel: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
  },
});