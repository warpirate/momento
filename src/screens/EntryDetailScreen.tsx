import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { withObservables } from '@nozbe/watermelondb/react';
import { sync } from '../lib/sync';
import { supabase } from '../lib/supabaseClient';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/Feather';
import { useAlert } from '../context/AlertContext';
import { haptics } from '../lib/haptics';

type EntryDetailRouteProp = RouteProp<RootStackParamList, 'EntryDetail'>;

function EntryDetailScreen({ entry, signals }: { entry: Entry; signals: any[] }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();
  const { showAlert } = useAlert();
  const [deleting, setDeleting] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'failed' | 'success'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');

  // Pulsing animation for analyzing state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const entryAge = Date.now() - new Date(entry.createdAt).getTime();
    const hasSignals = signals.length > 0;
    
    if (hasSignals) {
      setAnalysisStatus('success');
    } else if (entryAge < 120000) {
      // Less than 2 minutes old - still analyzing
      setAnalysisStatus('analyzing');
    } else {
      // Older than 2 minutes with no signals - likely failed
      setAnalysisStatus('failed');
    }
  }, [signals.length, entry.createdAt]);

  // Pulse animation for analyzing state
  useEffect(() => {
    if (analysisStatus === 'analyzing') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [analysisStatus, pulseAnim]);

  // Retry AI analysis
  const handleRetryAnalysis = async () => {
    setIsRetrying(true);
    setAnalysisStatus('analyzing');
    try {
      await supabase.functions.invoke('analyze-entry', {
        body: { record: { id: entry.id, content: entry.content } },
      });
      // Sync to pull the new signals
      await sync();
    } catch (error) {
      console.error('Retry analysis failed:', error);
      setAnalysisStatus('failed');
      showAlert('Analysis Failed', 'Could not analyze this entry. Please check your connection and try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const onStartPlay = async () => {
    if (!entry.voiceNote) return;
    console.log('onStartPlay');
    const msg = await audioRecorderPlayer.startPlayer(entry.voiceNote);
    console.log(msg);
    audioRecorderPlayer.addPlayBackListener((e) => {
      // Format time as mm:ss
      const rawPlayTime = audioRecorderPlayer.mmss(Math.floor(e.currentPosition / 1000));
      const playParts = rawPlayTime.split(':');
      if (playParts.length >= 2) {
        setPlayTime(`${playParts[0]}:${playParts[1]}`);
      } else {
        setPlayTime(rawPlayTime);
      }

      const rawDuration = audioRecorderPlayer.mmss(Math.floor(e.duration / 1000));
      const durationParts = rawDuration.split(':');
      if (durationParts.length >= 2) {
        setDuration(`${durationParts[0]}:${durationParts[1]}`);
      } else {
        setDuration(rawDuration);
      }

      if (e.currentPosition === e.duration) {
        console.log('finished');
        audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
      }
      return;
    });
    setIsPlaying(true);
  };

  const onPausePlay = async () => {
    await audioRecorderPlayer.pausePlayer();
    setIsPlaying(false);
  };

  if (!entry) {
    return (
      <ScreenLayout>
        <ActivityIndicator color={colors.primary} />
      </ScreenLayout>
    );
  }

  const handleDelete = () => {
    haptics.warning();
    showAlert(
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
              haptics.success();
              navigation.goBack();
            } catch (error) {
              haptics.error();
              showAlert('Error', 'Failed to delete entry');
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
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditEntry', { entryId: entry.id })}>
            <Typography color={colors.primary}>Edit</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} disabled={deleting}>
            <Typography color={colors.error}>Delete</Typography>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={[styles.contentContainer, { padding: spacing.m }]}>
        <Typography variant="heading" style={styles.date}>
          {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
        <Typography variant="body" color={colors.textMuted} style={styles.time}>
          {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>

        <View style={styles.signalsContainer}>
          {/* User Ratings */}
          {entry.moodRating && (
            <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
              <Typography variant="label" color={colors.primary}>Mood: {entry.moodRating}</Typography>
            </View>
          )}
          {entry.energyRating !== undefined && (
            <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
              <Typography variant="label" color={colors.primary}>Energy: {entry.energyRating}/10</Typography>
            </View>
          )}
          {entry.sleepRating !== undefined && (
            <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
              <Typography variant="label" color={colors.primary}>Sleep: {entry.sleepRating}/10</Typography>
            </View>
          )}

          {/* AI Signals */}
          {latestSignal && (
            <>
              {latestSignal.mood && !entry.moodRating && (
                <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
                  <Typography variant="label" color={colors.primary}>AI Mood: {latestSignal.mood}</Typography>
                </View>
              )}
              {latestSignal.sentimentScore !== undefined && (
                <View style={[styles.signalBadge, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '50' }]}>
                  <Typography variant="label" color={colors.primary}>Sentiment: {latestSignal.sentimentScore.toFixed(1)}</Typography>
                </View>
              )}
            </>
          )}
        </View>

        <Typography variant="body" style={styles.content}>{entry.content}</Typography>

        {entry.images && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {JSON.parse(entry.images).map((uri: string, index: number) => (
              <Image key={index} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        {entry.voiceNote && (
          <View style={[styles.voiceNoteContainer, { backgroundColor: colors.surfaceHighlight, borderRadius: borderRadius.m }]}>
            <TouchableOpacity onPress={isPlaying ? onPausePlay : onStartPlay}>
              <Icon name={isPlaying ? "pause" : "play"} size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <Typography variant="body" style={{ fontWeight: 'bold' }}>Voice Note</Typography>
              <Typography variant="caption" color={colors.textMuted}>
                {isPlaying ? `${playTime} / ${duration}` : 'Tap to play'}
              </Typography>
            </View>
          </View>
        )}

        {(latestSignal || analysisStatus !== 'idle') && (
          <Card style={styles.analysisSection}>
            <View style={styles.analysisTitleRow}>
              <View style={styles.analysisTitleLeft}>
                <Icon name="cpu" size={18} color={colors.primary} />
                <Typography variant="subheading" style={styles.sectionTitle}>AI Analysis</Typography>
              </View>
              {analysisStatus === 'analyzing' && (
                <Animated.View style={{ opacity: pulseAnim }}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Typography variant="caption" color={colors.primary} style={{ marginLeft: 6 }}>Analyzing...</Typography>
                  </View>
                </Animated.View>
              )}
              {analysisStatus === 'success' && latestSignal && (
                <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                  <Icon name="check-circle" size={14} color="#10b981" />
                  <Typography variant="caption" color="#10b981" style={{ marginLeft: 4 }}>Complete</Typography>
                </View>
              )}
              {analysisStatus === 'failed' && (
                <View style={[styles.statusBadge, { backgroundColor: '#f59e0b20' }]}>
                  <Icon name="alert-circle" size={14} color="#f59e0b" />
                  <Typography variant="caption" color="#f59e0b" style={{ marginLeft: 4 }}>Pending</Typography>
                </View>
              )}
            </View>

            {/* Analyzing State */}
            {analysisStatus === 'analyzing' && !latestSignal && (
              <View style={styles.statusPlaceholder}>
                <Animated.View style={{ opacity: pulseAnim }}>
                  <Icon name="loader" size={28} color={colors.primary} />
                </Animated.View>
                <Typography variant="body" color={colors.textMuted} style={{ marginTop: 12, textAlign: 'center' }}>
                  AI is analyzing your entry...{"\n"}This usually takes a few seconds.
                </Typography>
              </View>
            )}

            {/* Failed/Pending State */}
            {analysisStatus === 'failed' && !latestSignal && (
              <View style={styles.statusPlaceholder}>
                <Icon name="alert-triangle" size={28} color="#f59e0b" />
                <Typography variant="body" color={colors.textMuted} style={{ marginTop: 12, textAlign: 'center' }}>
                  Analysis is pending or may have failed.{"\n"}Check your connection and try again.
                </Typography>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={handleRetryAnalysis}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="refresh-cw" size={14} color="#fff" />
                      <Typography variant="label" color="#fff" style={{ marginLeft: 6 }}>Retry Analysis</Typography>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Success State - Show insights */}
            {latestSignal && (
              <View style={styles.analysisContent}>
                {/* Mood & Sentiment Row */}
                {(latestSignal.mood || latestSignal.sentimentScore !== undefined) && (
                  <View style={styles.moodSentimentRow}>
                    {latestSignal.mood && (
                      <View style={[styles.moodCard, { backgroundColor: colors.primaryLight + '15' }]}>
                        <Icon name="smile" size={16} color={colors.primary} />
                        <View style={styles.moodCardText}>
                          <Typography variant="caption" color={colors.textMuted}>Detected Mood</Typography>
                          <Typography variant="body" style={{ fontWeight: '600' }}>{latestSignal.mood}</Typography>
                        </View>
                      </View>
                    )}
                    {latestSignal.sentimentScore !== undefined && (
                      <View style={[styles.sentimentCard, { backgroundColor: latestSignal.sentimentScore >= 0 ? '#10b98115' : '#ef444415' }]}>
                        <Icon 
                          name={latestSignal.sentimentScore >= 0 ? 'trending-up' : 'trending-down'} 
                          size={16} 
                          color={latestSignal.sentimentScore >= 0 ? '#10b981' : '#ef4444'} 
                        />
                        <View style={styles.moodCardText}>
                          <Typography variant="caption" color={colors.textMuted}>Sentiment</Typography>
                          <Typography variant="body" style={{ fontWeight: '600' }}>
                            {latestSignal.sentimentScore >= 0.5 ? 'Positive' : 
                             latestSignal.sentimentScore <= -0.5 ? 'Negative' : 'Neutral'}
                          </Typography>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Activities */}
                {latestSignal.activities?.length > 0 && (
                  <View style={styles.metaGroup}>
                    <View style={styles.metaHeader}>
                      <Icon name="activity" size={14} color={colors.textMuted} />
                      <Typography variant="label" color={colors.textMuted} style={{ marginLeft: 6 }}>Activities</Typography>
                    </View>
                    <View style={styles.tagsRow}>
                      {latestSignal.activities.map((activity: string, index: number) => (
                        <View key={index} style={[styles.tag, { backgroundColor: colors.surfaceHighlight }]}>
                          <Typography variant="caption">{activity}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* People */}
                {latestSignal.people?.length > 0 && (
                  <View style={styles.metaGroup}>
                    <View style={styles.metaHeader}>
                      <Icon name="users" size={14} color={colors.textMuted} />
                      <Typography variant="label" color={colors.textMuted} style={{ marginLeft: 6 }}>People Mentioned</Typography>
                    </View>
                    <View style={styles.tagsRow}>
                      {latestSignal.people.map((person: string, index: number) => (
                        <View key={index} style={[styles.tag, { backgroundColor: colors.primaryLight + '20' }]}>
                          <Icon name="user" size={10} color={colors.primary} style={{ marginRight: 4 }} />
                          <Typography variant="caption" color={colors.primary}>{person}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tags */}
                {latestSignal.tags?.length > 0 && (
                  <View style={styles.metaGroup}>
                    <View style={styles.metaHeader}>
                      <Icon name="hash" size={14} color={colors.textMuted} />
                      <Typography variant="label" color={colors.textMuted} style={{ marginLeft: 6 }}>Tags</Typography>
                    </View>
                    <View style={styles.tagsRow}>
                      {latestSignal.tags.map((tag: string, index: number) => (
                        <View key={index} style={[styles.tagPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                          <Typography variant="caption" color={colors.primary}>#{tag}</Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
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
  imagesContainer: {
    marginBottom: 30,
  },
  image: {
    width: Dimensions.get('window').width - 48, // Full width with padding
    height: Dimensions.get('window').width - 48, // Square aspect ratio
    borderRadius: 12,
    marginRight: 12,
    resizeMode: 'cover',
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 30,
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    marginBottom: 40,
  },
  analysisTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  analysisContent: {
    gap: 16,
  },
  moodSentimentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  sentimentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  moodCardText: {
    gap: 2,
  },
  metaGroup: {
    gap: 10,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
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