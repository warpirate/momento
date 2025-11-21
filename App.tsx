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
import {AuthScreen} from './src/screens/AuthScreen';
import {JournalScreen} from './src/screens/JournalScreen';

function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

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
      <View style={{flex: 1, backgroundColor: '#030712', justifyContent: 'center'}}>
        <ActivityIndicator color="#A4BCFD" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      {session?.user ? <JournalScreen userId={session.user.id} /> : <AuthScreen />}
    </>
  );
}

export default App;
