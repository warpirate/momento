import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';

import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../theme/theme';
import { database } from '../db';
import Entry from '../db/model/Entry';
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
          renderItem={({ item }) => {
            const preview: EntryPreview = {
              id: item.id,
              content: item.content,
              createdAt: item.createdAt.toLocaleString(),
            };

            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EntryDetail', { entryId: item.id })
                }
                activeOpacity={0.7}
              >
                <EntryPreviewCard item={preview} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScreenLayout>
  );
}

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



