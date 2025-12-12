import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';
import { TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabaseClient';

type FeedbackDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackDetail'>;
type FeedbackDetailScreenRouteProp = RouteProp<RootStackParamList, 'FeedbackDetail'>;

interface FeedbackData {
  id: string;
  feedback_type: string;
  title: string;
  content: string;
  rating: number | null;
  status: string;
  created_at: string;
  app_version: string | null;
}

interface FeedbackMessage {
  id: string;
  message: string;
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

export default function FeedbackDetailScreen() {
  const navigation = useNavigation<FeedbackDetailScreenNavigationProp>();
  const route = useRoute<FeedbackDetailScreenRouteProp>();
  const { feedbackId } = route.params;
  const { colors, spacing, borderRadius } = useTheme();

  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const [feedbackRes, messagesRes] = await Promise.all([
      supabase
        .from('feedback')
        .select('id, feedback_type, title, content, rating, status, created_at, app_version')
        .eq('id', feedbackId)
        .single(),
      supabase
        .from('feedback_messages')
        .select('id, message, created_at')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true }),
    ]);

    if (!feedbackRes.error && feedbackRes.data) {
      setFeedback(feedbackRes.data);
    }
    if (!messagesRes.error && messagesRes.data) {
      setMessages(messagesRes.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [feedbackId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  if (loading || !feedback) {
    return (
      <ScreenLayout>
        <View style={[styles.header, { padding: spacing.m }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Typography variant="heading">Feedback Details</Typography>
        </View>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color={colors.textMuted}>
            Loading...
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="heading">Feedback Details</Typography>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: spacing.m }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={styles.typeContainer}>
              <Icon name={getTypeIcon(feedback.feedback_type)} size={18} color={colors.primary} />
              <Typography variant="caption" color={colors.textMuted}>
                {feedback.feedback_type.charAt(0).toUpperCase() + feedback.feedback_type.slice(1)}
              </Typography>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: (statusColors[feedback.status] || statusColors.new) + '20' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColors[feedback.status] || statusColors.new },
                ]}
              />
              <Typography
                variant="caption"
                style={[styles.statusText, { color: statusColors[feedback.status] || statusColors.new }]}
              >
                {statusLabels[feedback.status] || 'New'}
              </Typography>
            </View>
          </View>

          <Typography variant="subheading" style={styles.title}>
            {feedback.title}
          </Typography>

          <Typography variant="body" color={colors.textSecondary} style={styles.contentText}>
            {feedback.content}
          </Typography>

          {feedback.rating && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name="star"
                  size={18}
                  color={star <= feedback.rating! ? '#FFD700' : colors.surfaceHighlight}
                />
              ))}
            </View>
          )}

          <View style={styles.metaRow}>
            <Typography variant="caption" color={colors.textMuted}>
              Submitted {formatDate(feedback.created_at)}
            </Typography>
            {feedback.app_version && (
              <Typography variant="caption" color={colors.textMuted}>
                v{feedback.app_version}
              </Typography>
            )}
          </View>
        </View>

        {messages.length > 0 && (
          <View style={styles.messagesSection}>
            <Typography variant="subheading" style={styles.messagesTitle}>
              Responses
            </Typography>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.m },
                ]}
              >
                <View style={styles.messageHeader}>
                  <Icon name="message-circle" size={14} color={colors.primary} />
                  <Typography variant="caption" color={colors.textMuted}>
                    Team Response
                  </Typography>
                </View>
                <Typography variant="body" style={styles.messageText}>
                  {msg.message}
                </Typography>
                <Typography variant="caption" color={colors.textMuted}>
                  {formatDate(msg.created_at)}
                </Typography>
              </View>
            ))}
          </View>
        )}

        {messages.length === 0 && (
          <View style={styles.noMessagesContainer}>
            <Icon name="clock" size={24} color={colors.textMuted} />
            <Typography variant="body" color={colors.textMuted} style={styles.noMessagesText}>
              No responses yet. We'll update you here when there's news.
            </Typography>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 12,
  },
  contentText: {
    marginBottom: 12,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  messagesSection: {
    marginTop: 24,
  },
  messagesTitle: {
    marginBottom: 12,
  },
  messageCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  messageText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  noMessagesContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  noMessagesText: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
