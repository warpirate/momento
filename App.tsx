/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {Session} from '@supabase/supabase-js';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, View, LogBox} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {supabase} from './src/lib/supabaseClient';
import {Navigation} from './src/navigation';
import {Logo} from './src/components/ui/Logo';
import {ThemeProvider} from './src/theme/ThemeContext';
import {useTheme} from './src/theme/theme';
import {SyncProvider} from './src/lib/SyncContext';
import {AlertProvider} from './src/context/AlertContext';
import {NotificationProvider} from './src/context/NotificationContext';
import {NotificationToast} from './src/components/NotificationToast';
import {WhatsNewModal} from './src/components/ui/WhatsNewModal';
import {getWhatsNewToShow, markWhatsNewSeen, WhatsNewPayload} from './src/lib/whatsNew';

function AppContent(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const {colors} = useTheme();

  const [whatsNew, setWhatsNew] = useState<WhatsNewPayload | null>(null);
  const [isWhatsNewVisible, setIsWhatsNewVisible] = useState(false);

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

  useEffect(() => {
    if (initializing) return;

    let isMounted = true;
    (async () => {
      const payload = await getWhatsNewToShow();
      if (!isMounted || !payload) return;
      setWhatsNew(payload);
      setIsWhatsNewVisible(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [initializing]);

  const closeWhatsNew = async () => {
    if (whatsNew) {
      await markWhatsNewSeen(whatsNew.version);
    }
    setIsWhatsNewVisible(false);
  };

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
      {whatsNew && (
        <WhatsNewModal
          visible={isWhatsNewVisible}
          content={whatsNew}
          onClose={closeWhatsNew}
        />
      )}
    </>
  );
}

// Ignore specific warnings
LogBox.ignoreLogs([
  'JSI SQLiteAdapter not available',
]);

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <NotificationProvider>
            <SyncProvider>
              <AppContent />
              <NotificationToast />
            </SyncProvider>
          </NotificationProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
