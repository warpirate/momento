import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sync as runSync } from './sync';

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


