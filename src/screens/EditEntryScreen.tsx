import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { withObservables } from '@nozbe/watermelondb/react';
import { sync } from '../lib/sync';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { EntryComposer } from '../components/EntryComposer';
import { useTheme } from '../theme/theme';
import { useSyncContext } from '../lib/SyncContext';
import { useAlert } from '../context/AlertContext';

type EditEntryRouteProp = RouteProp<RootStackParamList, 'EditEntry'>;

function EditEntryScreen({ entry }: { entry: Entry }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing } = useTheme();
  const { showAlert } = useAlert();
  const { markHasUnsyncedEntries } = useSyncContext();
  
  const [content, setContent] = useState(entry.content);
  const [images, setImages] = useState<string[]>(entry.images ? JSON.parse(entry.images) : []);
  const [voiceNote, setVoiceNote] = useState<string | undefined>(entry.voiceNote);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      showAlert('Nothing to save', 'Entry cannot be empty.');
      return;
    }
    setSaving(true);

    try {
      await database.write(async () => {
        await entry.update(record => {
          record.content = trimmed;
          if (images.length > 0) record.images = JSON.stringify(images);
          if (voiceNote !== undefined) record.voiceNote = voiceNote;
        });
      });

      // Mark that we have local changes that need to be synced and analyzed.
      markHasUnsyncedEntries();

      sync().catch(err => console.error('Sync after edit failed:', err));

      navigation.goBack();
    } catch (error) {
      showAlert('Save failed', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m, borderBottomColor: colors.surfaceHighlight }]}>
        <Typography variant="heading">Edit Entry</Typography>
        <Button 
          title="Cancel" 
          variant="ghost" 
          onPress={() => navigation.goBack()} 
          style={{ paddingVertical: 4, paddingHorizontal: 8 }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.m, gap: spacing.m }}>
        <EntryComposer
          value={content}
          onChangeText={setContent}
          images={images}
          onImagesChange={setImages}
          voiceNote={voiceNote}
          onVoiceNoteChange={setVoiceNote}
        />

        <Button 
          title={saving ? 'Saving…' : 'Save Changes'} 
          onPress={handleSave} 
          loading={saving}
          disabled={saving}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
});

const enhance = withObservables(['route'], ({ route }: { route: EditEntryRouteProp }) => ({
  entry: database.get<Entry>('entries').findAndObserve(route.params.entryId),
}));

export default enhance(EditEntryScreen);