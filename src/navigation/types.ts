import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  EntryDetail: { entryId: string };
  Settings: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Journal: undefined;
  Insights: undefined;
  Calendar: undefined;
  Search: undefined;
};