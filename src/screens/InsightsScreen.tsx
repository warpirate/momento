import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { database } from '../db';
import EntrySignal from '../db/model/EntrySignal';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';

export default function InsightsScreen() {
  console.log('Render InsightsScreen');
  const { colors, spacing, borderRadius } = useTheme();
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({});
  const [topActivities, setTopActivities] = useState<{ name: string; count: number }[]>([]);
  const [averageSentiment, setAverageSentiment] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      const signals = await database.get<EntrySignal>('entry_signals').query().fetch();
      
      const moods: Record<string, number> = {};
      const activities: Record<string, number> = {};
      let totalSentiment = 0;
      let sentimentCount = 0;

      signals.forEach(signal => {
        // Moods
        if (signal.mood) {
          moods[signal.mood] = (moods[signal.mood] || 0) + 1;
        }

        // Activities
        if (Array.isArray(signal.activities)) {
          signal.activities.forEach(activity => {
            activities[activity] = (activities[activity] || 0) + 1;
          });
        }

        // Sentiment
        if (signal.sentimentScore !== undefined) {
          totalSentiment += signal.sentimentScore;
          sentimentCount++;
        }
      });

      setMoodCounts(moods);
      setTopActivities(
        Object.entries(activities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      );
      setAverageSentiment(sentimentCount > 0 ? totalSentiment / sentimentCount : 0);
    };

    fetchInsights();
  }, []);

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.m }]}>
        <View style={styles.header}>
          <Typography variant="heading">Insights</Typography>
          <Typography variant="body">Patterns from your journal</Typography>
        </View>

        <Card style={styles.card}>
          <Typography variant="label" color={colors.textMuted} style={styles.cardTitle}>MOOD DISTRIBUTION</Typography>
          <View style={styles.moodContainer}>
            {Object.entries(moodCounts).length > 0 ? (
              Object.entries(moodCounts).map(([mood, count]) => (
                <View key={mood} style={styles.moodItem}>
                  <Typography style={styles.moodLabel}>{mood}</Typography>
                  <View style={[styles.barContainer, { backgroundColor: colors.surfaceHighlight }]}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          width: `${(count / Math.max(...Object.values(moodCounts))) * 100}%`,
                          backgroundColor: colors.primary,
                          borderRadius: borderRadius.s
                        }
                      ]} 
                    />
                  </View>
                  <Typography style={styles.moodCount} color={colors.textMuted}>{count}</Typography>
                </View>
              ))
            ) : (
              <Typography style={styles.emptyText} color={colors.textMuted}>No mood data yet</Typography>
            )}
          </View>
        </Card>

        <View style={[styles.row, { gap: spacing.m }]}>
          <Card style={styles.halfCard}>
            <Typography variant="label" color={colors.textMuted} style={styles.cardTitle}>AVG SENTIMENT</Typography>
            <View style={styles.statContainer}>
              <Typography style={styles.statValue} color={colors.primaryLight}>{averageSentiment.toFixed(1)}</Typography>
              <Typography variant="caption">-1.0 to 1.0</Typography>
            </View>
          </Card>
          
          <Card style={styles.halfCard}>
            <Typography variant="label" color={colors.textMuted} style={styles.cardTitle}>TOP ACTIVITY</Typography>
            <View style={styles.statContainer}>
              <Typography style={styles.statValue} color={colors.primaryLight} numberOfLines={1}>
                {topActivities[0]?.name || '-'}
              </Typography>
              <Typography variant="caption">{topActivities[0]?.count || 0} entries</Typography>
            </View>
          </Card>
        </View>

        <Card style={styles.card}>
          <Typography variant="label" color={colors.textMuted} style={styles.cardTitle}>COMMON ACTIVITIES</Typography>
          <View style={styles.activitiesContainer}>
            {topActivities.length > 0 ? (
              topActivities.map((activity, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.activityItem, 
                    { borderBottomColor: colors.surfaceHighlight, borderBottomWidth: index === topActivities.length - 1 ? 0 : 1 }
                  ]}
                >
                  <Typography variant="body">{activity.name}</Typography>
                  <Typography variant="label" color={colors.primaryLight}>{activity.count}</Typography>
                </View>
              ))
            ) : (
              <Typography style={styles.emptyText} color={colors.textMuted}>No activity data yet</Typography>
            )}
          </View>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 20,
  },
  header: {
    marginBottom: 10,
  },
  card: {
    gap: 16,
  },
  halfCard: {
    flex: 1,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
  },
  cardTitle: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  moodContainer: {
    gap: 12,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodLabel: {
    width: 80,
    fontSize: 14,
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  moodCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 14,
  },
  statContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  activitiesContainer: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});