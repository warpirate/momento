import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';

export type EntryPreview = {
  id: string;
  content: string;
  createdAt: string;
  tags?: string[];
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
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primaryLight + '20' }]}>
                <Typography variant="caption" color={colors.primary} style={styles.tagText}>
                  {tag}
                </Typography>
              </View>
            ))}
          </View>
        )}
      </View>
      <Typography variant="body" numberOfLines={4} style={styles.excerpt}>
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
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  excerpt: {
    lineHeight: 22,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default EntryPreviewCard;
