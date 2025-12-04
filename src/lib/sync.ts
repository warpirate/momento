import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { supabase } from './supabaseClient';
import { generateUUID, isValidUUID } from './uuid';
import { RealtimeChannel } from '@supabase/supabase-js';

let syncInProgress = false;

export async function sync() {
  if (syncInProgress) {
    console.log('Sync already in progress, skipping...');
    return;
  }

  syncInProgress = true;
  try {
    console.log('Starting sync...');
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        console.log('Pulling changes...', { lastPulledAt, schemaVersion });
        
        // Add debug info about authentication
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session ? 'authenticated' : 'not authenticated');
        if (session) {
          console.log('User ID:', session.user.id);
        }
        
        // Force a fresh pull by using a slightly older timestamp to avoid cache issues
        const freshLastPulledAt = lastPulledAt ? lastPulledAt - 1000 : 0;
        console.log('Using fresh timestamp:', freshLastPulledAt);
        
        const { data, error } = await supabase.rpc('pull_changes', {
          last_pulled_at: freshLastPulledAt,
          schema_version: schemaVersion,
        });

        if (error) {
          console.error('Pull changes error:', error);
          throw new Error(error.message);
        }

        const { changes, timestamp } = data;
        console.log('Pulled changes:', changes);

        // Fix for "Server wants client to create record... but it already exists locally"
        // Check if any "created" entries already exist locally and move them to "updated"
        if (changes.entries?.created?.length > 0) {
          const createdIds = changes.entries.created.map((e: any) => e.id);
          try {
            const existingRecords = await database.get('entries').query(Q.where('id', Q.oneOf(createdIds))).fetch();
            const existingIds = new Set(existingRecords.map(r => r.id));

            if (existingIds.size > 0) {
              console.log('Found existing records in created list, moving to updated:', Array.from(existingIds));
              const newCreated: any[] = [];
              const newUpdated = changes.entries.updated || [];

              for (const entry of changes.entries.created) {
                if (existingIds.has(entry.id)) {
                  newUpdated.push(entry);
                } else {
                  newCreated.push(entry);
                }
              }

              changes.entries.created = newCreated;
              changes.entries.updated = newUpdated;
            }
          } catch (err) {
            console.warn('Error checking for existing records:', err);
          }
        }

        console.log('Timestamp from server:', timestamp);
        return { changes, timestamp: Math.floor(timestamp) };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        console.log('Pushing changes...', { changes, lastPulledAt });
        
        // Get the current authenticated user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Not authenticated. Cannot push changes.');
        }
        const authenticatedUserId = session.user.id;
        
        console.log('Changes to push details:', JSON.stringify(changes, null, 2));
        
        // Validate UUIDs and fix if needed, and ensure timestamps are integers
        // NOTE: user_id should NEVER be regenerated - it must match the authenticated user
        // The server will use auth.uid() anyway, but we ensure consistency here
        const validatedChanges = JSON.parse(JSON.stringify(changes, (key, value) => {
          // Only validate 'id' and 'entry_id' - these can be regenerated if invalid
          if (key === 'id' || key === 'entry_id') {
            if (typeof value === 'string' && !isValidUUID(value)) {
              console.warn(`Invalid UUID detected for ${key}: ${value}. Generating new UUID.`);
              return generateUUID();
            }
          }
          // For user_id, if invalid, use the authenticated user's ID instead of generating a random one
          // This ensures all entries belong to the correct user account
          if (key === 'user_id') {
            if (typeof value === 'string' && !isValidUUID(value)) {
              console.warn(`Invalid user_id detected: ${value}. Using authenticated user ID: ${authenticatedUserId}`);
              return authenticatedUserId;
            }
            // Even if valid, ensure it matches the authenticated user (server will override anyway, but this prevents confusion)
            if (typeof value === 'string' && value !== authenticatedUserId) {
              console.warn(`user_id mismatch. Local: ${value}, Authenticated: ${authenticatedUserId}. Using authenticated user ID.`);
              return authenticatedUserId;
            }
          }
          // Ensure all timestamp values are integers, not floats
          if (key === 'created_at' || key === 'updated_at' || key === 'last_pulled_at') {
            return typeof value === 'number' ? Math.floor(value) : value;
          }
          return value;
        }));
        
        const sanitizedLastPulledAt = Math.floor(lastPulledAt || 0);
        
        console.log('Validated changes:', JSON.stringify(validatedChanges, null, 2));
        console.log('Last pulled at (sanitized):', sanitizedLastPulledAt);
        
        const { error, data } = await supabase.rpc('push_changes', {
          changes: validatedChanges,
          last_pulled_at: sanitizedLastPulledAt,
        });

        if (error) {
          console.error('Push changes error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw new Error(error.message);
        }
        console.log('Push successful. Response:', data);
      },
      // Migrations are not configured for the local database yet, so we disable
      // migration-based sync. This avoids WatermelonDB's
      // "[Sync] Migration syncs cannot be enabled on a database that does not support migrations"
      // diagnostic error.
      conflictResolver: (table, local, remote, resolved) => {
        console.log(`Conflict detected in ${table}:`, { local, remote, resolved });
        return resolved;
      },
    });
    console.log('Sync completed successfully');
  } catch (error) {
    console.warn('Sync failed:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error; // Re-throw to let calling code handle it
  } finally {
    syncInProgress = false;
  }
}

let subscription: RealtimeChannel | null = null;

export function setupRealtimeSubscription(userId: string) {
  if (subscription) {
    return () => {};
  }

  console.log('Setting up realtime subscription for user:', userId);

  subscription = supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log('Realtime change detected in entries:', payload);
        sync();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entry_signals' },
      (payload) => {
        console.log('Realtime change detected in entry_signals:', payload);
        sync();
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  return () => {
    if (subscription) {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(subscription);
      subscription = null;
    }
  };
}