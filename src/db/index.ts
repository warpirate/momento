import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import migrations from './migrations';
import Entry from './model/Entry';
import EntrySignal from './model/EntrySignal';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment out migrations if you haven't created them yet)
  migrations,
  jsi: true, /* Platform.OS === 'ios' */
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
    console.error('Database failed to load', error);
  },
  // Enable better sync performance
  // useIncrementalIndexedDB: true, // Commented out as it may not be supported in this version
});

export const database = new Database({
  adapter,
  modelClasses: [
    Entry,
    EntrySignal,
  ],
});