import { Model } from '@nozbe/watermelondb';
import { date, field, json, relation } from '@nozbe/watermelondb/decorators';
import { generateUUID } from '../../lib/uuid';
import Entry from './Entry';

const sanitize = (raw: any) => (Array.isArray(raw) ? raw : []);

export default class EntrySignal extends Model {
  static table = 'entry_signals';
  static associations = {
    entries: { type: 'belongs_to', key: 'entry_id' },
  } as const;

  @relation('entries', 'entry_id') entry!: Entry;
  
  @field('mood') mood!: string;
  @json('activities', sanitize) activities!: string[];
  @json('people', sanitize) people!: string[];
  @field('sentiment_score') sentimentScore!: number;
  @json('tags', sanitize) tags!: string[];
  @date('created_at') createdAt!: Date;

  // Generate UUID based on entry ID for consistency
  static async generateId() {
    // EntrySignal IDs are generated in Supabase, but we'll use random UUIDs for local cache
    return generateUUID();
  }
  
  // Helper method to generate UUID with entry context
  static generateIdWithEntry(entryId: string) {
    return generateUUID(entryId);
  }
}