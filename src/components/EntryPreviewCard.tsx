import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export type EntryPreview = {
  id: string;
  content: string;
  createdAt: string;
  tags?: string[];
};

type EntryPreviewCardProps = {
  item: EntryPreview;
};

export function EntryPreviewCard({item}: EntryPreviewCardProps) {
  const previewText = item.content.trim();
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.dateLabel}>{item.createdAt}</Text>
        {item.tags && (
          <Text style={styles.tagLabel}>{item.tags.slice(0, 2).join(' · ')}</Text>
        )}
      </View>
      <Text style={styles.excerpt} numberOfLines={4}>
        {previewText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2933',
    backgroundColor: '#101828',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    color: '#98A2B3',
    fontSize: 13,
  },
  tagLabel: {
    color: '#A4BCFD',
    fontSize: 13,
  },
  excerpt: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default EntryPreviewCard;

