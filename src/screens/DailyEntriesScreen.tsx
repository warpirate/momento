import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';

type DailyEntriesRouteProp = RouteProp<RootStackParamList, 'DailyEntries'>;
type DailyEntriesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyEntries'>;

export default function DailyEntriesScreen() {
  const navigation = useNavigation<DailyEntriesNavigationProp>();
  const route = useRoute<DailyEntriesRouteProp>();
  const { colors, spacing, borderRadius } = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const { date } = route.params;

  const getEntryMediaInfo = (entry: Entry) => {
    const images = entry.images ? JSON.parse(entry.images) : [];
    const hasVideos = images.some((uri: string) => uri.endsWith('.mp4') || uri.endsWith('.mov'));
    const hasImages = images.some((uri: string) => !uri.endsWith('.mp4') && !uri.endsWith('.mov'));
    
    return {
      hasImages,
      hasVideos,
      hasVoiceNote: !!entry.voiceNote,
    };
  };

  useEffect(() => {
    const fetchEntries = async () => {
      const allEntries = await database.get<Entry>('entries').query().fetch();
      const filteredEntries = allEntries
        .filter(entry => {
          const entryDate = entry.createdAt;
          // Show entries even if date is invalid - don't filter them out completely
          if (!entryDate || isNaN(entryDate.getTime())) return false;
          const targetDate = new Date(date);
          return (
            entryDate.getDate() === targetDate.getDate() &&
            entryDate.getMonth() === targetDate.getMonth() &&
            entryDate.getFullYear() === targetDate.getFullYear()
          );
        })
        .sort(
          (a, b) => {
            const aTime = a.createdAt && !isNaN(a.createdAt.getTime()) ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt && !isNaN(b.createdAt.getTime()) ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          },
        );
      setEntries(filteredEntries);
    };
    fetchEntries();
  }, [date]);

  const renderEntry = ({ item }: { item: Entry }) => {
    const mediaInfo = getEntryMediaInfo(item);
    return (
      <TouchableOpacity 
        style={[styles.entryItem, { borderBottomColor: colors.surfaceHighlight }]}
        onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
      >
        <Typography style={styles.entryTime} color={colors.primary}>
          {item.createdAt && !isNaN(item.createdAt.getTime()) && item.createdAt.getTime() !== 0
            ? item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Invalid date'}
        </Typography>
        <View style={styles.entryContent}>
          <Typography style={styles.entryPreview} numberOfLines={3}>
            {item.content}
          </Typography>
          <View style={styles.mediaIndicators}>
            {mediaInfo.hasVoiceNote && (
              <Icon name="mic" size={14} color={colors.textMuted} />
            )}
            {mediaInfo.hasVideos && (
              <Icon name="video" size={14} color={colors.textMuted} />
            )}
            {mediaInfo.hasImages && (
              <Icon name="image" size={14} color={colors.textMuted} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="subheading">
          {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.entriesContainer, { backgroundColor: colors.surface, margin: spacing.m, borderRadius: borderRadius.l, padding: spacing.m }]}>
        {entries.length > 0 ? (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.entriesList}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Typography style={styles.emptyText} color={colors.textMuted}>
              No entries for this day
            </Typography>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entriesContainer: {
    flex: 1,
  },
  entriesList: {
    paddingBottom: 20,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  entryTime: {
    fontSize: 14,
    width: 60,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryPreview: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  mediaIndicators: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
  },
});
