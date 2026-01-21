import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 6,
  tables: [
    tableSchema({
      name: 'entries',
      columns: [
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'number' }, // Store as timestamp
        { name: 'updated_at', type: 'number' },
        { name: 'user_id', type: 'string' },
        { name: 'sleep_rating', type: 'number', isOptional: true },
        { name: 'energy_rating', type: 'number', isOptional: true },
        { name: 'mood_rating', type: 'string', isOptional: true },
        { name: 'images', type: 'string', isOptional: true }, // JSON stringified array of paths
        { name: 'voice_note', type: 'string', isOptional: true }, // Path to voice note file
      ],
    }),
  ],
});