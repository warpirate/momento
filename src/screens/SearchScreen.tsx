import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';

export default function SearchScreen() {
  console.log('Render SearchScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const searchEntries = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const entries = await database.get<Entry>('entries')
          .query(
            Q.where('content', Q.like(`%${query}%`)),
            Q.sortBy('created_at', Q.desc)
          )
          .fetch();
        
        setResults(entries);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchEntries, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const renderItem = ({ item }: { item: Entry }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
    >
      <Card style={styles.resultItem}>
        <View style={styles.resultHeader}>
          <Typography variant="label" color={colors.primaryLight}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="caption">
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
        <Typography variant="body" numberOfLines={3} style={styles.resultContent}>
          {item.content}
        </Typography>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <Typography variant="heading">Search</Typography>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.m }]}>
          <Icon
            name="search"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontSize: typography.body.fontSize }]}
            placeholder="Search your journal..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon
                name="x"
                size={16}
                color={colors.textMuted}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { padding: spacing.m }]}
        ListEmptyComponent={
          query.length > 0 && !searching ? (
            <Typography style={styles.emptyText} color={colors.textMuted}>No matches found</Typography>
          ) : (
            <View style={styles.placeholderContainer}>
              <Typography style={styles.placeholderText} color={colors.textMuted}>
                Find memories by keywords, people, or activities
              </Typography>
            </View>
          )
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  clearIcon: {
    padding: 4,
  },
  listContent: {
    gap: 12,
  },
  resultItem: {
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultContent: {
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});