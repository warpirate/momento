import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';

export default function CalendarScreen() {
  console.log('Render CalendarScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const allEntries = await database.get<Entry>('entries').query().fetch();
      setEntries(allEntries);
    };
    fetchEntries();
  }, []);

  useEffect(() => {
    generateCalendarDays(selectedDate);
  }, [selectedDate]);

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add padding days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -i));
    }
    days.reverse(); // Correct order for previous month days

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    setCalendarDays(days);
  };

  const hasEntryOnDate = (date: Date) => {
    return entries.some(entry => {
      const entryDate = entry.createdAt;
      // Show entries even if date is invalid - don't filter them out
      if (!entryDate || isNaN(entryDate.getTime())) return false;
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEntriesForDate = (date: Date) => {
    return entries
      .filter(entry => {
        const entryDate = entry.createdAt;
        // Show entries even if date is invalid - don't filter them out
        if (!entryDate || isNaN(entryDate.getTime())) return false;
        return (
          entryDate.getDate() === date.getDate() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      })
      .sort(
        (a, b) => {
          const aTime = a.createdAt && !isNaN(a.createdAt.getTime()) ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt && !isNaN(b.createdAt.getTime()) ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        },
      );
  };

  const getEntryMediaInfo = (entry: Entry) => {
    const images = entry.images ? JSON.parse(entry.images) : [];
    const hasVideos = images.some((uri: string) => uri.endsWith('.mp4') || uri.endsWith('.mov'));
    const hasImages = images.some((uri: string) => !uri.endsWith('.mp4') && !uri.endsWith('.mov'));
    
    return {
      hasImages,
      hasVideos,
      hasVoiceNote: !!entry.voiceNote,
    };
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  const renderDay = ({ item }: { item: Date }) => {
    const isCurrentMonth = item.getMonth() === selectedDate.getMonth();
    const hasEntry = hasEntryOnDate(item);
    const isSelected = 
      item.getDate() === selectedDate.getDate() && 
      item.getMonth() === selectedDate.getMonth();

    return (
      <TouchableOpacity 
        style={[
          styles.dayCell, 
          !isCurrentMonth && styles.otherMonthDay,
          isSelected && { 
            backgroundColor: colors.primaryLight + '30',
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: borderRadius.l
          }
        ]}
        onPress={() => setSelectedDate(item)}
      >
        <Typography 
          style={[
            styles.dayText,
            isSelected && { color: colors.primary, fontWeight: '700' as const }
          ]}
          color={!isCurrentMonth ? colors.textMuted : colors.textPrimary}
        >
          {item.getDate()}
        </Typography>
        {hasEntry && <View style={[styles.dot, { backgroundColor: colors.secondary }]} />}
      </TouchableOpacity>
    );
  };

  const selectedEntries = getEntriesForDate(selectedDate);

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
          <Icon name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="subheading">
          {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Typography>
        <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
          <Icon name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.weekDays, { borderBottomColor: colors.surfaceHighlight }]}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Typography key={index} style={styles.weekDayText} color={colors.textMuted}>{day}</Typography>
        ))}
      </View>

      <FlatList
        data={calendarDays}
        renderItem={renderDay}
        keyExtractor={(item) => item.toISOString()}
        numColumns={7}
        contentContainerStyle={styles.calendarGrid}
      />

      <View style={[styles.entriesList, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.l, borderTopRightRadius: borderRadius.l }]}>
        <View style={styles.entriesHeader}>
          <Typography variant="label" color={colors.textMuted} style={styles.entriesTitle}>
            ENTRIES FOR {selectedDate.toLocaleDateString()}
          </Typography>
          {selectedEntries.length > 0 && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('DailyEntries', { date: selectedDate.toISOString() })}
              style={styles.chevronButton}
            >
              <Icon name="chevron-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {selectedEntries.length > 0 ? (
          <FlatList
            data={selectedEntries}
            renderItem={({ item }) => {
              const mediaInfo = getEntryMediaInfo(item);
              return (
                <TouchableOpacity 
                  style={[styles.entryItem, { borderBottomColor: colors.surfaceHighlight }]}
                  onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
                >
                  <Typography style={styles.entryTime} color={colors.primary}>
                    {item.createdAt && !isNaN(item.createdAt.getTime()) && item.createdAt.getTime() > 0
                      ? item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : item.updatedAt && !isNaN(item.updatedAt.getTime()) && item.updatedAt.getTime() > 0
                      ? item.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Typography>
                  <View style={styles.entryContent}>
                    <Typography style={styles.entryPreview} numberOfLines={1}>
                      {item.content}
                    </Typography>
                    <View style={styles.mediaIndicators}>
                      {mediaInfo.hasVoiceNote && (
                        <Icon name="mic" size={14} color={colors.textMuted} />
                      )}
                      {mediaInfo.hasVideos && (
                        <Icon name="video" size={14} color={colors.textMuted} />
                      )}
                      {mediaInfo.hasImages && (
                        <Icon name="image" size={14} color={colors.textMuted} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            style={styles.entriesFlatList}
          />
        ) : (
          <Typography style={styles.emptyText} color={colors.textMuted}>No entries for this day</Typography>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    padding: 10,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    padding: 10,
    paddingBottom: 5,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  entriesList: {
    flex: 2,
    padding: 20,
    minHeight: 200,
  },
  entriesTitle: {
    textTransform: 'uppercase',
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chevronButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  entriesFlatList: {
    flex: 1,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  entryTime: {
    fontSize: 14,
    width: 60,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryPreview: {
    fontSize: 16,
    marginBottom: 4,
  },
  mediaIndicators: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});