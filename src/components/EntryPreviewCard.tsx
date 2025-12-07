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
  // AI-extracted data
  aiMood?: string;
  aiTags?: string[];
  sentimentScore?: number;
};

type EntryPreviewCardProps = {
  item: EntryPreview;
};

export function EntryPreviewCard({ item }: EntryPreviewCardProps) {
  const { colors, spacing } = useTheme();
  const previewText = item.content.trim();
  
  // Determine mood color based on sentiment
  const getMoodColor = () => {
    if (item.sentimentScore !== undefined) {
      if (item.sentimentScore >= 0.3) return '#10b981'; // Green for positive
      if (item.sentimentScore <= -0.3) return '#ef4444'; // Red for negative
    }
    return colors.primary; // Default primary for neutral
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Typography variant="caption" color={colors.primary}>
            {item.createdAt}
          </Typography>
          {/* AI Mood Badge */}
          {item.aiMood && (
            <View style={[styles.moodBadge, { backgroundColor: getMoodColor() + '15', borderColor: getMoodColor() + '30' }]}>
              <Icon name="smile" size={10} color={getMoodColor()} />
              <Typography variant="caption" color={getMoodColor()} style={styles.moodText}>
                {item.aiMood}
              </Typography>
            </View>
          )}
        </View>
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
      {/* AI Tags Row */}
      {item.aiTags && item.aiTags.length > 0 && (
        <View style={styles.aiTagsRow}>
          {item.aiTags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.aiTag, { backgroundColor: colors.surfaceHighlight }]}>
              <Typography variant="caption" color={colors.textMuted} style={styles.tagText}>
                #{tag}
              </Typography>
            </View>
          ))}
          {item.aiTags.length > 3 && (
            <Typography variant="caption" color={colors.textMuted}>+{item.aiTags.length - 3}</Typography>
          )}
        </View>
      )}
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
  aiTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  aiTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
  },
});

export default EntryPreviewCard;
