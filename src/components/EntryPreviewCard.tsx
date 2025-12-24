import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import Icon from 'react-native-vector-icons/Feather';

export type EntryPreview = {
  id: string;
  content: string;
  createdAt: string;
  tags?: string[];
  hasImages?: boolean;
  hasVideos?: boolean;
  hasVoiceNote?: boolean;
};

type EntryPreviewCardProps = {
  item: EntryPreview;
};

export function EntryPreviewCard({ item }: EntryPreviewCardProps) {
  const { colors, spacing } = useTheme();
  const previewText = item.content.trim();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Typography variant="caption" color={colors.primary}>
          {item.createdAt}
        </Typography>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {item.hasVoiceNote && (
            <Icon name="mic" size={14} color={colors.textMuted} />
          )}
          {item.hasVideos && (
            <Icon name="video" size={14} color={colors.textMuted} />
          )}
          {item.hasImages && (
            <Icon name="image" size={14} color={colors.textMuted} />
          )}
        </View>
      </View>
      <Typography variant="body" numberOfLines={3} style={styles.excerpt}>
        {previewText}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 1,
    marginBottom: 6,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '500',
  },
  excerpt: {
    lineHeight: 22,
  },
});

export default EntryPreviewCard;
