import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {EntryComposer} from '../components/EntryComposer';
import {EntryPreview, EntryPreviewCard} from '../components/EntryPreviewCard';
import {supabase} from '../lib/supabaseClient';

type JournalScreenProps = {
  userId: string;
};

type EntryRow = {
  id: string;
  content: string;
  created_at: string;
  entry_signals: {
    mood?: string;
    activities?: string[];
    people?: string[];
  }[];
};

export function JournalScreen({userId}: JournalScreenProps) {
  const [draft, setDraft] = useState('');
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    let isMounted = true;
    async function loadEntries() {
      setLoading(true);
      const {data, error} = await supabase
        .from('entries')
        .select('id, content, created_at, entry_signals(mood, activities, people)')
        .order('created_at', {ascending: false})
        .limit(20);

      if (error) {
        if (isMounted) {
          Alert.alert('Error fetching entries', error.message);
          setLoading(false);
        }
        return;
      }

      if (isMounted && data) {
        setEntries(data.map(transformEntry));
        setLoading(false);
      }
    }
    loadEntries();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function refresh() {
    setRefreshing(true);
    const {data, error} = await supabase
      .from('entries')
      .select('id, content, created_at, entry_signals(mood, activities, people)')
      .order('created_at', {ascending: false})
      .limit(20);
    if (error) {
      Alert.alert('Refresh failed', error.message);
    } else if (data) {
      setEntries(data.map(transformEntry));
    }
    setRefreshing(false);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('Nothing to save', 'Write something before saving.');
      return;
    }
    setSaving(true);
    const {data, error} = await supabase
      .from('entries')
      .insert({content: trimmed, user_id: userId})
      .select('id, content, created_at, entry_signals(mood, activities, people)')
      .single();

    if (error) {
      Alert.alert('Save failed', error.message);
      setSaving(false);
      return;
    }

    setEntries(prev => [transformEntry(data as EntryRow), ...prev]);
    setDraft('');
    await AsyncStorage.removeItem(draftKey);
    setSaving(false);
  }

  const emptyState = useMemo(
    () => ({
      title: 'Your private field notes',
      subtitle:
        'Write naturally. We’ll quietly catch patterns around sleep, mood, energy, and the people shaping your days.',
    }),
    [],
  );

  const showEmpty = !loading && entries.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Momento</Text>
        <Text style={styles.subheading}>Journal first. Insights later.</Text>
        <EntryComposer value={draft} onChangeText={setDraft} />

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.primaryButtonLabel}>{saving ? 'Saving…' : 'Save entry'}</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent entries</Text>
          <Text style={styles.sectionMeta}>Auto-tagged · Private by default</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#A4BCFD" />
        ) : showEmpty ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{emptyState.title}</Text>
            <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={refresh}
            renderItem={({item}) => <EntryPreviewCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function transformEntry(row: EntryRow): EntryPreview {
  const latestSignal = row.entry_signals?.[0];
  const tags: string[] = [];
  if (latestSignal?.mood) {
    tags.push(latestSignal.mood);
  }
  if (Array.isArray(latestSignal?.activities)) {
    tags.push(...latestSignal.activities.slice(0, 2));
  }
  return {
    id: row.id,
    content: row.content,
    createdAt: formatTimestamp(row.created_at),
    tags: tags.length ? tags.slice(0, 2) : undefined,
  };
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today · ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday · ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  heading: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
  },
  subheading: {
    color: '#98A2B3',
    fontSize: 16,
  },
  sectionHeader: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#E4E7EC',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionMeta: {
    color: '#98A2B3',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#101828',
    borderWidth: 1,
    borderColor: '#1F2933',
    gap: 8,
  },
  emptyTitle: {
    color: '#E4E7EC',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#98A2B3',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default JournalScreen;

