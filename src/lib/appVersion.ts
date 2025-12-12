import { Platform } from 'react-native';

// For this project we rely on package.json version for JS-level "what's new".
// Android/iOS native versionName/CFBundleShortVersionString should be kept in sync
// by your release process.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

export function getAppVersion(): string {
  const version = String(pkg?.version || '').trim();
  if (!version) return '0.0.0';
  return version;
}

export function getPlatformLabel(): string {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return 'App';
}
