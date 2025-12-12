import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReleaseNotesForVersion, ReleaseNotes } from '../content/releaseNotes';
import { getAppVersion } from './appVersion';

const SEEN_VERSION_KEY = '@momento_whats_new_seen_version';

export type WhatsNewPayload = ReleaseNotes;

export async function getWhatsNewToShow(): Promise<WhatsNewPayload | null> {
  const currentVersion = getAppVersion();
  const notes = getReleaseNotesForVersion(currentVersion);
  if (!notes) return null;

  try {
    const seenVersion = await AsyncStorage.getItem(SEEN_VERSION_KEY);
    if (seenVersion === currentVersion) return null;
    return notes;
  } catch (error) {
    console.error('Failed to load whats-new state:', error);
    // If storage fails, still show once for this launch.
    return notes;
  }
}

export async function markWhatsNewSeen(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to persist whats-new state:', error);
  }
}
