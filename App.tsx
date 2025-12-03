/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {Session} from '@supabase/supabase-js';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';

import {supabase} from './src/lib/supabaseClient';
import {Navigation} from './src/navigation';
import {Logo} from './src/components/ui/Logo';
import {ThemeProvider} from './src/theme/ThemeContext';
import {useTheme} from './src/theme/theme';
import { SyncProvider } from './src/lib/SyncContext';

function AppContent(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session ?? null);
      setInitializing(false);
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}}>
        <Logo size="xlarge" />
        <ActivityIndicator color={colors.primary} style={{marginTop: 24}} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={colors.background === '#0F172A' ? 'light-content' : 'dark-content'} />
      <Navigation session={session} />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </ThemeProvider>
  );
}

export default App;
