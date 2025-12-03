import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useTheme } from '../theme/theme';

export default function SettingsScreen() {
  console.log('Render SettingsScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius, themeMode, setThemeMode } = useTheme();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error signing out', error.message);
    }
  };

  const SettingItem = ({ label, onPress, destructive = false }: { label: string; onPress: () => void; destructive?: boolean }) => (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: colors.surfaceHighlight }]} 
      onPress={onPress}
    >
      <Typography 
        style={styles.itemLabel} 
        color={destructive ? colors.error : colors.textPrimary}
      >
        {label}
      </Typography>
      <Typography style={styles.chevron} color={colors.textMuted}>›</Typography>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Typography color={colors.primary}>← Back</Typography>
        </TouchableOpacity>
        <Logo size="small" />
        <Typography variant="heading">Settings</Typography>
      </View>

      <ScrollView style={[styles.content, { padding: spacing.m }]}>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>ACCOUNT</Typography>
          <SettingItem label="Profile" onPress={() => navigation.navigate('Profile')} />
          <SettingItem label="Notifications" onPress={() => Alert.alert('Coming soon')} />
          <SettingItem label="Privacy" onPress={() => Alert.alert('Coming soon')} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionTitle}>DATA</Typography>
          <SettingItem label="Export Data" onPress={() => Alert.alert('Coming soon')} />
          <SettingItem label="Sync Now" onPress={() => Alert.alert('Syncing...')} />
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
          <SettingItem label="About Momento" onPress={() => Alert.alert('Momento v0.0.1')} />
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