import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db';
import { supabase } from './supabaseClient';

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const { data, error } = await supabase.rpc('pull_changes', {
        last_pulled_at: lastPulledAt,
        schema_version: schemaVersion,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { changes, timestamp } = data;
      return { changes, timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      const { error } = await supabase.rpc('push_changes', {
        changes,
        last_pulled_at: lastPulledAt,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    // Migrations are not configured for the local database yet, so we disable
    // migration-based sync. This avoids WatermelonDB's
    // "[Sync] Migration syncs cannot be enabled on a database that does not support migrations"
    // diagnostic error.
  });
}