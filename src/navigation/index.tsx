import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from './types';
import { Image, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';

// Screens
import AuthScreen from '../screens/AuthScreen';
import JournalScreenWrapper from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SearchScreen from '../screens/SearchScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceHighlight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'circle';
          if (route.name === 'Journal') iconName = 'edit-3';
          else if (route.name === 'Insights') iconName = 'bar-chart-2';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Search') iconName = 'search';
          
          return <Icon name={iconName} size={24} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          return null; // Hide labels for cleaner look, or uncomment below
          /*
          let label;
          if (route.name === 'Journal') label = 'Journal';
          else if (route.name === 'Insights') label = 'Insights';
          else if (route.name === 'Calendar') label = 'Calendar';
          else if (route.name === 'Search') label = 'Search';
          return <Text style={{ color, fontSize: 10, marginTop: 4 }}>{label}</Text>;
          */
        }
      })}
    >
      <Tab.Screen
        name="Journal"
        component={JournalScreenWrapper}
        options={{
          tabBarLabel: 'Journal',
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: 'Insights',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
    </Tab.Navigator>
  );
}

export function Navigation({ session }: { session: any }) {
  // Runtime guardrails: if any of these are undefined, log loudly so we see it
  console.log('Navigation screens types:', {
    AuthScreen: typeof AuthScreen,
    MainTabs: typeof MainTabs,
    EntryDetailScreen: typeof EntryDetailScreen,
    SettingsScreen: typeof SettingsScreen,
    ProfileScreen: typeof ProfileScreen,
  });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}