import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/theme';
import { Typography } from './Typography';
import { Button } from './Button';

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
}) => {
  const { colors, borderRadius, spacing } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [viewDate, setViewDate] = useState<Date>(initialDate || new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  useEffect(() => {
    if (visible) {
      setViewDate(selectedDate);
      setViewMode('days');
    }
  }, [visible, selectedDate]);

  useEffect(() => {
    generateCalendarDays(viewDate);
  }, [viewDate]);

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -i));
    }
    days.reverse();

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    setCalendarDays(days);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setViewDate(newDate);
  };

  const changeYear = (increment: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    setViewDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onSelectDate(date);
    onClose();
  };

  const renderDay = ({ item }: { item: Date }) => {
    const isCurrentMonth = item.getMonth() === viewDate.getMonth();
    const isSelected = 
      item.getDate() === selectedDate.getDate() && 
      item.getMonth() === selectedDate.getMonth() &&
      item.getFullYear() === selectedDate.getFullYear();

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
        onPress={() => handleDateSelect(item)}
      >
        <Typography 
          style={[
            styles.dayText,
            isSelected && { color: colors.primary, fontWeight: '700' }
          ]}
          color={!isCurrentMonth ? colors.textMuted : colors.textPrimary}
        >
          {item.getDate()}
        </Typography>
      </TouchableOpacity>
    );
  };

  const renderMonthSelector = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <View style={styles.gridContainer}>
        {months.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.gridItem,
              viewDate.getMonth() === index && {
                backgroundColor: colors.primaryLight + '30',
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: borderRadius.m
              }
            ]}
            onPress={() => {
              const newDate = new Date(viewDate);
              newDate.setMonth(index);
              setViewDate(newDate);
              setViewMode('days');
            }}
          >
            <Typography
              color={viewDate.getMonth() === index ? colors.primary : colors.textPrimary}
            >
              {month.substring(0, 3)}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderYearSelector = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    return (
      <FlatList
        data={years}
        keyExtractor={(item) => item.toString()}
        numColumns={4}
        contentContainerStyle={styles.yearList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.gridItem,
              viewDate.getFullYear() === item && {
                backgroundColor: colors.primaryLight + '30',
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: borderRadius.m
              }
            ]}
            onPress={() => {
              const newDate = new Date(viewDate);
              newDate.setFullYear(item);
              setViewDate(newDate);
              setViewMode('days');
            }}
          >
            <Typography
              color={viewDate.getFullYear() === item ? colors.primary : colors.textPrimary}
            >
              {item}
            </Typography>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.l }]}>
          
          <View style={styles.header}>
            {viewMode === 'days' && (
              <>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                  <Icon name="chevron-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                  <TouchableOpacity onPress={() => setViewMode('months')}>
                    <Typography variant="subheading" style={styles.headerText}>
                      {viewDate.toLocaleDateString(undefined, { month: 'long' })}
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setViewMode('years')}>
                    <Typography variant="subheading" style={styles.headerText}>
                      {viewDate.getFullYear()}
                    </Typography>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                  <Icon name="chevron-right" size={24} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
            
            {viewMode !== 'days' && (
              <View style={styles.headerTitleContainer}>
                <Typography variant="subheading">
                  Select {viewMode === 'months' ? 'Month' : 'Year'}
                </Typography>
              </View>
            )}
          </View>

          <View style={styles.content}>
            {viewMode === 'days' && (
              <>
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
              </>
            )}

            {viewMode === 'months' && renderMonthSelector()}
            {viewMode === 'years' && renderYearSelector()}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.surfaceHighlight }]}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              size="small"
            />
            {viewMode !== 'days' && (
               <Button
               title="Back to Calendar"
               variant="ghost"
               onPress={() => setViewMode('days')}
               size="small"
             />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    maxHeight: 500,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    paddingHorizontal: 4,
  },
  navButton: {
    padding: 8,
  },
  content: {
    height: 320,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginHorizontal: 10,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: '1.5%',
  },
  yearList: {
    padding: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
});