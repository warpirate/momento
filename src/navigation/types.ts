import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  EntryDetail: { entryId: string };
  EditEntry: { entryId: string };
  Settings: undefined;
  Profile: undefined;
  RecentEntries: undefined;
  DailyEntries: { date: string };
  Camera: { onMediaCaptured: (uri: string, type: 'photo' | 'video') => void };
  Search: undefined;
  Insights: undefined;
  NotificationSettings: undefined;
  Feedback: undefined;
  PreviousFeedback: undefined;
  FeedbackDetail: { feedbackId: string };
};

export type MainTabParamList = {
  Journal: undefined;
  History: undefined;
  Profile: undefined;
};