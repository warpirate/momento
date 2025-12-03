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
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { JOURNAL_QUOTES } from '../content/quotes';
import { useSyncContext } from '../lib/SyncContext';

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
  const { markHasUnsyncedEntries } = useSyncContext();

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

      // Mark that we have local changes that need to be synced and analyzed.
      markHasUnsyncedEntries();

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

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    [entries],
  );

  const showEmpty = sortedEntries.length === 0;
  const streak = useMemo(
    () => calculateStreak(sortedEntries.map(e => e.createdAt)),
    [sortedEntries],
  );

  const onThisDayEntry = useMemo(() => {
    const today = new Date();
    return sortedEntries.find(entry => {
      const date = entry.createdAt;
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() !== today.getFullYear()
      );
    });
  }, [sortedEntries]);

  const quote = useMemo(
    () => JOURNAL_QUOTES[Math.floor(Math.random() * JOURNAL_QUOTES.length)],
    [],
  );

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
              <View
                style={[
                  styles.streakBadge,
                  {
                    backgroundColor: colors.secondary + '20',
                    borderColor: colors.secondary,
                  },
                ]}
              >
                <MaterialCommunityIcon
                  name="fire"
                  size={14}
                  color={colors.error}
                />
                <Typography
                  variant="label"
                  color={colors.secondary}
                  style={{ marginLeft: 4 }}
                >
                  {streak}
                </Typography>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.settingsButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceHighlight,
                },
              ]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={18} color={colors.textPrimary} />
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
            yearsAgo={
              new Date().getFullYear() - onThisDayEntry.createdAt.getFullYear()
            }
          />
        )}

        <View style={styles.quoteCard}>
          <Typography
            variant="body"
            align="center"
            style={{ marginBottom: 8 }}
          >
            “{quote.text}”
          </Typography>
          <Typography variant="caption" align="center">
            — {quote.author}
          </Typography>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.recentEntriesButton,
            {
              borderColor: colors.primary,
            },
          ]}
          onPress={() => navigation.navigate('RecentEntries')}
        >
          <Typography variant="subheading" color={colors.primary}>
            Recent entries
          </Typography>
          <Typography variant="subheading" color={colors.primary}>
            →
          </Typography>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  quoteCard: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 24,
  },
  recentEntriesButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
