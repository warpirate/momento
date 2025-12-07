import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';

import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../theme/theme';
import { database } from '../db';
import Entry from '../db/model/Entry';
import EntrySignal from '../db/model/EntrySignal';
import { EntryPreview, EntryPreviewCard } from '../components/EntryPreviewCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type RecentEntriesProps = {
  entries: Entry[];
};

function RecentEntriesScreenBase({ entries }: RecentEntriesProps) {
  const { spacing } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    [entries],
  );

  return (
    <ScreenLayout>
      <View style={[styles.container, { padding: spacing.m }]}>
        <Typography variant="heading">Recent entries</Typography>
        <Typography variant="caption">
          Auto-tagged · Private by default
        </Typography>

        <FlatList
          data={sortedEntries}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xl }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EnhancedEntryItem
              entry={item}
              onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
            />
          )}
        />
      </View>
    </ScreenLayout>
  );
}

// Enhanced entry item that observes signals
type EntryItemProps = {
  entry: Entry;
  signals: EntrySignal[];
  onPress: () => void;
};

function EntryItem({ entry, signals, onPress }: EntryItemProps) {
  const latestSignal = signals.length > 0 ? signals[0] : null;
  
  const preview: EntryPreview = {
    id: entry.id,
    content: entry.content,
    createdAt: entry.createdAt.toLocaleString(),
    hasImages: !!entry.images && JSON.parse(entry.images).length > 0,
    hasVoiceNote: !!entry.voiceNote,
    aiMood: latestSignal?.mood,
    aiTags: latestSignal?.tags,
    sentimentScore: latestSignal?.sentimentScore,
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <EntryPreviewCard item={preview} />
    </TouchableOpacity>
  );
}

const EnhancedEntryItem = withObservables(['entry'], ({ entry }: { entry: Entry; onPress: () => void }) => ({
  entry,
  signals: entry.signals,
}))(EntryItem);

const enhance = withObservables([], () => ({
  entries: database.get<Entry>('entries').query().observe(),
}));

const EnhancedRecentEntriesScreen = enhance(RecentEntriesScreenBase);

export default function RecentEntriesScreen() {
  if (!database) {
    return <ActivityIndicator />;
  }

  return <EnhancedRecentEntriesScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  listContent: {
    marginTop: 16,
    gap: 8,
  },
});



