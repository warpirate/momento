import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { withObservables } from '@nozbe/watermelondb/react';
import { sync } from '../lib/sync';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';

type EntryDetailRouteProp = RouteProp<RootStackParamList, 'EntryDetail'>;

function EntryDetailScreen({ entry, signals }: { entry: Entry; signals: any[] }) {
  console.log('Render EntryDetailScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();
  const [deleting, setDeleting] = useState(false);

  if (!entry) {
    return (
      <ScreenLayout>
        <ActivityIndicator color={colors.primary} />
      </ScreenLayout>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await database.write(async () => {
                await entry.markAsDeleted();
              });
              await sync();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const latestSignal = signals.length > 0 ? signals[0] : null;

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m, borderBottomColor: colors.surfaceHighlight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Typography color={colors.primary}>← Back</Typography>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          <Typography color={colors.error}>Delete</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.contentContainer, { padding: spacing.m }]}>
        <Typography variant="heading" style={styles.date}>
          {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
        <Typography variant="body" color={colors.textMuted} style={styles.time}>
          {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        
        {latestSignal && (
          <View style={styles.signalsContainer}>
            {latestSignal.mood && (
              <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
                <Typography variant="label" color={colors.primary}>Mood: {latestSignal.mood}</Typography>
              </View>
            )}
            {latestSignal.sentimentScore !== undefined && (
              <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
                <Typography variant="label" color={colors.primary}>Sentiment: {latestSignal.sentimentScore.toFixed(1)}</Typography>
              </View>
            )}
          </View>
        )}

        <Typography variant="body" style={styles.content}>{entry.content}</Typography>

        {latestSignal && (
          <Card style={styles.analysisSection}>
            <Typography variant="subheading" style={styles.sectionTitle}>AI Analysis</Typography>
            
            {latestSignal.activities?.length > 0 && (
              <View style={styles.metaGroup}>
                <Typography variant="label" color={colors.textMuted}>Activities</Typography>
                <View style={styles.tagsRow}>
                  {latestSignal.activities.map((activity: string, index: number) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.surfaceHighlight }]}>
                      <Typography variant="caption">{activity}</Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {latestSignal.people?.length > 0 && (
              <View style={styles.metaGroup}>
                <Typography variant="label" color={colors.textMuted}>People</Typography>
                <View style={styles.tagsRow}>
                  {latestSignal.people.map((person: string, index: number) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.surfaceHighlight }]}>
                      <Typography variant="caption">{person}</Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  date: {
    marginBottom: 4,
  },
  time: {
    marginBottom: 20,
  },
  content: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 30,
  },
  signalsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  analysisSection: {
    padding: 20,
    gap: 16,
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  metaGroup: {
    gap: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

const enhance = withObservables(['route'], ({ route }: { route: EntryDetailRouteProp }) => ({
  entry: database.get<Entry>('entries').findAndObserve(route.params.entryId),
}));

const EnhancedEntryDetailScreen = enhance(({ entry }: { entry: Entry }) => {
    const EnhancedInner = withObservables(['entry'], ({ entry }) => ({
        entry,
        signals: entry.signals,
    }))(EntryDetailScreen);
    
    return <EnhancedInner entry={entry} />;
});

export default EnhancedEntryDetailScreen;