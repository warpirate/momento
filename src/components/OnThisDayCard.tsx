import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Entry from '../db/model/Entry';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { Card } from './ui/Card';
import Icon from 'react-native-vector-icons/Feather';

type OnThisDayCardProps = {
  entry: Entry;
  yearsAgo: number;
  onPress: () => void;
};

export function OnThisDayCard({ entry, yearsAgo, onPress }: OnThisDayCardProps) {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{ marginBottom: spacing.m, borderColor: colors.primary, borderWidth: 1 }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar" size={18} color={colors.primary} />
            <Typography variant="subheading" color={colors.primary}>On This Day</Typography>
          </View>
          <Typography variant="caption" color={colors.textMuted}>{yearsAgo} year{yearsAgo > 1 ? 's' : ''} ago</Typography>
        </View>
        <Typography variant="body" numberOfLines={3} style={{ marginTop: spacing.s }}>
          {entry.content}
        </Typography>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});