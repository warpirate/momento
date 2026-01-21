import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';
import { calculateStreak } from '../lib/streaks';
import { useSyncContext } from '../lib/SyncContext';

export default function InsightsScreen() {
  console.log('Render InsightsScreen');
  const { colors, spacing, borderRadius } = useTheme();
  const { isOnline, isSyncing, hasUnsyncedEntries } = useSyncContext();
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({});
  const [topActivities, setTopActivities] = useState<{ name: string; count: number }[]>([]);
  const [averageSentiment, setAverageSentiment] = useState(0);
  const [journalStats, setJournalStats] = useState<{
    totalEntries: number;
    entriesThisWeek: number;
    currentStreak: number;
  }>({
    totalEntries: 0,
    entriesThisWeek: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    const fetchInsights = async () => {
      const entries = await database.get<Entry>('entries').query().fetch();

      const moods: Record<string, number> = {};
      entries.forEach(entry => {
        // Manual mood ratings from entries
        if (entry.moodRating) {
          moods[entry.moodRating] = (moods[entry.moodRating] || 0) + 1;
        }
      });

      setMoodCounts(moods);
      // Entry signals have been removed - activities and sentiment no longer available
      setTopActivities([]);
      setAverageSentiment(0);

      // Basic journal stats
      const totalEntries = entries.length;
      const now = new Date();
      const weekAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      );
      const entriesThisWeek = entries.filter(
        e => e.createdAt >= weekAgo && e.createdAt <= now,
      ).length;
      const currentStreak = calculateStreak(entries.map(e => e.createdAt));

      setJournalStats({
        totalEntries,
        entriesThisWeek,
        currentStreak,
      });
    };

    fetchInsights();
  }, []);

  const isInsightsReady = isOnline && !isSyncing && !hasUnsyncedEntries;

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.m }]}>
        <View style={styles.header}>
          <Typography variant="heading">Insights</Typography>
          <Typography variant="body" color={colors.textMuted}>Patterns from your journal</Typography>
        </View>

        {!isInsightsReady && (
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Typography variant="label" color={colors.textMuted}>
                INSIGHTS UNAVAILABLE
              </Typography>
            </View>
            <View style={styles.emptyState}>
              <Typography style={styles.emptyText} color={colors.textMuted}>
                { !isOnline
                  ? 'You are offline. Connect to the internet to sync your journal and generate insights.'
                  : isSyncing
                    ? 'Sync in progress. We are uploading your entries and fetching fresh insights.'
                    : 'You have entries waiting to sync. Tap “Sync” to upload them and unlock insights.'}
              </Typography>
            </View>
          </Card>
        )}

        {isInsightsReady && (
        <>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography variant="label" color={colors.textMuted}>JOURNAL SNAPSHOT</Typography>
          </View>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Typography variant="caption" color={colors.textMuted}>Total entries</Typography>
              <Typography style={[styles.snapshotValue, { color: colors.textPrimary }]}>
                {journalStats.totalEntries}
              </Typography>
            </View>
            <View style={styles.snapshotItem}>
              <Typography variant="caption" color={colors.textMuted}>This week</Typography>
              <Typography style={[styles.snapshotValue, { color: colors.textPrimary }]}>
                {journalStats.entriesThisWeek}
              </Typography>
            </View>
            <View style={styles.snapshotItem}>
              <Typography variant="caption" color={colors.textMuted}>Current streak</Typography>
              <Typography style={[styles.snapshotValue, { color: colors.primary }]}>
                {journalStats.currentStreak}d
              </Typography>
            </View>
          </View>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography variant="label" color={colors.textMuted}>MOOD DISTRIBUTION</Typography>
          </View>
          <View style={styles.moodContainer}>
            {Object.entries(moodCounts).length > 0 ? (
              Object.entries(moodCounts).map(([mood, count]) => {
                const maxCount = Math.max(...Object.values(moodCounts));
                const percentage = (count / maxCount) * 100;
                return (
                  <View key={mood} style={styles.moodItem}>
                    <Typography style={styles.moodLabel}>{mood}</Typography>
                    <View style={styles.barWrapper}>
                      <View style={[styles.barContainer, { backgroundColor: colors.surfaceHighlight }]}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: colors.primary,
                            }
                          ]} 
                        />
                      </View>
                      <Typography style={styles.moodCount}>{count}</Typography>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Typography style={styles.emptyText} color={colors.textMuted}>No mood data yet</Typography>
                <Typography variant="caption" color={colors.textMuted}>Start journaling to see your mood patterns</Typography>
              </View>
            )}
          </View>
        </Card>


        <View style={[styles.row, { gap: spacing.m }]}>
          <Card variant="elevated" style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <Typography variant="label" color={colors.textMuted}>AVG SENTIMENT</Typography>
            </View>
            <View style={styles.statContainer}>
              <Typography style={[styles.statValue, { color: colors.textPrimary }]}>
                {averageSentiment.toFixed(2)}
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>-1.0 to 1.0</Typography>
            </View>
          </Card>
          
          <Card variant="elevated" style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <Typography variant="label" color={colors.textMuted}>TOP ACTIVITY</Typography>
            </View>
            <View style={styles.statContainer}>
              <Typography style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {topActivities[0]?.name || '-'}
              </Typography>
              <Typography variant="caption" color={colors.textMuted}>{topActivities[0]?.count || 0} entries</Typography>
            </View>
          </Card>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography variant="label" color={colors.textMuted}>COMMON ACTIVITIES</Typography>
          </View>
          <View style={styles.activitiesContainer}>
            {topActivities.length > 0 ? (
              topActivities.map((activity, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.activityItem, 
                    { borderBottomColor: colors.surfaceHighlight }
                  ]}
                >
                  <View style={styles.activityInfo}>
                    <Typography variant="body" color={colors.textPrimary}>
                      {activity.name}
                    </Typography>
                    <Typography variant="caption" color={colors.textMuted}>occurrences</Typography>
                  </View>
                  <View style={styles.activityCount}>
                    <Typography variant="label" style={[styles.activityCountText, { color: colors.textPrimary }]}>
                      {activity.count}
                    </Typography>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Typography style={styles.emptyText} color={colors.textMuted}>No activity data yet</Typography>
                <Typography variant="caption" color={colors.textMuted}>Your activities will appear here</Typography>
              </View>
            )}
          </View>
        </Card>
        </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContent: {
    gap: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  card: {
    gap: 20,
    padding: 20,
  },
  cardHeader: {
    paddingBottom: 8,
  },
  halfCard: {
    flex: 1,
    gap: 16,
    padding: 20,
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
  },
  moodContainer: {
    gap: 16,
  },
  moodItem: {
    gap: 12,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  moodCount: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'right',
  },
  statContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 80,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 42,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activitiesContainer: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityCount: {
    alignItems: 'flex-end',
  },
  activityCountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  snapshotItem: {
    flex: 1,
    gap: 4,
  },
  snapshotValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});