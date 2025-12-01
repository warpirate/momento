import { migrations } from '@nozbe/watermelondb/Schema';

export default migrations([
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
]);