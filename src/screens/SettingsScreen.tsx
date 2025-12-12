import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Share, Linking, Platform, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
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
import { UpdateModal } from '../components/ui/UpdateModal';
import { haptics } from '../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appPackage from '../../package.json';

const APP_VERSION = '0.0.7';
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius, themeMode, setThemeMode } = useTheme();
  const { showAlert } = useAlert();
  const { sync, isSyncing, lastSyncAt } = useSyncContext();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ version: '', url: '', message: '' });
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState('');

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showAlert('Error signing out', error.message);
    }
  };

  const handleExportData = async (format: 'json' | 'markdown' = 'json') => {
    try {
      const entries = await database.get<Entry>('entries').query().fetch();
      
      let exportContent: string;
      let title: string;

      if (format === 'markdown') {
        // Export as Markdown
        exportContent = entries
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(entry => {
            const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const time = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `## ${date} at ${time}\n\n${entry.content}\n\n---\n`;
          })
          .join('\n');
        title = 'Momento Journal Export (Markdown)';
      } else {
        // Export as JSON
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
        exportContent = JSON.stringify(data, null, 2);
        title = 'Momento Journal Export (JSON)';
      }
      
      await Share.share({
        message: exportContent,
        title,
      });
      haptics.success();
    } catch (error) {
      haptics.error();
      showAlert('Export failed', (error as Error).message);
    }
  };

  const handleExportChoice = () => {
    showAlert(
      'Export Format',
      'Choose export format for your journal entries',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JSON', onPress: () => handleExportData('json') },
        { text: 'Markdown', onPress: () => handleExportData('markdown') },
      ]
    );
  };

  const handleClearLocalData = () => {
    haptics.warning();
    showAlert(
      'Clear Local Data',
      'This will delete all locally cached data. Your synced data in the cloud will remain safe. You will need to sync again to restore your entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });
              await AsyncStorage.clear();
              haptics.success();
              showAlert('Done', 'Local data cleared. Please restart the app and sync to restore your data.');
            } catch (error) {
              haptics.error();
              showAlert('Error', 'Failed to clear local data.');
            }
          },
        },
      ]
    );
  };

  const handleInstallUpdate = async () => {
    try {
      // Trigger install via native module
      const { ApkInstaller } = NativeModules;
      await ApkInstaller.install(downloadedFilePath);
      
      // Close modal after initiating install
      setShowUpdateModal(false);
      resetUpdateState();
    } catch (error) {
      console.error('Install failed:', error);
      showAlert('Install Failed', 'Could not install the update. Please try again.');
      setShowUpdateModal(false);
      resetUpdateState();
    }
  };

  const resetUpdateState = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
    setShowUpdateModal(false);
    setUpdateInfo({ version: '', url: '', message: '' });
    setShowInstallButton(false);
    setDownloadedFilePath('');
  };

  const downloadAndInstallApk = async (url: string, version: string) => {
    if (Platform.OS !== 'android') {
      showAlert('Unsupported', 'In-app updates are only available on Android.');
      Linking.openURL(url);
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const fileName = `momento-${version}.apk`;
      const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      // Delete old APK if exists
      const exists = await RNFS.exists(destPath);
      if (exists) {
        await RNFS.unlink(destPath);
      }

      const download = RNFS.downloadFile({
        fromUrl: url,
        toFile: destPath,
        progress: (res: { bytesWritten: number; contentLength: number }) => {
          const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
          setDownloadProgress(progress);
        },
        progressDivider: 5,
      });

      const result = await download.promise;

      if (result.statusCode !== 200) {
        throw new Error('Download failed');
      }

      setIsDownloading(false);
      setDownloadedFilePath(destPath);
      setShowInstallButton(true);
      
      // Show completion notification
      showAlert('Download Complete', 'The update has been downloaded successfully and is ready to install.');
    } catch (error) {
      setIsDownloading(false);
      console.error('Update failed:', error);
      showAlert('Update Failed', 'Could not download or install the update. Please try again.');
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

      const updateAvailable = compareVersions(latestVersion, APP_VERSION) > 0;
      const apkAsset = data.assets?.find((asset: { browser_download_url: string }) =>
        asset.browser_download_url.toLowerCase().endsWith('.apk')
      );

      if (updateAvailable) {
        if (Platform.OS === 'android' && apkAsset?.browser_download_url) {
          setUpdateInfo({
            version: latestVersion,
            url: apkAsset.browser_download_url,
            message: `A new version (${latestVersion}) is available with improvements and bug fixes.`
          });
          setShowUpdateModal(true);
          // Auto-start download for seamless experience
          downloadAndInstallApk(apkAsset.browser_download_url, latestVersion);
        } else {
          showAlert(
            'Update Available',
            `A new version (${latestVersion}) is available.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Download', onPress: () => Linking.openURL(data.html_url) }
            ]
          );
        }
        return;
      }

      showAlert('Up to date', 'You are using the latest version of Momento.');
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
          <SettingItem label="Notifications" onPress={() => navigation.navigate('NotificationSettings')} />
          <SettingItem label="Send Feedback" onPress={() => navigation.navigate('Feedback')} />
          <SettingItem label="Previous Feedback" onPress={() => navigation.navigate('PreviousFeedback')} />
          <SettingItem label="Privacy" onPress={() => showAlert('Coming soon', 'This feature is under development.')} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>DATA</Typography>
          <SettingItem label="Export Data" onPress={handleExportChoice} value="JSON or Markdown format" />
          <SettingItem label="Clear Local Data" onPress={handleClearLocalData} value="Reset local cache (cloud data preserved)" />
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

      {/* Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        title="App Update Available"
        message={updateInfo.message}
        progress={downloadProgress}
        isDownloading={isDownloading}
        showInstallButton={showInstallButton}
        onCancel={() => {
          if (!isDownloading) {
            resetUpdateState();
          }
        }}
        onInstall={handleInstallUpdate}
      />
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