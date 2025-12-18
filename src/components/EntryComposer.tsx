import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Platform, PermissionsAndroid, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';

import { TouchableOpacity, Image, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useAlert } from '../context/AlertContext';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const AI_ENHANCE_KEY = 'momento:ai_enhance_enabled';

type EntryComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  characterLimit?: number;
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  voiceNote?: string;
  onVoiceNoteChange?: (path: string | undefined) => void;
};

export function EntryComposer({
  value,
  onChangeText,
  placeholder = 'What’s on your mind?',
  characterLimit = 4000,
  images = [],
  onImagesChange,
  voiceNote,
  onVoiceNoteChange,
}: EntryComposerProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius, typography } = useTheme();
  const { showAlert } = useAlert();
  const remaining = characterLimit - value.length;
  const limitReached = remaining <= 0;
  const canEnhance = value.trim().length >= 1;
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);

  const [aiEnabled, setAiEnabled] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceOriginalText, setEnhanceOriginalText] = useState<string | null>(null);
  const [isEnhancedPreviewActive, setIsEnhancedPreviewActive] = useState(false);
  const [isEnhanceComplete, setIsEnhanceComplete] = useState(false);

  const streamedTextRef = useRef('');

  const enhanceAbortControllerRef = useRef<AbortController | null>(null);

  const enhanceAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const readAiSettings = async () => {
      try {
        const enabledValue = await AsyncStorage.getItem(AI_ENHANCE_KEY);
        if (!isMounted) return;
        setAiEnabled(enabledValue === 'true');
      } catch {
        // ignore
      }
    };

    readAiSettings();
    const intervalId = setInterval(readAiSettings, 1500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        
        if (Platform.Version < 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        }

        const grants = await PermissionsAndroid.requestMultiple(permissions);

        const audioGranted = grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        
        let storageGranted = true;
        if (Platform.Version < 33) {
          storageGranted =
            grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
            grants[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (audioGranted && storageGranted) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          showAlert('Permissions Required', 'Please grant audio recording permissions to use this feature.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setRecordTime('00:00');
    audioRecorderPlayer.removeRecordBackListener();

    const result = await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener((e) => {
      const totalSeconds = Math.floor(e.currentPosition / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setRecordTime(`${minutes}:${seconds}`);
      return;
    });
    setIsRecording(true);
    console.log(result);
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    setRecordTime('00:00');
    onVoiceNoteChange?.(result);
    console.log(result);
  };

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const onStartPlay = async () => {
    if (!voiceNote) return;
    console.log('onStartPlay');
    audioRecorderPlayer.removePlayBackListener();
    setPlayTime('00:00');
    setDuration('00:00');
    const msg = await audioRecorderPlayer.startPlayer(voiceNote);
    console.log(msg);
    audioRecorderPlayer.addPlayBackListener((e) => {
      setPlayTime(formatMs(e.currentPosition));
      setDuration(formatMs(e.duration));

      setCurrentPositionSec(e.currentPosition);
      setCurrentDurationSec(e.duration);
      if (e.currentPosition >= e.duration && e.duration > 0) {
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

  const onStopPlay = async () => {
    console.log('onStopPlay');
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setIsPlaying(false);
  };

  const handleDeleteVoiceNote = () => {
    onVoiceNoteChange?.(undefined);
  };

  const handleAddImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
    });

    if (result.assets) {
      const newImages = result.assets.map(asset => asset.uri).filter(Boolean) as string[];
      onImagesChange?.([...images, ...newImages]);
    }
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera', {
      onMediaCaptured: (uri, type) => {
        // Add both photos and videos to the images list for now
        // The EntryPreviewCard and other components will need to handle video playback eventually
        onImagesChange?.([...images, uri]);
      },
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange?.(newImages);
  };

  const isVideo = (uri: string) => {
    return uri.endsWith('.mp4') || uri.endsWith('.mov');
  };

  const handleImagePress = (uri: string) => {
    if (isVideo(uri)) {
      const videoUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      Linking.openURL(videoUri).catch(err => console.error("Couldn't load video", err));
    }
  };

  const handleEnhance = async () => {
    if (!canEnhance) {
      showAlert('Add Text', 'Write something first.');
      return;
    }
    setIsEnhancing(true);
    try {
      enhanceAbortControllerRef.current?.abort();
      if (enhanceAnimationTimerRef.current) {
        clearTimeout(enhanceAnimationTimerRef.current);
        enhanceAnimationTimerRef.current = null;
      }
      const abortController = new AbortController();
      enhanceAbortControllerRef.current = abortController;

      const original = value;
      setEnhanceOriginalText(original);
      setIsEnhancedPreviewActive(true);
      setIsEnhanceComplete(false);

      const supabaseUrl = SUPABASE_URL?.startsWith('http') ? SUPABASE_URL : `https://${SUPABASE_URL}`;
      const supabaseAnonKey = SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Service unavailable');
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ content: original, mode: 'improve' }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        console.error('Enhance request failed:', await res.text());
        throw new Error('Enhancement failed');
      }

      // RN fetch often doesn't expose a ReadableStream (res.body can be null).
      // If streaming is unavailable, fall back to a non-streaming invoke and animate typing.
      if (!res.body) {
        const { data, error } = await supabase.functions.invoke('analyze-entry', {
          body: { content: original, mode: 'improve' },
        });
        if (error) throw error;
        const enhanced = (data as any)?.enhanced as string | undefined;
        if (!enhanced) {
          throw new Error('Enhancement failed');
        }

        streamedTextRef.current = '';
        onChangeText('');

        const step = () => {
          if (abortController.signal.aborted) return;

          const nextIndex = streamedTextRef.current.length + 1;
          streamedTextRef.current = enhanced.slice(0, nextIndex);
          onChangeText(streamedTextRef.current);

          if (nextIndex < enhanced.length) {
            enhanceAnimationTimerRef.current = setTimeout(step, 20);
          } else {
            setIsEnhanceComplete(true);
          }
        };

        step();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      streamedTextRef.current = '';
      onChangeText('');

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(chunk, { stream: true });
        if (textChunk) {
          // For SSE, we receive `data: {"chunk":"..."}` lines.
          const lines = textChunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice('data:'.length).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload) as { chunk?: string };
              if (parsed.chunk) {
                streamedTextRef.current += parsed.chunk;
                onChangeText(streamedTextRef.current);
              }
            } catch {
              // ignore
            }
          }
        }
      }

      setIsEnhanceComplete(true);
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        return;
      }
      console.error('Enhance error:', err);
      showAlert('Enhance Failed', 'Please try again.');
      setIsEnhancedPreviewActive(false);
      setIsEnhanceComplete(false);
      if (enhanceOriginalText != null) {
        onChangeText(enhanceOriginalText);
      }
    } finally {
      setIsEnhancing(false);
      enhanceAbortControllerRef.current = null;
    }
  };

  const handleAcceptEnhanced = () => {
    setEnhanceOriginalText(null);
    setIsEnhancedPreviewActive(false);
    setIsEnhanceComplete(false);
  };

  const handleCancelEnhanced = () => {
    enhanceAbortControllerRef.current?.abort();
    enhanceAbortControllerRef.current = null;
    if (enhanceAnimationTimerRef.current) {
      clearTimeout(enhanceAnimationTimerRef.current);
      enhanceAnimationTimerRef.current = null;
    }
    setIsEnhancing(false);
    if (enhanceOriginalText != null) {
      onChangeText(enhanceOriginalText);
    }
    setEnhanceOriginalText(null);
    setIsEnhancedPreviewActive(false);
    setIsEnhanceComplete(false);
  };

  return (
    <View style={{ gap: spacing.m }}>
      <View style={[styles.container, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceHighlight,
        borderRadius: borderRadius.l,
        padding: spacing.m,
      }]}>
        <TextInput
          style={[styles.input, {
            color: colors.textPrimary,
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight,
          }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
          value={value.slice(0, characterLimit)}
          onChangeText={onChangeText}
        />
        
        {/* Image Preview */}
        {images.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewContainer} showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <TouchableOpacity onPress={() => handleImagePress(uri)} activeOpacity={0.8}>
                  <Image 
                    source={{ 
                      uri: uri.startsWith('http') ? uri : (uri.startsWith('file://') ? uri : `file://${uri}`)
                    }} 
                    style={styles.previewImage} 
                  />
                  {isVideo(uri) && (
                    <View style={styles.videoOverlay}>
                      <Icon name="play-circle" size={24} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Icon name="x" size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Voice Note Preview */}
        {voiceNote && (
          <View style={[styles.voiceNoteContainer, { backgroundColor: colors.surfaceHighlight, borderRadius: borderRadius.m }]}>
            <TouchableOpacity onPress={isPlaying ? onPausePlay : onStartPlay}>
              <Icon name={isPlaying ? "pause" : "play"} size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
               <Typography variant="caption">
                {isPlaying ? `${playTime} / ${duration}` : 'Voice Note Recorded'}
              </Typography>
              {/* Simple Progress Bar */}
              {isPlaying && (
                 <View style={{ height: 2, backgroundColor: colors.surface, marginTop: 4, width: '100%' }}>
                   <View style={{
                     height: '100%',
                     backgroundColor: colors.primary,
                     width: `${(currentPositionSec / (currentDurationSec || 1)) * 100}%`
                   }} />
                 </View>
              )}
            </View>
            <TouchableOpacity onPress={handleDeleteVoiceNote}>
              <Icon name="trash-2" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {isRecording && (
           <View style={[styles.voiceNoteContainer, { backgroundColor: colors.error + '10', borderRadius: borderRadius.m, borderWidth: 1, borderColor: colors.error }]}>
             <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]} />
             <Typography variant="body" style={{ flex: 1, marginLeft: 12, color: colors.error, fontWeight: '600' }}>
               Recording... {recordTime}
             </Typography>
             <TouchableOpacity onPress={onStopRecord} style={{ padding: 8 }}>
               <Icon name="square" size={20} color={colors.error} />
             </TouchableOpacity>
           </View>
        )}

        <View style={styles.metaRow}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={handleAddImage}>
              <Icon name="image" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto}>
              <Icon name="camera" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={isRecording ? onStopRecord : onStartRecord} disabled={!!voiceNote}>
              <Icon name="mic" size={20} color={voiceNote ? colors.surfaceHighlight : (isRecording ? colors.error : colors.textMuted)} />
            </TouchableOpacity>
            {aiEnabled && (
              <TouchableOpacity onPress={handleEnhance} disabled={isEnhancing || !canEnhance || isEnhancedPreviewActive}>
                {isEnhancing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="zap" size={20} color={canEnhance ? colors.primary : colors.textMuted} />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Typography
            variant="caption"
            color={limitReached ? colors.error : colors.textMuted}
          >
            {remaining} chars left
          </Typography>
        </View>

        {isEnhancedPreviewActive && isEnhanceComplete && (
          <View style={[styles.inlineEnhanceActions, { borderTopColor: colors.surfaceHighlight }]}
          >
            <TouchableOpacity
              style={[styles.inlineEnhanceIconButton, { backgroundColor: colors.surfaceHighlight }]}
              onPress={handleCancelEnhanced}
              disabled={isEnhancing}
            >
              <Icon name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inlineEnhanceIconButton, { backgroundColor: colors.primary }]}
              onPress={handleAcceptEnhanced}
              disabled={isEnhancing}
            >
              <Icon name="check" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    gap: 12,
  },
  input: {
    minHeight: 120,
    fontFamily: 'System',
    padding: 0, // Remove default padding to align with container
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingCard: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  inlineEnhanceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  inlineEnhanceIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
  },
});

export default EntryComposer;
