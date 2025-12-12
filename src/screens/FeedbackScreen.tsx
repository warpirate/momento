import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';
import { submitFeedback, FeedbackData } from '../lib/feedbackService';
import { haptics } from '../lib/haptics';

type FeedbackScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Feedback'>;

const feedbackTypes = [
  { id: 'bug', label: 'Bug Report', icon: 'alert-circle' },
  { id: 'feature', label: 'Feature Request', icon: 'plus-circle' },
  { id: 'improvement', label: 'Improvement', icon: 'trending-up' },
  { id: 'general', label: 'General Feedback', icon: 'message-circle' },
] as const;

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const { colors, spacing, borderRadius } = useTheme();
  
  const [selectedType, setSelectedType] = useState<FeedbackData['feedback_type']>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please fill in both the title and content fields.');
      return;
    }

    setIsSubmitting(true);
    haptics.medium();

    const feedbackData: FeedbackData = {
      feedback_type: selectedType,
      title: title.trim(),
      content: content.trim(),
      rating: rating > 0 ? rating : undefined,
    };

    try {
      const result = await submitFeedback(feedbackData);
      
      if (result.success) {
        haptics.success();
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        haptics.error();
        Alert.alert('Error', result.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      haptics.error();
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="heading">Send Feedback</Typography>
      </View>

      <ScrollView style={[styles.content, { padding: spacing.m }]}>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="subheading" style={styles.sectionTitle}>
            Feedback Type
          </Typography>
          <View style={styles.typeContainer}>
            {feedbackTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: selectedType === type.id ? colors.primary + '20' : colors.background,
                    borderColor: selectedType === type.id ? colors.primary : colors.surfaceHighlight,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setSelectedType(type.id);
                  haptics.selection();
                }}
              >
                <Icon 
                  name={type.icon} 
                  size={20} 
                  color={selectedType === type.id ? colors.primary : colors.textMuted} 
                />
                <Typography 
                  variant="body" 
                  color={selectedType === type.id ? colors.primary : colors.textPrimary}
                  style={styles.typeLabel}
                >
                  {type.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="subheading" style={styles.sectionTitle}>
            Title
          </Typography>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.surfaceHighlight,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Brief summary of your feedback"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Typography variant="caption" color={colors.textMuted} style={styles.characterCount}>
            {title.length}/100
          </Typography>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="subheading" style={styles.sectionTitle}>
            Details
          </Typography>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.background,
                borderColor: colors.surfaceHighlight,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Please provide more details about your feedback..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Typography variant="caption" color={colors.textMuted} style={styles.characterCount}>
            {content.length}/1000
          </Typography>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight, borderRadius: borderRadius.l }]}>
          <Typography variant="subheading" style={styles.sectionTitle}>
            Rating (Optional)
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.ratingDescription}>
            How would you rate your experience with the app?
          </Typography>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  haptics.selection();
                }}
              >
                <Icon
                  name="star"
                  size={32}
                  color={star <= rating ? '#FFD700' : colors.surfaceHighlight}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Submit Feedback"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!title.trim() || !content.trim() || isSubmitting}
          style={styles.submitButton}
        />
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
  section: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  characterCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  ratingDescription: {
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});