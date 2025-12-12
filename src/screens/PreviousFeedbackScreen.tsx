import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';
import { supabase } from '../lib/supabaseClient';

type PreviousFeedbackScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PreviousFeedback'>;

interface FeedbackItem {
  id: string;
  feedback_type: string;
  title: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: '#6366f1',
  triaged: '#f59e0b',
  in_progress: '#3b82f6',
  shipped: '#10b981',
  closed: '#6b7280',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  triaged: 'Under Review',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  closed: 'Closed',
};

export default function PreviousFeedbackScreen() {
  const navigation = useNavigation<PreviousFeedbackScreenNavigationProp>();
  const { colors, spacing, borderRadius } = useTheme();
  
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('id, feedback_type, title, status, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeedbackList(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchFeedback();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedback();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return 'alert-circle';
      case 'feature':
        return 'plus-circle';
      case 'improvement':
        return 'trending-up';
      default:
        return 'message-circle';
    }
  };

  const renderItem = ({ item }: { item: FeedbackItem }) => (
    <TouchableOpacity
      style={[
        styles.feedbackItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceHighlight,
          borderRadius: borderRadius.m,
        },
      ]}
      onPress={() => navigation.navigate('FeedbackDetail', { feedbackId: item.id })}
    >
      <View style={styles.itemHeader}>
        <View style={styles.typeContainer}>
          <Icon name={getTypeIcon(item.feedback_type)} size={16} color={colors.primary} />
          <Typography variant="caption" color={colors.textMuted} style={styles.typeLabel}>
            {item.feedback_type.charAt(0).toUpperCase() + item.feedback_type.slice(1)}
          </Typography>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (statusColors[item.status] || statusColors.new) + '20' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[item.status] || statusColors.new },
            ]}
          />
          <Typography
            variant="caption"
            style={[styles.statusText, { color: statusColors[item.status] || statusColors.new }]}
          >
            {statusLabels[item.status] || 'New'}
          </Typography>
        </View>
      </View>
      <Typography variant="body" numberOfLines={2} style={styles.title}>
        {item.title}
      </Typography>
      <Typography variant="caption" color={colors.textMuted}>
        {formatDate(item.created_at)}
      </Typography>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inbox" size={48} color={colors.textMuted} />
      <Typography variant="body" color={colors.textMuted} style={styles.emptyText}>
        No feedback submitted yet
      </Typography>
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Feedback')}
      >
        <Typography variant="body" color="#fff">
          Send Feedback
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="heading">Previous Feedback</Typography>
      </View>

      <FlatList
        data={feedbackList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { padding: spacing.m },
          feedbackList.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backButton: {
    padding: 8,
  },
  listContent: {
    gap: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  feedbackItem: {
    padding: 16,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
