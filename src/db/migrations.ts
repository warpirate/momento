import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
  {
    // Version 3: Add rating fields to entries
    toVersion: 3,
    steps: [
      {
        type: 'add_columns',
        table: 'entries',
        columns: [
          { name: 'sleep_rating', type: 'number', isOptional: true },
          { name: 'energy_rating', type: 'number', isOptional: true },
          { name: 'mood_rating', type: 'string', isOptional: true },
        ],
      },
    ],
  },
  {
    // Version 4: Add images field to entries
    toVersion: 4,
    steps: [
      {
        type: 'add_columns',
        table: 'entries',
        columns: [
          { name: 'images', type: 'string', isOptional: true },
        ],
      },
    ],
  },
  {
    // Version 5: Add voice_note field to entries
    toVersion: 5,
    steps: [
      {
        type: 'add_columns',
        table: 'entries',
        columns: [
          { name: 'voice_note', type: 'string', isOptional: true },
        ],
      },
    ],
  },
  {
    // Version 6: Clean up database - entry_signals table removed from schema
    toVersion: 6,
    steps: [
      // No steps needed - table removed from schema, WatermelonDB will handle cleanup
    ],
  },
  ],
});