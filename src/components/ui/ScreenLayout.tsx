import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ViewStyle, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/theme';
import { ThemeTransitionWrapper } from './ThemeTransitionWrapper';
import { useSyncContext } from '../../lib/SyncContext';

type ScreenLayoutProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function ScreenLayout({ children, style }: ScreenLayoutProps) {
  const { colors, isDark } = useTheme();
  const { isOnline, isSyncing, showSyncPrompt, showSyncSuccess, sync } = useSyncContext();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ThemeTransitionWrapper>
        <View style={styles.content}>
          {!isOnline && (
            <View style={[styles.banner, { backgroundColor: colors.surface }]}>
              <View>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Offline mode</Text>
                <Text style={[styles.bannerSubtitle, { color: colors.textMuted }]}>
                  New entries will sync when you're back online.
                </Text>
              </View>
            </View>
          )}

          {isOnline && showSyncPrompt && !isSyncing && (
            <View style={[styles.banner, { backgroundColor: colors.surface }]}>
              <View>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Unsynced entries</Text>
                <Text style={[styles.bannerSubtitle, { color: colors.textMuted }]}>
                  Sync to generate fresh insights.
                </Text>
              </View>
              <TouchableOpacity style={[styles.syncButton, { backgroundColor: colors.primary }]} onPress={sync}>
                <Text style={styles.syncButtonText}>Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {children}

          {showSyncSuccess && (
            <View style={styles.syncSuccessOverlay} pointerEvents="none">
              <View style={[styles.syncSuccessCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.syncSuccessTitle, { color: colors.primary }]}>Synced</Text>
                <Text style={[styles.syncSuccessSubtitle, { color: colors.textMuted }]}>
                  Your entries are safely backed up and insights are updating.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ThemeTransitionWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  syncSuccessOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncSuccessCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  syncSuccessTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  syncSuccessSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});