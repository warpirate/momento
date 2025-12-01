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
      const entryDate = new Date(entry.createdAt);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
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
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Typography style={styles.navText} color={colors.primary}>←</Typography>
        </TouchableOpacity>
        <Typography variant="subheading">
          {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Typography>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Typography style={styles.navText} color={colors.primary}>→</Typography>
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
        <Typography variant="label" color={colors.textMuted} style={styles.entriesTitle}>
          ENTRIES FOR {selectedDate.toLocaleDateString()}
        </Typography>
        {selectedEntries.length > 0 ? (
          selectedEntries.map(entry => (
            <TouchableOpacity 
              key={entry.id} 
              style={[styles.entryItem, { borderBottomColor: colors.surfaceHighlight }]}
              onPress={() => navigation.navigate('EntryDetail', { entryId: entry.id })}
            >
              <Typography style={styles.entryTime} color={colors.primaryLight}>
                {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography style={styles.entryPreview} numberOfLines={1}>
                {entry.content}
              </Typography>
            </TouchableOpacity>
          ))
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
    flex: 1,
    padding: 20,
  },
  entriesTitle: {
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  entryTime: {
    fontSize: 14,
    width: 60,
  },
  entryPreview: {
    fontSize: 16,
    flex: 1,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});