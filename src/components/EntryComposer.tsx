import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, View, Platform, PermissionsAndroid, Linking } from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';

import { TouchableOpacity, Image, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useAlert } from '../context/AlertContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

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
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);

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

    const result = await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener((e) => {
      // Format time as mm:ss, removing milliseconds
      const rawTime = audioRecorderPlayer.mmss(Math.floor(e.currentPosition / 1000));
      // mmss returns mm:ss:ms, so we split and take the first two parts
      const parts = rawTime.split(':');
      if (parts.length >= 2) {
        setRecordTime(`${parts[0]}:${parts[1]}`);
      } else {
        setRecordTime(rawTime);
      }
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

  const onStartPlay = async () => {
    if (!voiceNote) return;
    console.log('onStartPlay');
    const msg = await audioRecorderPlayer.startPlayer(voiceNote);
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
      // For Android, we need to ensure the URI is properly formatted
      const videoUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      Linking.openURL(videoUri).catch(err => console.error("Couldn't load video", err));
    }
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
          </View>
          <Typography
            variant="caption"
            color={limitReached ? colors.error : colors.textMuted}
          >
            {remaining} chars left
          </Typography>
        </View>
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
});

export default EntryComposer;
