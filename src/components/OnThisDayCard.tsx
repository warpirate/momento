import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Entry from '../db/model/Entry';

type OnThisDayCardProps = {
  entry: Entry;
  yearsAgo: number;
};

export function OnThisDayCard({ entry, yearsAgo }: OnThisDayCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 On This Day</Text>
        <Text style={styles.subtitle}>{yearsAgo} year{yearsAgo > 1 ? 's' : ''} ago</Text>
      </View>
      <Text style={styles.content} numberOfLines={3}>
        {entry.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  content: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
});