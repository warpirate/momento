import AsyncStorage from '@react-native-async-storage/async-storage';
import { withObservables } from '@nozbe/watermelondb/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

import { EntryComposer } from '../components/EntryComposer';
import { EntryPreview, EntryPreviewCard } from '../components/EntryPreviewCard';
import { OnThisDayCard } from '../components/OnThisDayCard';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { sync, setupRealtimeSubscription } from '../lib/sync';
import { supabase } from '../lib/supabaseClient';
import { calculateStreak } from '../lib/streaks';
import { useTheme } from '../theme/theme';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type JournalScreenProps = {
  userId: string;
  entries: Entry[];
};

function JournalScreen({ userId, entries }: JournalScreenProps) {
  console.log('Render JournalScreen with entries:', entries.length);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing } = useTheme();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);

  const draftKey = useMemo(() => `momento:draft:${userId}`, [userId]);

  useEffect(() => {
    AsyncStorage.getItem(draftKey).then(value => {
      if (value) {
        setDraft(value);
      }
    });
  }, [draftKey]);

  useEffect(() => {
    AsyncStorage.setItem(draftKey, draft);
  }, [draft, draftKey]);

  useEffect(() => {
    if (!syncInitialized && userId) {
      setSyncInitialized(true);
      sync().catch(err => console.warn('Initial sync failed:', err));
      const unsubscribe = setupRealtimeSubscription(userId);
      return () => {
        unsubscribe();
      };
    }
  }, [userId, syncInitialized]);

  async function refresh() {
    setRefreshing(true);
    try {
      await sync();
    } catch (error) {
      console.warn('Manual sync failed:', error);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('Nothing to save', 'Write something before saving.');
      return;
    }
    setSaving(true);

    try {
      const newEntry = await database.write(async () => {
        return await database.get<Entry>('entries').create(entry => {
          entry.content = trimmed;
          entry.userId = userId;
        });
      });

      sync().then(() => {
        supabase.functions.invoke('analyze-entry', {
          body: { record: { id: newEntry.id, content: newEntry.content } },
        }).then(() => sync());
      });

      setDraft('');
      await AsyncStorage.removeItem(draftKey);
    } catch (error) {
      Alert.alert('Save failed', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const emptyState = useMemo(
    () => ({
      title: 'Your private field notes',
      subtitle:
        'Write naturally. We’ll quietly catch patterns around sleep, mood, energy, and the people shaping your days.',
    }),
    [],
  );

  const showEmpty = entries.length === 0;
  const streak = useMemo(() => calculateStreak(entries.map(e => e.createdAt)), [entries]);

  const onThisDayEntry = useMemo(() => {
    const today = new Date();
    return entries.find(entry => {
      const date = entry.createdAt;
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() !== today.getFullYear()
      );
    });
  }, [entries]);

  return (
    <ScreenLayout>
      <View style={[styles.container, { padding: spacing.m }]}>
        <View style={styles.headerRow}>
          <View>
            <Typography variant="heading">Momento</Typography>
            <Typography variant="body">Journal first. Insights later.</Typography>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}>
                <Typography variant="label" color={colors.secondary}>🔥 {streak}</Typography>
              </View>
            )}
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Typography variant="body">⚙️</Typography>
            </TouchableOpacity>
          </View>
        </View>
        
        <EntryComposer value={draft} onChangeText={setDraft} />

        <Button 
          title={saving ? 'Saving…' : 'Save entry'} 
          onPress={handleSave} 
          loading={saving}
          disabled={saving}
          style={{ marginTop: spacing.m }}
        />

        {onThisDayEntry && (
          <OnThisDayCard
            entry={onThisDayEntry}
            yearsAgo={new Date().getFullYear() - onThisDayEntry.createdAt.getFullYear()}
          />
        )}

        <View style={[styles.sectionHeader, { marginTop: spacing.l }]}>
          <Typography variant="subheading">Recent entries</Typography>
          <Typography variant="caption">Auto-tagged · Private by default</Typography>
        </View>

        {showEmpty ? (
          <Card style={styles.emptyCard} padding="large">
            <Typography variant="subheading" style={{ marginBottom: 8 }}>{emptyState.title}</Typography>
            <Typography variant="body">{emptyState.subtitle}</Typography>
          </Card>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xl }]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={refresh}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}>
                <EnhancedEntryPreviewCard entry={item} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const EnhancedEntryPreviewCard = withObservables(['entry'], ({ entry }: { entry: Entry }) => ({
  entry,
  signals: entry.signals,
}))(({ entry, signals }: { entry: Entry; signals: any[] }) => {
  
  const latestSignal = signals.length > 0 ? signals[0] : null;
  const tags: string[] = [];
  if (latestSignal?.mood) tags.push(latestSignal.mood);
  if (Array.isArray(latestSignal?.activities)) tags.push(...latestSignal.activities.slice(0, 2));

  const item: EntryPreview = {
    id: entry.id,
    content: entry.content,
    createdAt: formatTimestamp(entry.createdAt),
    tags: tags.length ? tags.slice(0, 2) : undefined,
  };

  return <EntryPreviewCard item={item} />;
});


function formatTimestamp(date: Date) {
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  listContent: {
    gap: 12,
  },
  emptyCard: {
    marginTop: 20,
  },
});

const enhance = withObservables(['userId'], ({ userId }) => ({
  entries: database.get<Entry>('entries').query().observe(),
}));

import { Session } from '@supabase/supabase-js';

export default function JournalScreenWrapper() {
  console.log('Render JournalScreenWrapper');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  if (!session?.user) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;

  const EnhancedJournalScreen = enhance(JournalScreen);
  return <EnhancedJournalScreen userId={session.user.id} />;
}
