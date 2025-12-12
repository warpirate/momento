import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import { version as appVersion } from '../../package.json';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export interface FeedbackData {
  feedback_type: 'bug' | 'feature' | 'general' | 'improvement';
  title: string;
  content: string;
  rating?: number;
}

export const submitFeedback = async (feedbackData: FeedbackData) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      throw new Error('You must be signed in to submit feedback.');
    }

    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      model: Platform.select({
        ios: 'iOS',
        android: 'Android',
        default: 'Unknown',
      }),
    };

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        ...feedbackData,
        device_info: deviceInfo,
        app_version: appVersion,
      })
      .select();

    if (error) {
      throw error;
    }

    const feedbackId = data?.[0]?.id;

    if (feedbackId) {
      createGitHubIssue(feedbackId).catch((err) => {
        console.warn('Failed to create GitHub issue (non-blocking):', err);
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit feedback' 
    };
  }
};

const createGitHubIssue = async (feedbackId: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.warn('No session for GitHub issue creation');
    return;
  }

  const supabaseUrl = SUPABASE_URL.startsWith('http')
    ? SUPABASE_URL
    : `https://${SUPABASE_URL}`;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/create-feedback-issue`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ feedback_id: feedbackId }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Edge function error: ${text}`);
  }

  return response.json();
};