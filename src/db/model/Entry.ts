import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';
import { generateUUID } from '../../lib/uuid';

export default class Entry extends Model {
  static table = 'entries';
  static associations = {
    entry_signals: { type: 'has_many', foreignKey: 'entry_id' },
  } as const;

  @field('content') content!: string;
  @field('user_id') userId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('entry_signals') signals!: any;

  // Use centralized UUID generation
  static async generateId() {
    return generateUUID();
  }
}