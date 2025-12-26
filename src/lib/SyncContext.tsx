import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sync as runSync, setupRealtimeSubscription } from './sync';
import { supabase } from './supabaseClient';

type SyncContextValue = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  hasUnsyncedEntries: boolean;
  showSyncPrompt: boolean;
  showSyncSuccess: boolean;
  sync: () => Promise<void>;
  markHasUnsyncedEntries: () => void;
};

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [hasUnsyncedEntries, setHasUnsyncedEntries] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Track network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);

      // When we come back online and know we have local changes, surface a sync prompt.
      if (online && hasUnsyncedEntries) {
        setShowSyncPrompt(true);
      }
    });

    return () => unsubscribe();
  }, [hasUnsyncedEntries]);

  // Perform initial sync and setup realtime subscription when provider mounts
  useEffect(() => {
    let unsubscribeRealtime: (() => void) | null = null;

    const initializeSync = async () => {
      if (!initialSyncDone && isOnline) {
        console.log('SyncProvider: Performing initial sync on mount...');
        setInitialSyncDone(true);
        
        try {
          // Get current user session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.id) {
            console.log('SyncProvider: User authenticated, setting up sync and realtime');
            
            // Perform initial sync
            await runSync();
            console.log('SyncProvider: Initial sync completed successfully');
            setLastSyncAt(new Date());
            
            // Setup realtime subscription for automatic sync
            unsubscribeRealtime = setupRealtimeSubscription(session.user.id);
            console.log('SyncProvider: Realtime subscription established');
          } else {
            console.log('SyncProvider: No authenticated user, skipping sync');
          }
        } catch (err) {
          console.warn('SyncProvider: Initial sync failed', err);
        }
      }
    };

    initializeSync();

    return () => {
      if (unsubscribeRealtime) {
        console.log('SyncProvider: Cleaning up realtime subscription');
        unsubscribeRealtime();
      }
    };
  }, [initialSyncDone, isOnline]);

  const sync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setShowSyncPrompt(false);

    try {
      await runSync();
      setLastSyncAt(new Date());
      setHasUnsyncedEntries(false);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 1800);
    } catch (e) {
      console.warn('SyncContext sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const markHasUnsyncedEntries = () => {
    setHasUnsyncedEntries(true);
    if (isOnline) {
      setShowSyncPrompt(true);
    }
  };

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      lastSyncAt,
      hasUnsyncedEntries,
      showSyncPrompt,
      showSyncSuccess,
      sync,
      markHasUnsyncedEntries,
    }),
    [isOnline, isSyncing, lastSyncAt, hasUnsyncedEntries, showSyncPrompt, showSyncSuccess],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return ctx;
}


