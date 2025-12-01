import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';

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
  const { colors, spacing, borderRadius, typography } = useTheme();
  const remaining = characterLimit - value.length;
  const limitReached = remaining <= 0;

  return (
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
      <View style={styles.metaRow}>
        <Typography variant="caption" color={colors.textMuted}>
          Autosave enabled
        </Typography>
        <Typography 
          variant="caption" 
          color={limitReached ? colors.error : colors.textMuted}
        >
          {remaining} chars left
        </Typography>
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
  },
});

export default EntryComposer;
