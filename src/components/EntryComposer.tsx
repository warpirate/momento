import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

type EntryComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  characterLimit?: number;
};

export function EntryComposer({
  value,
  onChangeText,
  placeholder = 'What’s on your mind?',
  characterLimit = 4000,
}: EntryComposerProps) {
  const remaining = characterLimit - value.length;
  const limitReached = remaining <= 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        multiline
        textAlignVertical="top"
        autoCorrect
        autoCapitalize="sentences"
        value={value.slice(0, characterLimit)}
        onChangeText={onChangeText}
      />
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Autosave enabled · Offline friendly</Text>
        <Text style={[styles.counter, limitReached && styles.counterExceeded]}>
          {remaining} chars left
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2933',
    backgroundColor: '#0D1117',
    padding: 16,
    gap: 12,
  },
  input: {
    minHeight: 160,
    fontSize: 16,
    color: '#F8FAFC',
    lineHeight: 24,
    fontFamily: 'System',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#98A2B3',
    fontSize: 13,
  },
  counter: {
    color: '#98A2B3',
    fontSize: 13,
  },
  counterExceeded: {
    color: '#F97066',
  },
});

export default EntryComposer;

