import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, StatusBar, Platform, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';
import { Typography } from '../components/ui/Typography';

type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CameraScreenRouteProp>();
  const { onMediaCaptured } = route.params;
  const { colors } = useTheme();

  const { hasPermission, requestPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const device = useCameraDevice(cameraPosition);
  const camera = useRef<Camera>(null);

  React.useEffect(() => {
    if (!hasPermission) requestPermission();
    if (!hasMicPermission) requestMicPermission();
  }, [hasPermission, requestPermission, hasMicPermission, requestMicPermission]);

  const handleCapture = useCallback(async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: flash,
          enableShutterSound: false, // Mute the camera shutter sound
        });
        // Use the path directly for consistency with video handling
        const uri = photo.path;
        onMediaCaptured(uri, 'photo');
        navigation.goBack();
      } catch (e) {
        console.error('Failed to take photo', e);
      }
    }
  }, [flash, navigation, onMediaCaptured]);

  const startRecording = useCallback(async () => {
    if (!camera.current) return;
    setIsRecording(true);
    try {
      camera.current.startRecording({
        flash: flash,
        videoCodec: 'h264', // Use H.264 codec for better Android compatibility
        fileType: 'mp4',     // Force MP4 container format
        onRecordingFinished: (video) => {
          // Use the path directly without file:// prefix for better Android compatibility
          const uri = video.path;
          onMediaCaptured(uri, 'video');
          navigation.goBack();
        },
        onRecordingError: (error) => {
          console.error('Recording error', error);
          setIsRecording(false);
        },
      });
    } catch (e) {
      console.error('Failed to start recording', e);
      setIsRecording(false);
    }
  }, [flash, navigation, onMediaCaptured]);

  const stopRecording = useCallback(async () => {
    if (camera.current) {
      await camera.current.stopRecording();
      setIsRecording(false);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : 'off'));
  }, []);

  if (device == null) {
    return (
      <View style={[styles.container, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="white" />
        <Typography variant="body" color="white" style={{ marginTop: 20 }}>Loading Camera...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        video={true}
        audio={true}
        resizeMode="cover"
      />

      {/* Grid Overlay */}
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={styles.gridLineVertical} />
        <View style={styles.gridLineVertical} />
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineHorizontal} />
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="x" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
          <Icon name={flash === 'on' ? 'zap' : 'zap-off'} size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.spacer} />
        <TouchableOpacity
          onPress={handleCapture}
          onLongPress={startRecording}
          onPressOut={isRecording ? stopRecording : undefined}
          delayLongPress={300}
          style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
        >
          <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCamera} style={styles.iconButton}>
          <Icon name="refresh-cw" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    left: '33.33%',
  },
  gridLineHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '33.33%',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonRecording: {
    transform: [{ scale: 1.2 }],
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
  },
  captureButtonInnerRecording: {
    backgroundColor: 'red',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  spacer: {
    width: 50,
  },
});