import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
  {
    // Version 2: Add mood field to entry_signals
    toVersion: 2,
    steps: [
      {
        type: 'add_columns',
        table: 'entry_signals',
        columns: [
          { name: 'mood', type: 'string', isOptional: true },
        ],
      },
    ],
  },
  ],
});