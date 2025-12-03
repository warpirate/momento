import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from './types';
import { View, Text, Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/theme';
import { useEffect, useRef } from 'react';

// Screens
import AuthScreen from '../screens/AuthScreen';
import JournalScreenWrapper from '../screens/JournalScreen';
import InsightsScreen from '../screens/InsightsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SearchScreen from '../screens/SearchScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecentEntriesScreen from '../screens/RecentEntriesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);
const AnimatedText = Animated.createAnimatedComponent(Text);

function TabBarIcon({ 
  route, 
  isFocused, 
  color, 
  onPress 
}: { 
  route: string; 
  isFocused: boolean; 
  color: string; 
  onPress: () => void 
}) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.2 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(isFocused ? -2 : 0)).current;
  const labelOpacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.2 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Rotation animation for specific tabs
    if (isFocused) {
      if (route === 'Journal') {
        // Wiggle animation for edit icon
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -0.1, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
      } else if (route === 'Insights') {
        // Pulse animation for chart icon
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        ]).start();
      } else if (route === 'Calendar') {
        // Subtle bounce animation for calendar
        Animated.sequence([
          Animated.timing(translateYAnim, { toValue: -4, duration: 200, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: -2, duration: 200, useNativeDriver: true }),
        ]).start();
      } else if (route === 'Search') {
        // Rotate animation for search
        Animated.timing(rotateAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
      }
    } else {
      // Reset animations when not focused
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }

    // Label opacity animation
    Animated.timing(labelOpacityAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Translate Y animation (keep bubble within tab bar)
    Animated.spring(translateYAnim, {
      toValue: isFocused ? -2 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isFocused, route]);

  let iconName = 'circle';
  if (route === 'Journal') iconName = 'edit-3';
  else if (route === 'Insights') iconName = 'bar-chart-2';
  else if (route === 'Calendar') iconName = 'calendar';
  else if (route === 'Search') iconName = 'search';

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.tabContainer}>
        <AnimatedView 
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: scaleAnim }, 
                { translateY: translateYAnim },
                { rotate }
              ],
              backgroundColor: isFocused ? `${color}15` : 'transparent',
            }
          ]}
        >
          <AnimatedIcon 
            name={iconName} 
            size={20} 
            color={color}
            style={{
              transform: [{ scale: scaleAnim }]
            }}
          />
        </AnimatedView>
        <AnimatedText 
          style={[
            styles.label,
            { 
              color,
              opacity: labelOpacityAnim,
              transform: [{ translateY: isFocused ? 0 : 10 }]
            }
          ]}
        >
          {route}
        </AnimatedText>
      </View>
    </TouchableWithoutFeedback>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) => (
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.surfaceHighlight }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const color = isFocused ? colors.primary : colors.textMuted;

            return (
              <TabBarIcon
                key={route.key}
                route={route.name}
                isFocused={isFocused}
                color={color}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      )}
    >
      <Tab.Screen name="Journal" component={JournalScreenWrapper} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

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
            <Stack.Screen name="RecentEntries" component={RecentEntriesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}