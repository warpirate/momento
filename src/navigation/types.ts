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
};

export type MainTabParamList = {
  Journal: undefined;
  Insights: undefined;
  Calendar: undefined;
  Search: undefined;
};