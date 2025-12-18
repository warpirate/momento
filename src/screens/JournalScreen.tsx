import AsyncStorage from '@react-native-async-storage/async-storage';
import { withObservables } from '@nozbe/watermelondb/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

import { EntryComposer } from '../components/EntryComposer';
import { EntryPreview, EntryPreviewCard } from '../components/EntryPreviewCard';
import { OnThisDayCard } from '../components/OnThisDayCard';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { sync, setupRealtimeSubscription } from '../lib/sync';
import { supabase, uploadFile } from '../lib/supabaseClient';
import { calculateStreak, isStreakAtRisk } from '../lib/streaks';
import { useTheme } from '../theme/theme';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StreakStatus } from '../components/StreakStatus';
import { StreakProgressModal } from '../components/StreakProgressModal';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSyncContext } from '../lib/SyncContext';
import { useAlert } from '../context/AlertContext';
import { haptics } from '../lib/haptics';
import { NotificationBell } from '../components/NotificationBell';
import { NotificationInbox } from '../components/NotificationInbox';
import { useNotifications } from '../context/NotificationContext';
import { 
  checkStreakNotifications, 
  checkAchievementNotifications, 
  getTotalWords 
} from '../lib/notificationTriggers';
import { 
  shouldSendNotification, 
  markNotificationSent 
} from '../lib/notificationLifecycle';

type JournalScreenProps = {
  userId: string;
  entries: Entry[];
};

function JournalScreen({ userId, entries }: JournalScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing } = useTheme();
  const { showAlert } = useAlert();
  const [draft, setDraft] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showNotificationInbox, setShowNotificationInbox] = useState(false);
  const { createNotification, showToast } = useNotifications();
  const { markHasUnsyncedEntries, isOnline } = useSyncContext();

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
      showAlert('Nothing to save', 'Write something before saving.');
      return;
    }
    setSaving(true);

    try {
      let finalImages = [...images];
      let finalVoiceNote = voiceNote;

      if (isOnline) {
        // Upload images with better error handling
        try {
          const uploadedImages = await Promise.all(
            images.map(async (img, index) => {
              if (!img.startsWith('http')) {
                try {
                  const filename = `${Date.now()}_${index}.jpg`;
                  const path = `${userId}/${filename}`;
                  const uploadedUrl = await uploadFile(img, 'images', path);
                  console.log('Image uploaded successfully:', uploadedUrl);
                  return uploadedUrl;
                } catch (uploadError) {
                  console.error('Failed to upload image:', uploadError);
                  // Return original URI as fallback, will be synced later
                  return img;
                }
              }
              return img;
            })
          );
          finalImages = uploadedImages;
        } catch (e) {
          console.error('Image upload process failed:', e);
          // Fallback to local URIs, will need manual sync later
        }

        // Upload voice note with better error handling
        if (voiceNote && !voiceNote.startsWith('http')) {
          try {
            const filename = `${Date.now()}.m4a`;
            const path = `${userId}/${filename}`;
            const uploadedUrl = await uploadFile(voiceNote, 'voice-notes', path);
            console.log('Voice note uploaded successfully:', uploadedUrl);
            finalVoiceNote = uploadedUrl;
          } catch (e) {
            console.error('Failed to upload voice note:', e);
            // Keep local URI as fallback
          }
        }
      }

      const newEntry = await database.write(async () => {
        return await database.get<Entry>('entries').create(record => {
          record.content = trimmed;
          record.userId = userId;
          if (finalImages.length > 0) record.images = JSON.stringify(finalImages);
          if (finalVoiceNote) record.voiceNote = finalVoiceNote;
        });
      });

      // Mark that we have local changes that need to be synced and analyzed.
      markHasUnsyncedEntries();

      sync().catch(err => console.error('Sync after save failed:', err));

      setDraft('');
      setImages([]);
      setVoiceNote(undefined);
      await AsyncStorage.removeItem(draftKey);
      haptics.success();

      // Check for notification triggers after successful save
      checkNotificationTriggers();
    } catch (error) {
      haptics.error();
      showAlert('Save failed', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Check and trigger notifications based on user activity
  async function checkNotificationTriggers() {
    try {
      const allEntries = await database.get<Entry>('entries').query().fetch();

      // Get previous stats from storage
      const statsKey = `momento:stats:${userId}`;
      const storedStats = await AsyncStorage.getItem(statsKey);
      const previousStats = storedStats ? JSON.parse(storedStats) : {
        streak: 0,
        totalEntries: 0,
        totalWords: 0,
      };

      // Calculate current stats
      const currentStreak = calculateStreak(allEntries.map(e => e.createdAt));
      const totalEntries = allEntries.length;
      const totalWords = getTotalWords(allEntries);

      // Check for streak milestones (with deduplication)
      const streakNotifs = checkStreakNotifications(allEntries, previousStats.streak);
      for (const notif of streakNotifs) {
        if (notif.shouldNotify && notif.type && notif.title && notif.message) {
          const shouldSend = await shouldSendNotification(`streak_${notif.data?.milestone}`, 7 * 24 * 60 * 60 * 1000); // 7 day cooldown
          if (shouldSend) {
            await createNotification(notif.type, notif.title, notif.message, notif.data, false);
            showToast(notif.title, notif.message, 'success');
            await markNotificationSent(`streak_${notif.data?.milestone}`);
          }
        }
      }

      // Check for achievement unlocks (with deduplication)
      const achievementNotifs = checkAchievementNotifications(
        totalEntries,
        currentStreak,
        totalWords,
        previousStats.totalEntries,
        previousStats.streak,
        previousStats.totalWords
      );
      for (const notif of achievementNotifs) {
        if (notif.shouldNotify && notif.type && notif.title && notif.message) {
          const shouldSend = await shouldSendNotification(`achievement_${notif.data?.badgeId}`, 24 * 60 * 60 * 1000); // 24 hour cooldown
          if (shouldSend) {
            await createNotification(notif.type, notif.title, notif.message, notif.data, false);
            showToast(notif.title, notif.message, 'success');
            await markNotificationSent(`achievement_${notif.data?.badgeId}`);
          }
        }
      }


      // Save current stats for next comparison
      await AsyncStorage.setItem(statsKey, JSON.stringify({
        streak: currentStreak,
        totalEntries,
        totalWords,
      }));
    } catch (error) {
      console.error('Error checking notification triggers:', error);
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

  const isAtRisk = useMemo(
    () => isStreakAtRisk(sortedEntries.map(e => e.createdAt)),
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

  // Get a random past entry as inspiration (not from today)
  const pastEntryQuote = useMemo(() => {
    const today = new Date();
    const pastEntries = sortedEntries.filter(entry => {
      const date = entry.createdAt;
      return !(
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    });
    
    if (pastEntries.length === 0) return null;
    
    // Get a random entry
    const randomEntry = pastEntries[Math.floor(Math.random() * pastEntries.length)];
    const daysAgo = Math.floor((today.getTime() - randomEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      content: randomEntry.content.slice(0, 150) + (randomEntry.content.length > 150 ? '...' : ''),
      daysAgo,
      id: randomEntry.id,
    };
  }, [sortedEntries]);


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
              <StreakStatus
                streak={streak}
                isAtRisk={isAtRisk}
                onPress={() => setShowStreakModal(true)}
              />
            )}
            <NotificationBell onPress={() => setShowNotificationInbox(true)} />
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceHighlight,
                },
              ]}
              onPress={() => {
                // Search lives on the root stack, not inside the Main tab navigator
                if (rootNavigation) {
                  rootNavigation.navigate('Search');
                } else {
                  navigation.navigate('Search');
                }
              }}
            >
              <Icon name="search" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <StreakProgressModal
          visible={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          currentStreak={streak}
        />

        <EntryComposer
          value={draft}
          onChangeText={setDraft}
          images={images}
          onImagesChange={setImages}
          voiceNote={voiceNote}
          onVoiceNoteChange={setVoiceNote}
        />

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
            onPress={() => navigation.navigate('EntryDetail', { entryId: onThisDayEntry.id })}
          />
        )}

        {pastEntryQuote && (
          <TouchableOpacity 
            style={[styles.pastEntryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight }]}
            onPress={() => navigation.navigate('EntryDetail', { entryId: pastEntryQuote.id })}
            activeOpacity={0.8}
          >
            <View style={styles.pastEntryHeader}>
              <Icon name="clock" size={14} color={colors.textMuted} />
              <Typography variant="caption" color={colors.textMuted}>
                {pastEntryQuote.daysAgo === 1 ? 'Yesterday' : `${pastEntryQuote.daysAgo} days ago`}
              </Typography>
            </View>
            <Typography
              variant="body"
              color={colors.textSecondary}
              style={{ fontStyle: 'italic' }}
              numberOfLines={3}
            >
              "{pastEntryQuote.content}"
            </Typography>
          </TouchableOpacity>
        )}

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
          <Icon name="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <NotificationInbox
        visible={showNotificationInbox}
        onClose={() => setShowNotificationInbox(false)}
      />
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

  const images = entry.images ? JSON.parse(entry.images) : [];
  const hasVideos = images.some((uri: string) => uri.endsWith('.mp4') || uri.endsWith('.mov'));
  const hasImages = images.some((uri: string) => !uri.endsWith('.mp4') && !uri.endsWith('.mov'));

  const item: EntryPreview = {
    id: entry.id,
    content: entry.content,
    createdAt: formatTimestamp(entry.createdAt),
    tags: tags.length ? tags.slice(0, 2) : undefined,
    hasImages,
    hasVideos,
    hasVoiceNote: !!entry.voiceNote,
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
  iconButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  pastEntryCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pastEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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

export default function JournalScreenWrapper() {
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
